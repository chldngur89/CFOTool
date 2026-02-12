/**
 * 재무 계산 및 판단 로직
 * - 금액: 인건비(월급), 마케팅비, 사무실비 등
 * - 런웨이: cash / 월 지출
 * - 판단: 런웨이 구간별 위험/주의/안전
 */

/** 인당 월 인건비 기준값 (300만원) */
export const COST_PER_EMPLOYEE = 3_000_000;
/** 월 인건비 최소값 (직원 1명 기준과 동일) */
export const MIN_PERSONNEL_MONTHLY_COST = COST_PER_EMPLOYEE;

/** 런웨이 판단 기준 (개월) */
export const RUNWAY_DANGER_THRESHOLD = 3;   // 이하면 위험
export const RUNWAY_WARNING_THRESHOLD = 6;  // 이하면 주의, 초과면 안전

export type RunwayStatus = 'danger' | 'warning' | 'safe';

/**
 * 월 지출(burn) 계산
 * 인건비 + 마케팅비 + 사무실비
 */
export function computeMonthlyBurn(
  personnelCost: number,
  marketingCost: number,
  officeCost: number
): number {
  return personnelCost + marketingCost + officeCost;
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
export function computePersonnelCost(
  employees: number,
  {
    minimum = 0,
    unitCost = COST_PER_EMPLOYEE,
  }: { minimum?: number; unitCost?: number } = {}
): number {
  const raw = Math.max(0, employees) * unitCost;
  if (employees <= 0) return 0;
  return Math.max(minimum, raw);
}

interface KoreanMoneyOptions {
  signed?: boolean;
}

/**
 * 금액을 한국식으로 표시
 * - 예: 10,000 -> 1만원
 * - 예: 100,000,000 -> 1억원
 * - 예: 123,412,421,341,234 -> 123조 4,124억 2,134만 1,234원
 */
export function formatKoreanMoney(
  amount: number,
  { signed = false }: KoreanMoneyOptions = {}
): string {
  if (!Number.isFinite(amount)) {
    return signed ? '+0원' : '0원';
  }

  const prefix = amount < 0 ? '-' : signed && amount > 0 ? '+' : '';
  const absoluteAmount = Math.round(Math.abs(amount));

  if (absoluteAmount < 10000) {
    return `${prefix}${absoluteAmount.toLocaleString('ko-KR')}원`;
  }

  const units = [
    { value: 1_0000_0000_0000, label: '조' },
    { value: 1_0000_0000, label: '억' },
    { value: 1_0000, label: '만' },
  ] as const;

  let remaining = absoluteAmount;
  const parts: string[] = [];

  units.forEach((unit) => {
    const unitCount = Math.floor(remaining / unit.value);
    if (unitCount <= 0) return;

    parts.push(`${unitCount.toLocaleString('ko-KR')}${unit.label}`);
    remaining -= unitCount * unit.value;
  });

  if (remaining > 0) {
    parts.push(remaining.toLocaleString('ko-KR'));
  }

  return `${prefix}${parts.join(' ')}원`;
}
