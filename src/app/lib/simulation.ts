import type { FinancialData, StrategySettings } from '../components/CastleDefense';
import { COST_PER_EMPLOYEE } from './finance';

export interface SimulationMonthResult {
  month: number;
  revenue: number;
  burn: number;
  profit: number;
  cash: number;
  runway: number;
}

export interface SimulationSummary {
  results: SimulationMonthResult[];
  finalResult: SimulationMonthResult;
  isSuccess: boolean;
  breakEvenMonth: number;
  cashoutMonth: number;
  peakCashMonth: number;
}

export function simulateFinancialTimeline(
  initialData: FinancialData,
  settings: StrategySettings,
  months = 24
): SimulationMonthResult[] {
  const results: SimulationMonthResult[] = [];
  let currentCash = initialData.cash;
  let currentRevenue = initialData.monthlyRevenue;
  const nextEmployees = Math.max(0, initialData.employees + settings.headcountChange);
  const employeeCost = nextEmployees * COST_PER_EMPLOYEE;
  const marketingCost = initialData.marketingCost * (1 + settings.marketingIncrease / 100);
  const fixedCost = initialData.officeCost;

  for (let month = 1; month <= months; month += 1) {
    currentRevenue = currentRevenue * (1 + settings.revenueGrowth / 1200);
    if (month === 1) {
      currentRevenue = currentRevenue * (1 + settings.priceIncrease / 100);
    }

    const totalBurn = employeeCost + marketingCost + fixedCost;
    const profit = currentRevenue - totalBurn;
    currentCash += profit;

    results.push({
      month,
      revenue: currentRevenue,
      burn: totalBurn,
      profit,
      cash: currentCash,
      runway: totalBurn <= 0 ? Infinity : currentCash / totalBurn,
    });
  }

  return results;
}

export function summarizeSimulation(
  initialData: FinancialData,
  settings: StrategySettings,
  months = 24
): SimulationSummary {
  const results = simulateFinancialTimeline(initialData, settings, months);
  const finalResult = results[results.length - 1];
  const breakEvenMonth = results.findIndex((result) => result.profit > 0);
  const cashoutMonth = results.findIndex((result) => result.cash <= 0);
  const peakCashMonth = results.reduce(
    (currentMaxIndex, result, index) =>
      result.cash > results[currentMaxIndex].cash ? index : currentMaxIndex,
    0
  );

  return {
    results,
    finalResult,
    isSuccess: finalResult.cash > initialData.cash && finalResult.runway > 6,
    breakEvenMonth,
    cashoutMonth,
    peakCashMonth,
  };
}
