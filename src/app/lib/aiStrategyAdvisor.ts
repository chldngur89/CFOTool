import type { FinancialData, StrategySettings } from '../components/CastleDefense';

const STRATEGY_LIMITS = {
  revenueGrowth: { min: -50, max: 100, step: 5 },
  headcountChange: { min: -5, max: 10, step: 1 },
  marketingIncrease: { min: -50, max: 200, step: 10 },
  priceIncrease: { min: -20, max: 50, step: 5 },
} as const;

const OLLAMA_BASE_URL =
  (import.meta.env.VITE_OLLAMA_BASE_URL as string | undefined) ??
  'http://localhost:11434';

const OLLAMA_MODEL =
  (import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ??
  'llama3.1:latest';

interface OllamaRecommendationItem {
  title?: string;
  reason?: string;
  settings?: Partial<StrategySettings>;
}

interface OllamaRecommendationPayload {
  recommendations?: OllamaRecommendationItem[];
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

const clampNumber = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const roundToStep = (value: number, step: number) =>
  Math.round(value / step) * step;

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
  const newRevenue = data.monthlyRevenue * (1 + settings.revenueGrowth / 100);
  const employeeCost = (data.employees + settings.headcountChange) * 3125;
  const marketingCost = data.marketingCost * (1 + settings.marketingIncrease / 100);
  const newBurn = employeeCost + marketingCost + data.officeCost;
  const newRunway = data.cash / newBurn;

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

function buildFallbackRecommendations(
  data: FinancialData,
  currentSettings: StrategySettings
): AiStrategyRecommendation[] {
  const safeSettings = normalizeSettings(
    {
      revenueGrowth: Math.max(currentSettings.revenueGrowth, 15),
      headcountChange: Math.min(currentSettings.headcountChange, 1),
      marketingIncrease: Math.min(currentSettings.marketingIncrease, 20),
      priceIncrease: Math.max(currentSettings.priceIncrease, 0),
    },
    currentSettings
  );

  const balancedSettings = normalizeSettings(
    {
      revenueGrowth: Math.max(currentSettings.revenueGrowth, 30),
      headcountChange: Math.min(Math.max(currentSettings.headcountChange, 1), 3),
      marketingIncrease: Math.min(Math.max(currentSettings.marketingIncrease, 35), 60),
      priceIncrease: Math.min(Math.max(currentSettings.priceIncrease, 5), 15),
    },
    currentSettings
  );

  const aggressiveSettings = normalizeSettings(
    {
      revenueGrowth: Math.min(Math.max(currentSettings.revenueGrowth, 45), 75),
      headcountChange: Math.min(Math.max(currentSettings.headcountChange, 2), 5),
      marketingIncrease: Math.min(Math.max(currentSettings.marketingIncrease, 70), 120),
      priceIncrease: Math.min(Math.max(currentSettings.priceIncrease, 8), 18),
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

async function requestOllamaRecommendations(
  data: FinancialData,
  currentSettings: StrategySettings
): Promise<AiStrategyRecommendation[]> {
  const prompt = [
    '너는 CFO 전략 시뮬레이션 보좌관이다.',
    '목표: 24개월 생존 가능성과 월 순이익 개선을 동시에 고려해 전략 3개를 제안하라.',
    '반드시 서로 다른 성향(안정/균형/공격)으로 제시하라.',
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
      marketingCost: data.marketingCost,
      officeCost: data.officeCost,
      runway: data.runway,
    }),
    '현재 전략값:',
    JSON.stringify(currentSettings),
  ].join('\n');

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
          content: '전략 추천을 JSON으로만 반환한다. 설명 문장은 reason에 포함한다.',
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
      title: (item.title || '').trim() || `AI 추천안 ${index + 1}`,
      reason: (item.reason || '').trim() || '재무 균형을 고려한 자동 추천입니다.',
      settings: normalizedSettings,
      projection: calculateStrategyProjection(data, normalizedSettings),
      source: 'ollama' as const,
    };
  });
}

export async function getAiStrategyRecommendations(
  data: FinancialData,
  currentSettings: StrategySettings
): Promise<AiRecommendationResult> {
  try {
    const recommendations = await requestOllamaRecommendations(data, currentSettings);
    return {
      recommendations,
      source: 'ollama',
      model: OLLAMA_MODEL,
      baseUrl: OLLAMA_BASE_URL,
      message: `Ollama(${OLLAMA_MODEL}) 판단 완료`,
    };
  } catch (error) {
    const fallback = buildFallbackRecommendations(data, currentSettings);
    const reason = error instanceof Error ? error.message : '알 수 없는 오류';

    return {
      recommendations: fallback,
      source: 'fallback',
      model: OLLAMA_MODEL,
      baseUrl: OLLAMA_BASE_URL,
      message: `Ollama 연결 실패로 기본 추천을 사용했습니다. (${reason})`,
    };
  }
}
