import { useEffect, useState } from 'react';
import { MainDashboard } from './MainDashboard';
import { ScenarioSelector } from './ScenarioSelector';
import { StrategyPanel } from './StrategyPanel';
import { SimulationResult } from './SimulationResult';
import {
  CharacterChoiceScreen,
  type RepresentativeVariant,
} from './character/CharacterChoiceScreen';
import {
  COST_PER_EMPLOYEE,
  computeMonthlyBurn,
  computePersonnelCost,
  computeRunway,
} from '../lib/finance';
import {
  getAiHealthCheck,
  type AiHealthCheckResult,
  type AiRecommendationResult,
  type AiStrategyRecommendation,
} from '../lib/aiStrategyAdvisor';
import {
  ensureWorkspace,
  fetchLatestMetricSnapshot,
  insertAiActionLog,
  insertAiBrief,
  insertSimulationRun,
  listRecentMetricSnapshots,
  upsertMetricSnapshot,
  type CfoMetricSnapshotRecord,
} from '../lib/cfoStorage';
import { isSupabaseConfigured } from '../lib/supabase';
import { summarizeSimulation } from '../lib/simulation';
import { FinancialEditDialog, type FinancialEditValues } from './FinancialEditDialog';
import {
  CostEditDialog,
  type CostEditValues,
  type EditableCostTarget,
} from './CostEditDialog';
import {
  ScenarioEditDialog,
  type EditableScenarioId,
  type ScenarioCardCopy,
} from './ScenarioEditDialog';

const STORAGE_VARIANT = 'cfotool_representative_variant';
const STORAGE_CHOSEN = 'cfotool_character_chosen';
const SNAPSHOT_LIMIT = 6;

const DEFAULT_FINANCIAL_VALUES: FinancialEditValues = {
  cash: 150_000_000,
  monthlyRevenue: 45_000_000,
  employees: 8,
  marketingCost: 8_000_000,
  officeCost: 2_000_000,
};

export type GameMode = 'dashboard' | 'scenario' | 'strategy' | 'result';
export type ScenarioId = 'defense' | 'maintain' | 'attack';

export interface FinancialData {
  cash: number;
  monthlyRevenue: number;
  monthlyBurn: number;
  runway: number;
  employees: number;
  personnelCost: number;
  marketingCost: number;
  officeCost: number;
  historicalData: { month: string; revenue: number; burn: number }[];
}

export interface StrategySettings {
  revenueGrowth: number;
  headcountChange: number;
  marketingIncrease: number;
  priceIncrease: number;
}

export type ScenarioCopyMap = Record<ScenarioId, ScenarioCardCopy>;

const DEFAULT_SCENARIO_COPY: ScenarioCopyMap = {
  defense: {
    title: '방어적 선택',
    description: '비용 -30% 절감',
    effect: '런웨이 +5개월',
    detail: '도적군 속도 느려짐',
  },
  maintain: {
    title: '현상 유지',
    description: '현행 코스 유지',
    effect: '런웨이 4.3개월',
    detail: '보통 속도 유지',
  },
  attack: {
    title: '공격적 선택',
    description: '마케팅 +50% 투자',
    effect: '런웨이 -1.2개월',
    detail: '금화 폭증, 도적군 증가',
  },
};

const DEFAULT_STRATEGY_SETTINGS: StrategySettings = {
  revenueGrowth: 30,
  headcountChange: 2,
  marketingIncrease: 50,
  priceIncrease: 10,
};

interface CastleDefenseProps {
  userDisplayName?: string;
  companyName?: string;
  initialRepresentativeVariant?: RepresentativeVariant;
  initialWorkspaceId?: string | null;
  userId?: string;
  onRepresentativeVariantPersist?: (variant: RepresentativeVariant) => Promise<void> | void;
  onWorkspaceResolved?: (workspaceId: string) => Promise<void> | void;
}

interface PersistFinancialResult {
  data: FinancialData;
  snapshotId: string | null;
}

function getStoredVariant(): RepresentativeVariant | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(STORAGE_VARIANT);
  if (v === 'strategist' || v === 'general') return v;
  return null;
}

function getHasChosen(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_CHOSEN) === 'true';
}

function getCurrentSnapshotMonth(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

function formatSnapshotMonth(snapshotMonth: string): string {
  const parts = snapshotMonth.split('-');
  const month = Number(parts[1] ?? '1');
  return `${month}월`;
}

function buildFinancialData(
  values: FinancialEditValues,
  historicalData: FinancialData['historicalData'] = []
): FinancialData {
  const cash = Math.max(0, Math.round(values.cash));
  const monthlyRevenue = Math.max(0, Math.round(values.monthlyRevenue));
  const employees = Math.max(0, Math.round(values.employees));
  const marketingCost = Math.max(0, Math.round(values.marketingCost));
  const officeCost = Math.max(0, Math.round(values.officeCost));
  const personnelCost = computePersonnelCost(employees, {
    unitCost: COST_PER_EMPLOYEE,
  });
  const monthlyBurn = computeMonthlyBurn(personnelCost, marketingCost, officeCost);
  const runway = computeRunway(cash, monthlyBurn);

  return {
    cash,
    monthlyRevenue,
    monthlyBurn,
    runway,
    employees,
    personnelCost,
    marketingCost,
    officeCost,
    historicalData,
  };
}

function buildFinancialDataFromSnapshot(
  snapshot: CfoMetricSnapshotRecord,
  historicalData: FinancialData['historicalData']
): FinancialData {
  return {
    cash: snapshot.cash,
    monthlyRevenue: snapshot.monthlyRevenue,
    monthlyBurn: snapshot.monthlyBurn,
    runway: snapshot.runwayMonths,
    employees: snapshot.employees,
    personnelCost: snapshot.personnelCost,
    marketingCost: snapshot.marketingCost,
    officeCost: snapshot.officeCost,
    historicalData,
  };
}

function buildHistoricalData(
  snapshots: CfoMetricSnapshotRecord[]
): FinancialData['historicalData'] {
  return [...snapshots]
    .sort((a, b) => a.snapshotMonth.localeCompare(b.snapshotMonth))
    .slice(-SNAPSHOT_LIMIT)
    .map((snapshot) => ({
      month: formatSnapshotMonth(snapshot.snapshotMonth),
      revenue: snapshot.monthlyRevenue,
      burn: snapshot.monthlyBurn,
    }));
}

function upsertHistoryRecord(
  history: FinancialData['historicalData'],
  nextData: FinancialData,
  snapshotMonth: string
): FinancialData['historicalData'] {
  const nextRecord = {
    month: formatSnapshotMonth(snapshotMonth),
    revenue: nextData.monthlyRevenue,
    burn: nextData.monthlyBurn,
  };

  return [...history.filter((record) => record.month !== nextRecord.month), nextRecord].slice(
    -SNAPSHOT_LIMIT
  );
}

const DEFAULT_FINANCIAL_DATA = buildFinancialData(DEFAULT_FINANCIAL_VALUES);

export function CastleDefense({
  userDisplayName,
  companyName,
  initialRepresentativeVariant,
  initialWorkspaceId,
  userId,
  onRepresentativeVariantPersist,
  onWorkspaceResolved,
}: CastleDefenseProps) {
  const storageEnabled = Boolean(userId && isSupabaseConfigured);
  const [gameMode, setGameMode] = useState<GameMode>('dashboard');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('maintain');
  const [scenarioCopy, setScenarioCopy] = useState<ScenarioCopyMap>(DEFAULT_SCENARIO_COPY);
  const [moneyDialogOpen, setMoneyDialogOpen] = useState(false);
  const [costDialogTarget, setCostDialogTarget] = useState<EditableCostTarget | null>(null);
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<EditableScenarioId | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(initialWorkspaceId ?? null);
  const [currentSnapshotId, setCurrentSnapshotId] = useState<string | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [advisoryBrief, setAdvisoryBrief] = useState<AiHealthCheckResult | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryError, setAdvisoryError] = useState<string | null>(null);
  const [latestStrategySource, setLatestStrategySource] = useState<
    'manual' | 'ollama' | 'fallback' | 'command'
  >('manual');

  const [representativeVariant, setRepresentativeVariant] = useState<RepresentativeVariant>(
    () => initialRepresentativeVariant ?? getStoredVariant() ?? 'strategist'
  );
  const [showCharacterChoice, setShowCharacterChoice] = useState<boolean>(
    () => !initialRepresentativeVariant && !getHasChosen()
  );
  const [financialData, setFinancialData] = useState<FinancialData>(DEFAULT_FINANCIAL_DATA);
  const [strategySettings, setStrategySettings] = useState<StrategySettings>(
    DEFAULT_STRATEGY_SETTINGS
  );

  const applyRepresentativeVariant = (variant: RepresentativeVariant) => {
    setRepresentativeVariant(variant);
    try {
      localStorage.setItem(STORAGE_VARIANT, variant);
      localStorage.setItem(STORAGE_CHOSEN, 'true');
    } catch (_) {}
    void onRepresentativeVariantPersist?.(variant);
  };

  const handleCharacterSelect = (variant: RepresentativeVariant) => {
    applyRepresentativeVariant(variant);
    setShowCharacterChoice(false);
  };

  const refreshAdvisoryBrief = async (
    nextData = financialData,
    options?: { workspaceId?: string | null; snapshotId?: string | null }
  ) => {
    setAdvisoryLoading(true);
    setAdvisoryError(null);

    try {
      const brief = await getAiHealthCheck(nextData);
      setAdvisoryBrief(brief);

      if (storageEnabled && userId && (options?.workspaceId ?? workspaceId)) {
        try {
          await insertAiBrief({
            workspaceId: options?.workspaceId ?? workspaceId ?? '',
            userId,
            briefType: 'health_check',
            source: brief.source,
            modelName: brief.model,
            snapshotId: options?.snapshotId ?? currentSnapshotId,
            inputPayload: {
              financialData: nextData,
            },
            outputPayload: brief,
            summaryText: brief.summary,
          });
        } catch (error) {
          console.warn('[CFO Storage] health brief save skipped:', error);
        }
      }
    } catch (error) {
      console.warn('[AI Advisor] advisory refresh failed:', error);
      setAdvisoryError('참모 보고를 다시 정리하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setAdvisoryLoading(false);
    }
  };

  const persistFinancialValues = async (
    values: FinancialEditValues,
    options?: { snapshotMonth?: string; refreshAdvisory?: boolean }
  ): Promise<PersistFinancialResult> => {
    const snapshotMonth = options?.snapshotMonth ?? getCurrentSnapshotMonth();
    const baseData = buildFinancialData(values, financialData.historicalData);
    const optimisticData = {
      ...baseData,
      historicalData: upsertHistoryRecord(financialData.historicalData, baseData, snapshotMonth),
    };

    setFinancialData(optimisticData);
    setStorageError(null);

    if (!storageEnabled || !workspaceId || !userId) {
      if (options?.refreshAdvisory !== false) {
        void refreshAdvisoryBrief(optimisticData, { snapshotId: currentSnapshotId });
      }
      return {
        data: optimisticData,
        snapshotId: currentSnapshotId,
      };
    }

    try {
      const snapshot = await upsertMetricSnapshot({
        workspaceId,
        userId,
        snapshotMonth,
        cash: optimisticData.cash,
        monthlyRevenue: optimisticData.monthlyRevenue,
        employees: optimisticData.employees,
        marketingCost: optimisticData.marketingCost,
        officeCost: optimisticData.officeCost,
      });
      const recentSnapshots = await listRecentMetricSnapshots(workspaceId, SNAPSHOT_LIMIT);
      const hydrated = buildFinancialDataFromSnapshot(snapshot, buildHistoricalData(recentSnapshots));
      setCurrentSnapshotId(snapshot.id);
      setFinancialData(hydrated);

      if (options?.refreshAdvisory !== false) {
        void refreshAdvisoryBrief(hydrated, {
          workspaceId,
          snapshotId: snapshot.id,
        });
      }

      return {
        data: hydrated,
        snapshotId: snapshot.id,
      };
    } catch (error) {
      console.warn('[CFO Storage] snapshot save failed:', error);
      setStorageError('전장 기록 저장에 실패했습니다. 화면 값은 유지되지만 DB와 동기화되지 않았습니다.');

      if (options?.refreshAdvisory !== false) {
        void refreshAdvisoryBrief(optimisticData, { snapshotId: currentSnapshotId });
      }

      return {
        data: optimisticData,
        snapshotId: currentSnapshotId,
      };
    }
  };

  const ensureCurrentSnapshot = async (): Promise<PersistFinancialResult> => {
    return persistFinancialValues(
      {
        cash: financialData.cash,
        monthlyRevenue: financialData.monthlyRevenue,
        employees: financialData.employees,
        marketingCost: financialData.marketingCost,
        officeCost: financialData.officeCost,
      },
      {
        refreshAdvisory: false,
      }
    );
  };

  const handleFinancialSave = async (values: FinancialEditValues) => {
    await persistFinancialValues(values);
  };

  const handleQuickCostSave = async (values: CostEditValues) => {
    if (!costDialogTarget) return;

    if (costDialogTarget === 'personnel') {
      const nextEmployees = Math.max(0, Math.round(values.employees ?? 0));
      await persistFinancialValues({
        cash: financialData.cash,
        monthlyRevenue: financialData.monthlyRevenue,
        employees: nextEmployees,
        marketingCost: financialData.marketingCost,
        officeCost: financialData.officeCost,
      });
      return;
    }

    if (costDialogTarget === 'marketing') {
      await persistFinancialValues({
        cash: financialData.cash,
        monthlyRevenue: financialData.monthlyRevenue,
        employees: financialData.employees,
        marketingCost: values.amount,
        officeCost: financialData.officeCost,
      });
      return;
    }

    await persistFinancialValues({
      cash: financialData.cash,
      monthlyRevenue: financialData.monthlyRevenue,
      employees: financialData.employees,
      marketingCost: financialData.marketingCost,
      officeCost: values.amount,
    });
  };

  const handleOpenScenarioEditor = (scenarioId: EditableScenarioId) => {
    setEditingScenarioId(scenarioId);
    setScenarioDialogOpen(true);
  };

  const handleSaveScenarioCopy = (
    scenarioId: EditableScenarioId,
    nextCopy: ScenarioCardCopy
  ) => {
    setScenarioCopy((prev) => ({
      ...prev,
      [scenarioId]: nextCopy,
    }));
  };

  const handleStrategySettingsChange = (nextSettings: StrategySettings) => {
    setStrategySettings(nextSettings);
    setLatestStrategySource('manual');
  };

  const handleAiBriefGenerated = async (result: AiRecommendationResult) => {
    if (!storageEnabled || !workspaceId || !userId) {
      return null;
    }

    try {
      return await insertAiBrief({
        workspaceId,
        userId,
        snapshotId: currentSnapshotId,
        briefType: 'strategy_options',
        source: result.source,
        modelName: result.model,
        inputPayload: {
          financialData,
          strategySettings,
          scenario: selectedScenario,
        },
        outputPayload: result,
        summaryText: result.message,
      });
    } catch (error) {
      console.warn('[CFO Storage] strategy brief save failed:', error);
      return null;
    }
  };

  const handleAiRecommendationApplied = async (payload: {
    briefId: string | null;
    recommendation: AiStrategyRecommendation;
    index: number;
    origin: 'manual_apply' | 'auto_apply';
  }) => {
    setLatestStrategySource(payload.recommendation.source);

    if (!storageEnabled || !workspaceId || !userId) {
      return;
    }

    try {
      await insertAiActionLog({
        workspaceId,
        userId,
        aiBriefId: payload.briefId,
        actionType: 'apply_strategy',
        actionPayload: {
          origin: payload.origin,
          index: payload.index,
          title: payload.recommendation.title,
          source: payload.recommendation.source,
          settings: payload.recommendation.settings,
          projection: payload.recommendation.projection,
        },
      });
    } catch (error) {
      console.warn('[CFO Storage] strategy action log failed:', error);
    }
  };

  const handleSimulate = async () => {
    const snapshotState = await ensureCurrentSnapshot();
    const summary = summarizeSimulation(snapshotState.data, strategySettings);

    if (storageEnabled && workspaceId && userId) {
      try {
        await insertSimulationRun({
          workspaceId,
          userId,
          snapshotId: snapshotState.snapshotId,
          scenarioId: selectedScenario,
          strategySource: latestStrategySource,
          strategyTitle: null,
          revenueGrowth: strategySettings.revenueGrowth,
          headcountChange: strategySettings.headcountChange,
          marketingIncrease: strategySettings.marketingIncrease,
          priceIncrease: strategySettings.priceIncrease,
          projectedRevenue: summary.finalResult.revenue,
          projectedBurn: summary.finalResult.burn,
          projectedProfit: summary.finalResult.profit,
          projectedRunwayMonths: summary.finalResult.runway,
          finalCash: summary.finalResult.cash,
          isSuccess: summary.isSuccess,
          timelineJson: summary.results,
        });
      } catch (error) {
        console.warn('[CFO Storage] simulation save failed:', error);
        setStorageError('시뮬레이션 결과 저장에 실패했습니다. 결과 화면은 계속 볼 수 있습니다.');
      }
    }

    setGameMode('result');
  };

  useEffect(() => {
    if (!showCharacterChoice && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_VARIANT, representativeVariant);
    }
  }, [representativeVariant, showCharacterChoice]);

  useEffect(() => {
    if (!initialRepresentativeVariant) return;
    setRepresentativeVariant(initialRepresentativeVariant);
    setShowCharacterChoice(false);
    try {
      localStorage.setItem(STORAGE_VARIANT, initialRepresentativeVariant);
      localStorage.setItem(STORAGE_CHOSEN, 'true');
    } catch (_) {}
  }, [initialRepresentativeVariant]);

  useEffect(() => {
    if (!storageEnabled || !userId) {
      setWorkspaceId(initialWorkspaceId ?? null);
      setStorageLoading(false);
      void refreshAdvisoryBrief(financialData, { snapshotId: currentSnapshotId });
      return;
    }

    let cancelled = false;
    setStorageLoading(true);
    setStorageError(null);

    const loadStorageState = async () => {
      try {
        const workspace = await ensureWorkspace({
          userId,
          companyName,
          lastWorkspaceId: initialWorkspaceId ?? null,
        });

        if (cancelled) return;

        setWorkspaceId(workspace.id);
        try {
          await onWorkspaceResolved?.(workspace.id);
        } catch (error) {
          console.warn('[CFO Storage] workspace profile sync skipped:', error);
        }

        const [latestSnapshot, recentSnapshots] = await Promise.all([
          fetchLatestMetricSnapshot(workspace.id),
          listRecentMetricSnapshots(workspace.id, SNAPSHOT_LIMIT),
        ]);

        if (cancelled) return;

        const historicalData = buildHistoricalData(recentSnapshots);
        const nextData = latestSnapshot
          ? buildFinancialDataFromSnapshot(latestSnapshot, historicalData)
          : {
              ...DEFAULT_FINANCIAL_DATA,
              historicalData,
            };

        setCurrentSnapshotId(latestSnapshot?.id ?? null);
        setFinancialData(nextData);
        void refreshAdvisoryBrief(nextData, {
          workspaceId: workspace.id,
          snapshotId: latestSnapshot?.id ?? null,
        });
      } catch (error) {
        console.warn('[CFO Storage] initial load failed:', error);
        if (!cancelled) {
          setStorageError('저장된 전장 기록을 불러오지 못했습니다. 현재 화면 값으로 계속 진행합니다.');
          void refreshAdvisoryBrief(financialData, { snapshotId: currentSnapshotId });
        }
      } finally {
        if (!cancelled) {
          setStorageLoading(false);
        }
      }
    };

    void loadStorageState();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageEnabled, userId, initialWorkspaceId, companyName]);

  return (
    <div className="w-full min-h-screen px-1 py-3 md:px-2 md:py-5">
      {(storageLoading || storageError) && (
        <div className="mx-auto mb-4 max-w-6xl px-4 md:px-5">
          {storageLoading && (
            <div className="rounded-md border border-amber-700/80 bg-amber-900/25 px-3 py-2 text-xs text-amber-100">
              저장된 전장 기록을 불러오는 중입니다.
            </div>
          )}
          {storageError && (
            <div className="mt-2 rounded-md border border-red-700/70 bg-red-900/20 px-3 py-2 text-xs text-red-100">
              {storageError}
            </div>
          )}
        </div>
      )}

      {gameMode === 'dashboard' && showCharacterChoice && (
        <CharacterChoiceScreen onSelect={handleCharacterSelect} />
      )}
      {gameMode === 'dashboard' && !showCharacterChoice && (
        <MainDashboard
          data={financialData}
          onStartScenario={() => setGameMode('scenario')}
          representativeVariant={representativeVariant}
          onRepresentativeVariantChange={applyRepresentativeVariant}
          onEditMoney={() => setMoneyDialogOpen(true)}
          onEditCost={(target) => setCostDialogTarget(target)}
          userDisplayName={userDisplayName}
          companyName={companyName}
          advisoryBrief={advisoryBrief}
          advisoryLoading={advisoryLoading}
          advisoryError={advisoryError}
          onRefreshAdvisory={() => {
            void refreshAdvisoryBrief();
          }}
        />
      )}

      {gameMode === 'scenario' && (
        <ScenarioSelector
          selectedScenario={selectedScenario}
          onSelectScenario={setSelectedScenario}
          scenarioCopy={scenarioCopy}
          financialData={financialData}
          onEditScenario={handleOpenScenarioEditor}
          onNext={() => setGameMode('strategy')}
          onSimulate={() => {
            void handleSimulate();
          }}
          onBack={() => setGameMode('dashboard')}
        />
      )}

      {gameMode === 'strategy' && (
        <StrategyPanel
          settings={strategySettings}
          onSettingsChange={handleStrategySettingsChange}
          data={financialData}
          scenario={selectedScenario}
          onSimulate={() => {
            void handleSimulate();
          }}
          onBack={() => setGameMode('scenario')}
          onAiBriefGenerated={handleAiBriefGenerated}
          onAiRecommendationApplied={handleAiRecommendationApplied}
        />
      )}

      {gameMode === 'result' && (
        <SimulationResult
          settings={strategySettings}
          scenario={selectedScenario}
          initialData={financialData}
          representativeVariant={representativeVariant}
          onRestart={() => setGameMode('dashboard')}
          onAdjust={() => setGameMode('strategy')}
        />
      )}

      <FinancialEditDialog
        open={moneyDialogOpen}
        onOpenChange={setMoneyDialogOpen}
        initialValues={{
          cash: financialData.cash,
          monthlyRevenue: financialData.monthlyRevenue,
          employees: financialData.employees,
          marketingCost: financialData.marketingCost,
          officeCost: financialData.officeCost,
        }}
        onSave={(values) => {
          void handleFinancialSave(values);
        }}
      />

      <CostEditDialog
        open={costDialogTarget !== null}
        target={costDialogTarget}
        initialAmount={
          costDialogTarget === 'personnel'
            ? financialData.personnelCost
            : costDialogTarget === 'office'
              ? financialData.officeCost
              : financialData.marketingCost
        }
        initialEmployees={financialData.employees}
        onOpenChange={(open) => {
          if (!open) setCostDialogTarget(null);
        }}
        onSave={(values) => {
          void handleQuickCostSave(values);
        }}
      />

      <ScenarioEditDialog
        open={scenarioDialogOpen}
        scenarioId={editingScenarioId}
        initialCopy={editingScenarioId ? scenarioCopy[editingScenarioId] : null}
        onOpenChange={setScenarioDialogOpen}
        onSave={handleSaveScenarioCopy}
      />
    </div>
  );
}
