import { useState, useEffect } from 'react';
import { MainDashboard } from './MainDashboard';
import { ScenarioSelector } from './ScenarioSelector';
import { StrategyPanel } from './StrategyPanel';
import { SimulationResult } from './SimulationResult';
import { CharacterChoiceScreen, type RepresentativeVariant } from './character/CharacterChoiceScreen';

const STORAGE_VARIANT = 'cfotool_representative_variant';
const STORAGE_CHOSEN = 'cfotool_character_chosen';

export type GameMode = 'dashboard' | 'scenario' | 'strategy' | 'result';

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
  const [selectedScenario, setSelectedScenario] = useState<'defense' | 'maintain' | 'attack'>('maintain');

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

  return (
    <div className="w-full min-h-screen p-4 md:p-8">
      {gameMode === 'dashboard' && showCharacterChoice && (
        <CharacterChoiceScreen onSelect={handleCharacterSelect} />
      )}
      {gameMode === 'dashboard' && !showCharacterChoice && (
        <MainDashboard
          data={financialData}
          onStartScenario={() => setGameMode('scenario')}
          representativeVariant={representativeVariant}
          onRepresentativeVariantChange={setRepresentativeVariant}
        />
      )}
      
      {gameMode === 'scenario' && (
        <ScenarioSelector
          selectedScenario={selectedScenario}
          onSelectScenario={setSelectedScenario}
          onNext={() => setGameMode('strategy')}
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
          onRestart={() => setGameMode('dashboard')}
          onAdjust={() => setGameMode('strategy')}
        />
      )}
    </div>
  );
}
