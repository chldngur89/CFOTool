import { useState, useEffect } from 'react';
import { MainDashboard } from './MainDashboard';
import { ScenarioSelector } from './ScenarioSelector';
import { StrategyPanel } from './StrategyPanel';
import { SimulationResult } from './SimulationResult';
import { CharacterChoiceScreen, type RepresentativeVariant } from './character/CharacterChoiceScreen';
import {
  COST_PER_EMPLOYEE,
  computeMonthlyBurn,
  computePersonnelCost,
  computeRunway,
} from '../lib/finance';
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

interface CastleDefenseProps {
  userDisplayName?: string;
  companyName?: string;
  initialRepresentativeVariant?: RepresentativeVariant;
  onRepresentativeVariantPersist?: (variant: RepresentativeVariant) => Promise<void> | void;
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

export function CastleDefense({
  userDisplayName,
  companyName,
  initialRepresentativeVariant,
  onRepresentativeVariantPersist,
}: CastleDefenseProps) {
  const [gameMode, setGameMode] = useState<GameMode>('dashboard');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('maintain');
  const [scenarioCopy, setScenarioCopy] = useState<ScenarioCopyMap>(DEFAULT_SCENARIO_COPY);
  const [moneyDialogOpen, setMoneyDialogOpen] = useState(false);
  const [costDialogTarget, setCostDialogTarget] = useState<EditableCostTarget | null>(null);
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<EditableScenarioId | null>(null);

  const [representativeVariant, setRepresentativeVariant] = useState<RepresentativeVariant>(
    () => initialRepresentativeVariant ?? getStoredVariant() ?? 'strategist'
  );
  const [showCharacterChoice, setShowCharacterChoice] = useState<boolean>(
    () => !initialRepresentativeVariant && !getHasChosen()
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
  
  const [financialData, setFinancialData] = useState<FinancialData>({
    cash: 150000000,
    monthlyRevenue: 45000000,
    monthlyBurn: 34000000,
    runway: 4.3,
    employees: 8,
    personnelCost: 24000000,
    marketingCost: 8000000,
    officeCost: 2000000,
    historicalData: [],
  });

  const [strategySettings, setStrategySettings] = useState<StrategySettings>({
    revenueGrowth: 30,
    headcountChange: 2,
    marketingIncrease: 50,
    priceIncrease: 10,
  });

  const applyFinancialPatch = (patch: Partial<FinancialEditValues>) => {
    setFinancialData((prev) => {
      const nextValues: FinancialEditValues = {
        cash: patch.cash ?? prev.cash,
        monthlyRevenue: patch.monthlyRevenue ?? prev.monthlyRevenue,
        employees: patch.employees ?? prev.employees,
        marketingCost: patch.marketingCost ?? prev.marketingCost,
        officeCost: patch.officeCost ?? prev.officeCost,
      };
      const nextPersonnelCost = computePersonnelCost(nextValues.employees, {
        unitCost: COST_PER_EMPLOYEE,
      });

      const monthlyBurn = computeMonthlyBurn(
        nextPersonnelCost,
        nextValues.marketingCost,
        nextValues.officeCost
      );
      const runway = computeRunway(nextValues.cash, monthlyBurn);
      const historyLastIndex = prev.historicalData.length - 1;
      const historicalData =
        historyLastIndex >= 0
          ? prev.historicalData.map((record, index) =>
              index === historyLastIndex
                ? { ...record, revenue: nextValues.monthlyRevenue, burn: monthlyBurn }
                : record
            )
          : prev.historicalData;

      return {
        ...prev,
        ...nextValues,
        personnelCost: nextPersonnelCost,
        monthlyBurn,
        runway,
        historicalData,
      };
    });
  };

  const handleFinancialSave = (values: FinancialEditValues) => {
    applyFinancialPatch(values);
  };

  const handleQuickCostSave = (values: CostEditValues) => {
    if (!costDialogTarget) return;

    if (costDialogTarget === 'personnel') {
      const nextEmployees = Math.max(0, Math.round(values.employees ?? 0));
      applyFinancialPatch({
        employees: nextEmployees,
      });
      return;
    }

    if (costDialogTarget === 'marketing') {
      applyFinancialPatch({ marketingCost: values.amount });
      return;
    }

    applyFinancialPatch({ officeCost: values.amount });
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

  return (
    <div className="w-full min-h-screen px-1 py-3 md:px-2 md:py-5">
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
          onSimulate={() => setGameMode('result')}
          onBack={() => setGameMode('dashboard')}
        />
      )}
      
      {gameMode === 'strategy' && (
        <StrategyPanel
          settings={strategySettings}
          onSettingsChange={setStrategySettings}
          data={financialData}
          scenario={selectedScenario}
          onSimulate={() => setGameMode('result')}
          onBack={() => setGameMode('scenario')}
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
        onSave={handleFinancialSave}
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
        onSave={handleQuickCostSave}
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
