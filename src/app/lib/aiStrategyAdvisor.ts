import type {
  FinancialData,
  ScenarioId,
  StrategySettings,
} from '../components/CastleDefense';
import {
  COST_PER_EMPLOYEE,
  RUNWAY_DANGER_THRESHOLD,
  RUNWAY_WARNING_THRESHOLD,
  formatKoreanMoney,
} from './finance';

const STRATEGY_LIMITS = {
  revenueGrowth: { min: -50, max: 100, step: 5 },
  headcountChange: { min: -5, max: 10, step: 1 },
  marketingIncrease: { min: -50, max: 200, step: 10 },
  priceIncrease: { min: -20, max: 50, step: 5 },
} as const;

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';

const EXPLICIT_OLLAMA_BASE_URL =
  import.meta.env.VITE_OLLAMA_BASE_URL as string | undefined;

const OLLAMA_BASE_URL =
  EXPLICIT_OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL;

const OLLAMA_MODEL =
  (import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ??
  'llama3.1:latest';

const ENABLE_REMOTE_OLLAMA =
  (import.meta.env.VITE_ENABLE_REMOTE_OLLAMA as string | undefined) === 'true';

const SHOULD_LOG_AI_FALLBACK = import.meta.env.DEV;

interface OllamaRecommendationItem {
  title?: string;
  reason?: string;
  settings?: Partial<StrategySettings>;
}

interface OllamaRecommendationPayload {
  recommendations?: OllamaRecommendationItem[];
}

interface OllamaHealthCheckPayload {
  summary?: string;
  riskLabel?: string;
  keySignals?: string[];
  actions?: string[];
}

export interface StrategyProjection {
  revenue: number;
  burn: number;
  runway: number;
  profit: number;
}

export interface AiStrategyRecommendation {
  title: string;
  reason: string;
  settings: StrategySettings;
  projection: StrategyProjection;
  source: 'ollama' | 'fallback';
}

export interface AiRecommendationResult {
  recommendations: AiStrategyRecommendation[];
  source: 'ollama' | 'fallback';
  model: string;
  baseUrl: string;
  message: string;
}

export interface AiHealthCheckResult {
  summary: string;
  riskLabel: '안정' | '주의' | '위기';
  keySignals: string[];
  actions: string[];
  source: 'ollama' | 'fallback';
  model: string;
  baseUrl: string;
  message: string;
}

const SCENARIO_STYLE_LABEL: Record<ScenarioId, string> = {
  defense: '방어적 선택',
  maintain: '현상 유지',
  attack: '공격적 선택',
};

const SCENARIO_STYLE_HINT: Record<ScenarioId, string> = {
  defense: '지출 안정화와 런웨이 방어를 최우선으로 두고, 성장은 보수적으로 유지한다.',
  maintain: '비용과 성장의 균형을 유지하며 지나친 변동을 피한다.',
  attack: '성장률을 우선하되, 런웨이가 붕괴되지 않도록 안전장치를 함께 둔다.',
};

const clampNumber = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const roundToStep = (value: number, step: number) =>
  Math.round(value / step) * step;

function isLocalBrowserHost() {
  if (typeof window === 'undefined') return true;
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

function canUseDirectOllama() {
  if (!import.meta.env.DEV && !ENABLE_REMOTE_OLLAMA) {
    return false;
  }

  try {
    const parsed = new URL(OLLAMA_BASE_URL);
    const ollamaIsLocalhost =
      parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    if (!EXPLICIT_OLLAMA_BASE_URL) {
      return isLocalBrowserHost();
    }

    if (ollamaIsLocalhost && !isLocalBrowserHost()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function buildHistoricalContext(data: FinancialData) {
  return data.historicalData.map((record) => ({
    month: record.month,
    revenue: record.revenue,
    burn: record.burn,
    profit: record.revenue - record.burn,
  }));
}

function normalizeSettings(
  candidate: Partial<StrategySettings> | undefined,
  fallback: StrategySettings
): StrategySettings {
  const nextRevenueGrowth = clampNumber(
    roundToStep(candidate?.revenueGrowth ?? fallback.revenueGrowth, STRATEGY_LIMITS.revenueGrowth.step),
    STRATEGY_LIMITS.revenueGrowth.min,
    STRATEGY_LIMITS.revenueGrowth.max
  );

  const nextHeadcount = clampNumber(
    roundToStep(candidate?.headcountChange ?? fallback.headcountChange, STRATEGY_LIMITS.headcountChange.step),
    STRATEGY_LIMITS.headcountChange.min,
    STRATEGY_LIMITS.headcountChange.max
  );

  const nextMarketingIncrease = clampNumber(
    roundToStep(
      candidate?.marketingIncrease ?? fallback.marketingIncrease,
      STRATEGY_LIMITS.marketingIncrease.step
    ),
    STRATEGY_LIMITS.marketingIncrease.min,
    STRATEGY_LIMITS.marketingIncrease.max
  );

  const nextPriceIncrease = clampNumber(
    roundToStep(candidate?.priceIncrease ?? fallback.priceIncrease, STRATEGY_LIMITS.priceIncrease.step),
    STRATEGY_LIMITS.priceIncrease.min,
    STRATEGY_LIMITS.priceIncrease.max
  );

  return {
    revenueGrowth: nextRevenueGrowth,
    headcountChange: nextHeadcount,
    marketingIncrease: nextMarketingIncrease,
    priceIncrease: nextPriceIncrease,
  };
}

export function calculateStrategyProjection(
  data: FinancialData,
  settings: StrategySettings
): StrategyProjection {
  const nextEmployees = Math.max(0, data.employees + settings.headcountChange);
  const newRevenue = data.monthlyRevenue * (1 + settings.revenueGrowth / 100);
  const employeeCost = nextEmployees * COST_PER_EMPLOYEE;
  const marketingCost = data.marketingCost * (1 + settings.marketingIncrease / 100);
  const newBurn = employeeCost + marketingCost + data.officeCost;
  const newRunway = newBurn <= 0 ? Infinity : data.cash / newBurn;

  return {
    revenue: newRevenue,
    burn: newBurn,
    runway: newRunway,
    profit: newRevenue - newBurn,
  };
}

function extractJsonObject(raw: string): string | null {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < 0 || end <= start) return null;
  return raw.slice(start, end + 1);
}

async function requestOllamaJson(prompt: string): Promise<string> {
  if (!canUseDirectOllama()) {
    throw new Error('현재 환경에서 Ollama 직접 연결을 사용할 수 없습니다.');
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: 'json',
      messages: [
        {
          role: 'system',
          content: '응답은 JSON으로만 반환한다. 불필요한 부연 설명은 넣지 않는다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama 응답 오류: ${response.status}`);
  }

  const json = await response.json();
  const content =
    typeof json?.message?.content === 'string' ? json.message.content : '';

  const serialized = extractJsonObject(content);
  if (!serialized) {
    throw new Error('Ollama 응답에서 JSON을 찾지 못했습니다.');
  }

  return serialized;
}

function buildFallbackRecommendations(
  data: FinancialData,
  currentSettings: StrategySettings,
  scenario: ScenarioId
): AiStrategyRecommendation[] {
  const scenarioAdjustments: Record<
    ScenarioId,
    {
      safe: Partial<StrategySettings>;
      balanced: Partial<StrategySettings>;
      aggressive: Partial<StrategySettings>;
    }
  > = {
    defense: {
      safe: { revenueGrowth: 10, headcountChange: 0, marketingIncrease: 10, priceIncrease: 5 },
      balanced: { revenueGrowth: 20, headcountChange: 1, marketingIncrease: 25, priceIncrease: 10 },
      aggressive: { revenueGrowth: 30, headcountChange: 2, marketingIncrease: 50, priceIncrease: 12 },
    },
    maintain: {
      safe: { revenueGrowth: 15, headcountChange: 1, marketingIncrease: 20, priceIncrease: 5 },
      balanced: { revenueGrowth: 30, headcountChange: 2, marketingIncrease: 45, priceIncrease: 10 },
      aggressive: { revenueGrowth: 45, headcountChange: 3, marketingIncrease: 80, priceIncrease: 15 },
    },
    attack: {
      safe: { revenueGrowth: 25, headcountChange: 2, marketingIncrease: 45, priceIncrease: 8 },
      balanced: { revenueGrowth: 40, headcountChange: 3, marketingIncrease: 75, priceIncrease: 12 },
      aggressive: { revenueGrowth: 60, headcountChange: 5, marketingIncrease: 120, priceIncrease: 18 },
    },
  };

  const picked = scenarioAdjustments[scenario];

  const safeSettings = normalizeSettings(
    {
      revenueGrowth: Math.max(currentSettings.revenueGrowth, picked.safe.revenueGrowth ?? 15),
      headcountChange: Math.min(
        Math.max(currentSettings.headcountChange, 0),
        picked.safe.headcountChange ?? 1
      ),
      marketingIncrease: Math.min(
        Math.max(currentSettings.marketingIncrease, 0),
        picked.safe.marketingIncrease ?? 20
      ),
      priceIncrease: Math.max(currentSettings.priceIncrease, picked.safe.priceIncrease ?? 0),
    },
    currentSettings
  );

  const balancedSettings = normalizeSettings(
    {
      revenueGrowth: Math.max(currentSettings.revenueGrowth, picked.balanced.revenueGrowth ?? 30),
      headcountChange: Math.min(
        Math.max(currentSettings.headcountChange, picked.balanced.headcountChange ?? 1),
        4
      ),
      marketingIncrease: Math.min(
        Math.max(currentSettings.marketingIncrease, picked.balanced.marketingIncrease ?? 35),
        100
      ),
      priceIncrease: Math.min(
        Math.max(currentSettings.priceIncrease, picked.balanced.priceIncrease ?? 5),
        20
      ),
    },
    currentSettings
  );

  const aggressiveSettings = normalizeSettings(
    {
      revenueGrowth: Math.min(
        Math.max(currentSettings.revenueGrowth, picked.aggressive.revenueGrowth ?? 45),
        85
      ),
      headcountChange: Math.min(
        Math.max(currentSettings.headcountChange, picked.aggressive.headcountChange ?? 2),
        6
      ),
      marketingIncrease: Math.min(
        Math.max(currentSettings.marketingIncrease, picked.aggressive.marketingIncrease ?? 70),
        140
      ),
      priceIncrease: Math.min(
        Math.max(currentSettings.priceIncrease, picked.aggressive.priceIncrease ?? 8),
        22
      ),
    },
    currentSettings
  );

  return [
    {
      title: '안정 수비형',
      reason: '현금 소진 속도를 낮추면서도 성장률을 유지하는 보수적 조합입니다.',
      settings: safeSettings,
      projection: calculateStrategyProjection(data, safeSettings),
      source: 'fallback',
    },
    {
      title: '균형 성장형',
      reason: '매출 성장과 비용 증가를 함께 관리해 런웨이와 성장률을 동시에 챙기는 조합입니다.',
      settings: balancedSettings,
      projection: calculateStrategyProjection(data, balancedSettings),
      source: 'fallback',
    },
    {
      title: '공격 확장형',
      reason: '단기 런웨이 감소를 감수하고 성장 속도를 극대화하는 실험적 조합입니다.',
      settings: aggressiveSettings,
      projection: calculateStrategyProjection(data, aggressiveSettings),
      source: 'fallback',
    },
  ];
}

function buildFallbackHealthCheck(data: FinancialData): AiHealthCheckResult {
  const profit = data.monthlyRevenue - data.monthlyBurn;
  const burn = Math.max(data.monthlyBurn, 1);
  const personnelShare = Math.round((data.personnelCost / burn) * 100);
  const marketingShare = Math.round((data.marketingCost / burn) * 100);
  const riskLabel: AiHealthCheckResult['riskLabel'] =
    data.runway <= RUNWAY_DANGER_THRESHOLD || profit < 0
      ? '위기'
      : data.runway <= RUNWAY_WARNING_THRESHOLD
        ? '주의'
        : '안정';

  const summary =
    riskLabel === '위기'
      ? `현재 월 손익은 ${formatKoreanMoney(profit, { signed: true })}이며 런웨이는 ${data.runway.toFixed(1)}개월입니다. 전열 재정비가 우선입니다.`
      : riskLabel === '주의'
        ? `현재 월 손익은 ${formatKoreanMoney(profit, { signed: true })}, 런웨이는 ${data.runway.toFixed(1)}개월입니다. 성장과 방어를 함께 조정해야 합니다.`
        : `현재 월 손익은 ${formatKoreanMoney(profit, { signed: true })}, 런웨이는 ${data.runway.toFixed(1)}개월입니다. 기본 전열은 안정권입니다.`;

  const keySignals = [
    `런웨이 ${data.runway.toFixed(1)}개월`,
    `월 손익 ${formatKoreanMoney(profit, { signed: true })}`,
    `비용 구성: 인건비 ${personnelShare}% · 마케팅 ${marketingShare}%`,
  ];

  const actions =
    riskLabel === '위기'
      ? [
          '신규 채용과 확장 지출을 잠시 멈추고 현금 방어선을 세우세요.',
          '마케팅 채널 효율을 다시 점검해 저효율 집행부터 줄이세요.',
          '다음 달 목표를 흑자 전환보다 현금 소모 완화로 재설정하세요.',
        ]
      : riskLabel === '주의'
        ? [
            '마케팅비는 유지하되 수익으로 연결되는 채널만 남기세요.',
            '가격 실험 또는 상품 조합 조정으로 마진 개선 여지를 확인하세요.',
            '인건비가 더 늘기 전에 이번 달 성장률을 먼저 검증하세요.',
          ]
        : [
            '지금 구조를 유지하되 다음 채용 타이밍을 사전에 계획하세요.',
            '매출 성장의 근거가 되는 채널을 더 분명히 구분해두세요.',
            '런웨이 여유가 있을 때 실험 가능한 공세안을 한 벌 준비하세요.',
          ];

  return {
    summary,
    riskLabel,
    keySignals: keySignals.slice(0, 3),
    actions: actions.slice(0, 3),
    source: 'fallback',
    model: OLLAMA_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    message: '현재 수치 기준으로 참모 요약을 정리했습니다.',
  };
}

async function requestOllamaRecommendations(
  data: FinancialData,
  currentSettings: StrategySettings,
  scenario: ScenarioId
): Promise<AiStrategyRecommendation[]> {
  const prompt = [
    '너는 삼국지 풍 재무 전략을 정리하는 참모다.',
    '목표: 24개월 생존 가능성과 월 순이익 개선을 동시에 고려해 전략 3개를 제안하라.',
    '반드시 서로 다른 성향(안정/균형/공격)으로 제시하라.',
    `현재 사용자가 선택한 진형은 "${SCENARIO_STYLE_LABEL[scenario]}"이다.`,
    `진형 힌트: ${SCENARIO_STYLE_HINT[scenario]}`,
    'title과 reason은 짧고 단정한 참모 보고 문체로 작성하고, AI나 모델이라는 표현은 쓰지 마라.',
    '응답은 순수 JSON으로만 반환한다.',
    'JSON 스키마:',
    '{"recommendations":[{"title":"string","reason":"string","settings":{"revenueGrowth":number,"headcountChange":number,"marketingIncrease":number,"priceIncrease":number}}]}',
    '값 제한:',
    '- revenueGrowth: -50~100 (step 5)',
    '- headcountChange: -5~10 (step 1)',
    '- marketingIncrease: -50~200 (step 10)',
    '- priceIncrease: -20~50 (step 5)',
    '현재 재무 데이터:',
    JSON.stringify({
      cash: data.cash,
      monthlyRevenue: data.monthlyRevenue,
      monthlyBurn: data.monthlyBurn,
      employees: data.employees,
      personnelCost: data.personnelCost,
      marketingCost: data.marketingCost,
      officeCost: data.officeCost,
      runway: data.runway,
      historicalData: buildHistoricalContext(data),
    }),
    '현재 전략값:',
    JSON.stringify(currentSettings),
  ].join('\n');

  const serialized = await requestOllamaJson(prompt);
  const parsed = JSON.parse(serialized) as OllamaRecommendationPayload;
  const rawRecommendations = Array.isArray(parsed.recommendations)
    ? parsed.recommendations.slice(0, 3)
    : [];

  if (rawRecommendations.length === 0) {
    throw new Error('Ollama 추천 결과가 비어 있습니다.');
  }

  return rawRecommendations.map((item, index) => {
    const normalizedSettings = normalizeSettings(item.settings, currentSettings);

    return {
      title: (item.title || '').trim() || `계책 ${index + 1}`,
      reason: (item.reason || '').trim() || '재무 균형을 고려한 실전형 제안입니다.',
      settings: normalizedSettings,
      projection: calculateStrategyProjection(data, normalizedSettings),
      source: 'ollama' as const,
    };
  });
}

async function requestOllamaHealthCheck(
  data: FinancialData
): Promise<AiHealthCheckResult> {
  const prompt = [
    '너는 삼국지 풍 재무 참모다.',
    '입력된 재무 수치를 바탕으로 대표가 바로 이해할 수 있는 월간 진단을 JSON으로 정리하라.',
    'summary는 2문장 이내, keySignals와 actions는 각각 3개 이내의 짧은 문장으로 작성하라.',
    'riskLabel은 반드시 "안정", "주의", "위기" 중 하나만 사용하라.',
    'AI나 모델이라는 표현은 절대 쓰지 마라.',
    '응답은 순수 JSON으로만 반환한다.',
    'JSON 스키마:',
    '{"summary":"string","riskLabel":"안정|주의|위기","keySignals":["string"],"actions":["string"]}',
    '현재 재무 데이터:',
    JSON.stringify({
      cash: data.cash,
      monthlyRevenue: data.monthlyRevenue,
      monthlyBurn: data.monthlyBurn,
      runway: data.runway,
      employees: data.employees,
      personnelCost: data.personnelCost,
      marketingCost: data.marketingCost,
      officeCost: data.officeCost,
      historicalData: buildHistoricalContext(data),
    }),
  ].join('\n');

  const serialized = await requestOllamaJson(prompt);
  const parsed = JSON.parse(serialized) as OllamaHealthCheckPayload;

  const riskLabel: AiHealthCheckResult['riskLabel'] =
    parsed.riskLabel === '위기' || parsed.riskLabel === '주의' || parsed.riskLabel === '안정'
      ? parsed.riskLabel
      : '주의';

  return {
    summary:
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : buildFallbackHealthCheck(data).summary,
    riskLabel,
    keySignals: Array.isArray(parsed.keySignals)
      ? parsed.keySignals.filter((item): item is string => typeof item === 'string').slice(0, 3)
      : buildFallbackHealthCheck(data).keySignals,
    actions: Array.isArray(parsed.actions)
      ? parsed.actions.filter((item): item is string => typeof item === 'string').slice(0, 3)
      : buildFallbackHealthCheck(data).actions,
    source: 'ollama',
    model: OLLAMA_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    message: '이번 달 전황을 기준으로 참모 보고를 정리했습니다.',
  };
}

export async function getAiStrategyRecommendations(
  data: FinancialData,
  currentSettings: StrategySettings,
  scenario: ScenarioId = 'maintain'
): Promise<AiRecommendationResult> {
  try {
    const recommendations = await requestOllamaRecommendations(data, currentSettings, scenario);
    return {
      recommendations,
      source: 'ollama',
      model: OLLAMA_MODEL,
      baseUrl: OLLAMA_BASE_URL,
      message: `${SCENARIO_STYLE_LABEL[scenario]} 기준으로 참모 보고를 정리했습니다.`,
    };
  } catch (error) {
    const fallback = buildFallbackRecommendations(data, currentSettings, scenario);
    if (SHOULD_LOG_AI_FALLBACK && error instanceof Error) {
      console.warn('[AI Advisor] strategy fallback engaged:', error.message);
    }

    return {
      recommendations: fallback,
      source: 'fallback',
      model: OLLAMA_MODEL,
      baseUrl: OLLAMA_BASE_URL,
      message:
        '바람이 거세도 전열은 무너지지 않습니다. 지금 흐름에 맞춰 기본 전략을 준비했어요.',
    };
  }
}

export async function getAiHealthCheck(
  data: FinancialData
): Promise<AiHealthCheckResult> {
  try {
    return await requestOllamaHealthCheck(data);
  } catch (error) {
    if (SHOULD_LOG_AI_FALLBACK && error instanceof Error) {
      console.warn('[AI Advisor] health check fallback engaged:', error.message);
    }
    return buildFallbackHealthCheck(data);
  }
}
