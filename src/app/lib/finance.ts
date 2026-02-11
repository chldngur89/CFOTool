/**
 * 재무 계산 및 판단 로직
 * - 금액: 인건비(월급), 마케팅비, 사무실비 등
 * - 런웨이: cash / 월 지출
 * - 판단: 런웨이 구간별 위험/주의/안전
 */

/** 인당 월 인건비 (USD) */
export const COST_PER_EMPLOYEE = 3125;

/** 런웨이 판단 기준 (개월) */
export const RUNWAY_DANGER_THRESHOLD = 3;   // 이하면 위험
export const RUNWAY_WARNING_THRESHOLD = 6;  // 이하면 주의, 초과면 안전

export type RunwayStatus = 'danger' | 'warning' | 'safe';

/**
 * 월 지출(burn) 계산
 * 인건비 + 마케팅비 + 사무실비
 */
export function computeMonthlyBurn(
  employees: number,
  marketingCost: number,
  officeCost: number
): number {
  return employees * COST_PER_EMPLOYEE + marketingCost + officeCost;
}

/**
 * 런웨이(개월) 계산
 * runway = 보유 현금 / 월 지출
 */
export function computeRunway(cash: number, monthlyBurn: number): number {
  if (monthlyBurn <= 0) return Infinity;
  return cash / monthlyBurn;
}

/**
 * 런웨이 구간 판단
 * - danger: 3개월 이하
 * - warning: 3~6개월
 * - safe: 6개월 초과
 */
export function getRunwayStatus(runway: number): RunwayStatus {
  if (runway <= RUNWAY_DANGER_THRESHOLD) return 'danger';
  if (runway <= RUNWAY_WARNING_THRESHOLD) return 'warning';
  return 'safe';
}

/**
 * 월 순이익
 */
export function computeMonthlyProfit(monthlyRevenue: number, monthlyBurn: number): number {
  return monthlyRevenue - monthlyBurn;
}

/**
 * 인건비만 계산 (직원 수 × 단가)
 */
export function computePersonnelCost(employees: number): number {
  return employees * COST_PER_EMPLOYEE;
}
