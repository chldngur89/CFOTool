import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { PixelButton } from './pixel/PixelButton';
import { StrategySettings, FinancialData, ScenarioId } from './CastleDefense';
import { Slider } from './ui/slider';
import { formatKoreanMoney } from '../lib/finance';
import {
  calculateStrategyProjection,
  getAiStrategyRecommendations,
  type AiStrategyRecommendation,
} from '../lib/aiStrategyAdvisor';

interface StrategyPanelProps {
  settings: StrategySettings;
  onSettingsChange: (settings: StrategySettings) => void;
  data: FinancialData;
  scenario: ScenarioId;
  onSimulate: () => void;
  onBack: () => void;
}

const settingLabels: Record<keyof StrategySettings, { label: string; suffix: string }> = {
  revenueGrowth: { label: '매출 성장', suffix: '%' },
  headcountChange: { label: '인원 변동', suffix: '명' },
  marketingIncrease: { label: '마케팅 투자', suffix: '%' },
  priceIncrease: { label: '가격 인상', suffix: '%' },
};

export function StrategyPanel({
  settings,
  onSettingsChange,
  data,
  scenario,
  onSimulate,
  onBack,
}: StrategyPanelProps) {
  const projection = useMemo(
    () => calculateStrategyProjection(data, settings),
    [data, settings]
  );
  const timelinePreview = useMemo(() => {
    const profits = Array.from({ length: 24 }, (_, index) => {
      const monthRevenue = projection.revenue * Math.pow(1 + settings.revenueGrowth / 1200, index);
      return monthRevenue - projection.burn;
    });

    return {
      profits,
      maxMagnitude: Math.max(...profits.map((profit) => Math.abs(profit)), 1),
    };
  }, [projection.burn, projection.revenue, settings.revenueGrowth]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<'ollama' | 'fallback' | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AiStrategyRecommendation[]>([]);
  const autoAppliedScenarioRef = useRef<ScenarioId | null>(null);

  const sliders = [
    { id: 'revenueGrowth' as const, badge: '매출', label: '매출 성장률', value: settings.revenueGrowth, min: -50, max: 100, step: 5, suffix: '%' },
    { id: 'headcountChange' as const, badge: '인원', label: '인원 변동', value: settings.headcountChange, min: -5, max: 10, step: 1, suffix: '명' },
    { id: 'marketingIncrease' as const, badge: '홍보', label: '마케팅 투자', value: settings.marketingIncrease, min: -50, max: 200, step: 10, suffix: '%' },
    { id: 'priceIncrease' as const, badge: '단가', label: '가격 인상', value: settings.priceIncrease, min: -20, max: 50, step: 5, suffix: '%' },
  ];

  const handleAiRecommendation = async (autoApplyTopOne: boolean) => {
    setAiLoading(true);
    setAiMessage(null);

    try {
      const result = await getAiStrategyRecommendations(data, settings, scenario);
      setAiRecommendations(result.recommendations);
      setAiSource(result.source);
      setAiMessage(result.message);

      if (autoApplyTopOne && result.recommendations.length > 0) {
        onSettingsChange(result.recommendations[0].settings);
        setAiMessage((prev) =>
          prev ? `${prev} 상책을 즉시 반영했습니다.` : '상책을 즉시 반영했습니다.'
        );
      }
    } catch (_) {
      setAiSource('fallback');
      setAiMessage('지금도 충분히 잘하고 있습니다. 다음 수를 차분히 다시 고르면 됩니다.');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (scenario !== 'attack' && scenario !== 'defense') return;
    if (autoAppliedScenarioRef.current === scenario) return;
    autoAppliedScenarioRef.current = scenario;
    void handleAiRecommendation(true);
  }, [scenario]);

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-5">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-auto mb-8 max-w-3xl text-center"
      >
        <div className="sg-panel-dark p-5">
          <h2 className="sg-heading">전략 커스터마이징</h2>
          <p className="sg-subtitle mt-2">슬라이더로 전략을 세밀하게 조정하세요</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          {sliders.map((slider, index) => (
            <motion.div
              key={slider.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="sg-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-amber-600/55 bg-amber-100 px-2 py-1 text-[10px] font-black tracking-[0.16em] text-amber-900">
                    {slider.badge}
                  </span>
                  <span className="text-sm font-bold text-amber-900">{slider.label}</span>
                </div>
                <div className={`rounded-md border px-3 py-1.5 text-xl font-black ${slider.value >= 0 ? 'border-emerald-700/40 bg-emerald-100 text-emerald-700' : 'border-red-700/40 bg-red-100 text-red-700'}`}>
                  {slider.value > 0 ? '+' : ''}{slider.value}{slider.suffix}
                </div>
              </div>
              <Slider
                value={[slider.value]}
                onValueChange={(values) => onSettingsChange({ ...settings, [slider.id]: values[0] })}
                min={slider.min}
                max={slider.max}
                step={slider.step}
                className="py-4"
              />
              <div className="mt-2 flex justify-between text-xs text-amber-900/60">
                <span>{slider.min}{slider.suffix}</span>
                <span>{slider.max}{slider.suffix}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          <div className="sg-panel-dark p-6">
            <h3 className="sg-heading mb-4">실시간 전장 계산</h3>
            <div className="space-y-4">
              <div className="sg-card-dark flex items-center justify-between p-3">
                <span className="text-sm text-slate-200">월 매출</span>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">{formatKoreanMoney(projection.revenue)}</div>
                  <div className="text-xs text-slate-500">기존: {formatKoreanMoney(data.monthlyRevenue)}</div>
                </div>
              </div>
              <div className="sg-card-dark flex items-center justify-between p-3">
                <span className="text-sm text-slate-200">월 지출</span>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-400">{formatKoreanMoney(projection.burn)}</div>
                  <div className="text-xs text-slate-500">기존: {formatKoreanMoney(data.monthlyBurn)}</div>
                </div>
              </div>
              <div className="sg-card-dark flex items-center justify-between p-3">
                <span className="text-sm text-slate-200">월 순이익</span>
                <div className={`text-lg font-bold ${projection.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatKoreanMoney(projection.profit, { signed: true })}
                </div>
              </div>
              <div className="sg-card-dark flex items-center justify-between p-3">
                <span className="text-sm text-slate-200">런웨이</span>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${projection.runway > 6 ? 'text-primary' : projection.runway > 3 ? 'text-amber-400' : 'text-red-400'}`}>
                    {projection.runway.toFixed(1)}개월
                  </div>
                  <div className="text-xs text-slate-500">기존: {data.runway.toFixed(1)}개월</div>
                </div>
              </div>
            </div>
          </div>

          <div className="sg-panel-dark p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="sg-heading">참모 보고서</h4>
              {aiSource && (
                <span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${aiSource === 'ollama' ? 'border-emerald-500/50 bg-emerald-900/35 text-emerald-200' : 'border-amber-500/50 bg-amber-900/35 text-amber-200'}`}>
                  {aiSource === 'ollama' ? '전장 분석' : '기본 작전안'}
                </span>
              )}
            </div>

            <div className="sg-command-row mt-4 justify-start">
              <PixelButton
                onClick={() => {
                  void handleAiRecommendation(false);
                }}
                variant="primary"
                size="small"
                disabled={aiLoading}
              >
                {aiLoading ? '정리 중...' : '전략안 3개 보기'}
              </PixelButton>

              <PixelButton
                onClick={() => {
                  void handleAiRecommendation(true);
                }}
                variant="success"
                size="small"
                disabled={aiLoading}
              >
                {aiLoading ? '정리 중...' : '상책 바로 반영'}
              </PixelButton>
            </div>

            {aiMessage && (
              <div className="mt-3 rounded-md border border-amber-700/60 bg-[#1a2c4f] px-3 py-2 text-xs text-amber-100">
                {aiMessage}
              </div>
            )}

            {aiRecommendations.length > 0 && (
              <div className="mt-4 space-y-3">
                {aiRecommendations.map((recommendation, index) => (
                  <div key={`${recommendation.title}-${index}`} className="sg-card-dark p-3">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div className="text-sm font-black text-amber-100">{index + 1}. {recommendation.title}</div>
                      <button
                        type="button"
                        onClick={() => onSettingsChange(recommendation.settings)}
                        className="rounded-md border border-amber-500/70 bg-amber-400 px-2 py-1 text-[10px] font-black text-[#2f2207]"
                      >
                        이 안 적용
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-200/95">{recommendation.reason}</p>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                      {(Object.keys(settingLabels) as Array<keyof StrategySettings>).map((key) => (
                        <div key={key} className="rounded-sm border border-amber-700/30 bg-[#1f325a] px-2 py-1">
                          {settingLabels[key].label}: {recommendation.settings[key] > 0 ? '+' : ''}
                          {recommendation.settings[key]}
                          {settingLabels[key].suffix}
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-bold text-amber-100">
                      <span>순이익 {formatKoreanMoney(recommendation.projection.profit, { signed: true })}</span>
                      <span>런웨이 {recommendation.projection.runway.toFixed(1)}개월</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sg-panel p-6">
            <h4 className="sg-label mb-4 text-amber-900">24개월 타임라인 미리보기</h4>
            <div className="flex items-end justify-between h-32 gap-1">
              {timelinePreview.profits.map((profit, i) => {
                const normalizedHeight = (Math.abs(profit) / timelinePreview.maxMagnitude) * 100;
                const height = Math.min(Math.max(normalizedHeight, 6), 100);
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.02 }}
                    className={`flex-1 rounded-t-sm ${profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'} border border-amber-900/20`}
                    title={`${i + 1}개월: ${formatKoreanMoney(profit, { signed: true })}`}
                  />
                );
              })}
            </div>
            <div className="mt-4 flex justify-between text-xs text-amber-900/60">
              <span>현재</span><span>6개월</span><span>12개월</span><span>18개월</span><span>24개월</span>
            </div>
          </div>

          <motion.div
            className={`rounded-xl p-6 border-2 ${projection.runway < 3 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`rounded-full border px-3 py-1 text-[11px] font-black tracking-[0.16em] ${projection.runway < 3 ? 'border-red-400 bg-red-100 text-red-700' : projection.runway > 12 ? 'border-emerald-400 bg-emerald-100 text-emerald-700' : 'border-amber-400 bg-amber-100 text-amber-700'}`}>
                {projection.runway < 3 ? '위기' : projection.runway > 12 ? '안정' : '관망'}
              </div>
              <div>
                <div className="mb-2 font-bold text-amber-900">
                  {projection.runway < 3 ? '위험: 런웨이 부족' : projection.runway > 12 ? '안전: 장기 지속 가능' : '주의: 적정 런웨이 유지'}
                </div>
                <p className="text-sm text-amber-900/80">
                  {projection.runway < 3 ? '비용을 줄이거나 매출을 늘려야 합니다.' : projection.runway > 12 ? '공격적인 성장 전략을 고려할 수 있습니다.' : '현재 전략을 유지하며 시장 상황을 주시하세요.'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="sg-command-row mt-8"
      >
        <PixelButton onClick={onBack} variant="secondary">← 시나리오 선택</PixelButton>
        <PixelButton onClick={onSimulate} variant="success" size="large">시뮬레이션 실행</PixelButton>
      </motion.div>
    </div>
  );
}
