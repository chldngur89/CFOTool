import { useState, useEffect } from 'react';
import { MainDashboard } from './MainDashboard';
import { ScenarioSelector } from './ScenarioSelector';
import { StrategyPanel } from './StrategyPanel';
import { SimulationResult } from './SimulationResult';
import { CharacterChoiceScreen, type RepresentativeVariant } from './character/CharacterChoiceScreen';
import { computeMonthlyBurn, computeRunway } from '../lib/finance';
import { FinancialEditDialog, type FinancialEditValues } from './FinancialEditDialog';
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

export function CastleDefense() {
  const [gameMode, setGameMode] = useState<GameMode>('dashboard');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('maintain');
  const [scenarioCopy, setScenarioCopy] = useState<ScenarioCopyMap>(DEFAULT_SCENARIO_COPY);
  const [moneyDialogOpen, setMoneyDialogOpen] = useState(false);
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<EditableScenarioId | null>(null);

  const [representativeVariant, setRepresentativeVariant] = useState<RepresentativeVariant>(() => getStoredVariant() ?? 'strategist');
  const [showCharacterChoice, setShowCharacterChoice] = useState<boolean>(() => !getHasChosen());

  const handleCharacterSelect = (variant: RepresentativeVariant) => {
    setRepresentativeVariant(variant);
    setShowCharacterChoice(false);
    try {
      localStorage.setItem(STORAGE_VARIANT, variant);
      localStorage.setItem(STORAGE_CHOSEN, 'true');
    } catch (_) {}
  };

  useEffect(() => {
    if (!showCharacterChoice && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_VARIANT, representativeVariant);
    }
  }, [representativeVariant, showCharacterChoice]);
  
  const [financialData, setFinancialData] = useState<FinancialData>({
    cash: 150000,
    monthlyRevenue: 45000,
    monthlyBurn: 35000,
    runway: 4.3,
    employees: 8,
    marketingCost: 8000,
    officeCost: 2000,
    historicalData: [
      { month: '9월', revenue: 38000, burn: 32000 },
      { month: '10월', revenue: 42000, burn: 33000 },
      { month: '11월', revenue: 40000, burn: 36000 },
      { month: '12월', revenue: 43000, burn: 34000 },
      { month: '1월', revenue: 44000, burn: 35000 },
      { month: '2월', revenue: 45000, burn: 35000 },
    ],
  });

  const [strategySettings, setStrategySettings] = useState<StrategySettings>({
    revenueGrowth: 30,
    headcountChange: 2,
    marketingIncrease: 50,
    priceIncrease: 10,
  });

  const handleFinancialSave = (values: FinancialEditValues) => {
    setFinancialData((prev) => {
      const monthlyBurn = computeMonthlyBurn(
        values.employees,
        values.marketingCost,
        values.officeCost
      );
      const runway = computeRunway(values.cash, monthlyBurn);
      const historyLastIndex = prev.historicalData.length - 1;
      const historicalData =
        historyLastIndex >= 0
          ? prev.historicalData.map((record, index) =>
              index === historyLastIndex
                ? { ...record, revenue: values.monthlyRevenue, burn: monthlyBurn }
                : record
            )
          : prev.historicalData;

      return {
        ...prev,
        ...values,
        monthlyBurn,
        runway,
        historicalData,
      };
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
          onRepresentativeVariantChange={setRepresentativeVariant}
          onEditMoney={() => setMoneyDialogOpen(true)}
        />
      )}
      
      {gameMode === 'scenario' && (
        <ScenarioSelector
          selectedScenario={selectedScenario}
          onSelectScenario={setSelectedScenario}
          scenarioCopy={scenarioCopy}
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
