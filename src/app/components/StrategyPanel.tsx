import { motion } from 'motion/react';
import { PixelButton } from './pixel/PixelButton';
import { StrategySettings, FinancialData } from './CastleDefense';
import { Slider } from './ui/slider';

interface StrategyPanelProps {
  settings: StrategySettings;
  onSettingsChange: (settings: StrategySettings) => void;
  data: FinancialData;
  onSimulate: () => void;
  onBack: () => void;
}

export function StrategyPanel({
  settings,
  onSettingsChange,
  data,
  onSimulate,
  onBack
}: StrategyPanelProps) {
  const calculateProjection = () => {
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
  };

  const projection = calculateProjection();

  const sliders = [
    { id: 'revenueGrowth', icon: '📈', label: '매출 성장률', value: settings.revenueGrowth, min: -50, max: 100, step: 5, suffix: '%', color: 'green' },
    { id: 'headcountChange', icon: '👥', label: '인원 변동', value: settings.headcountChange, min: -5, max: 10, step: 1, suffix: '명', color: 'blue' },
    { id: 'marketingIncrease', icon: '📢', label: '마케팅 투자', value: settings.marketingIncrease, min: -50, max: 200, step: 10, suffix: '%', color: 'orange' },
    { id: 'priceIncrease', icon: '💸', label: '가격 인상', value: settings.priceIncrease, min: -20, max: 50, step: 5, suffix: '%', color: 'purple' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-navy-custom tracking-tight mb-2">
          전략 커스터마이징
        </h2>
        <p className="text-slate-500 text-sm">
          슬라이더로 전략을 세밀하게 조정하세요
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          {sliders.map((slider, index) => (
            <motion.div
              key={slider.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{slider.icon}</span>
                  <span className="text-sm font-bold text-navy-custom">{slider.label}</span>
                </div>
                <div className={`text-xl font-bold px-3 py-1.5 rounded-lg ${slider.value >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
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
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>{slider.min}{slider.suffix}</span>
                <span>{slider.max}{slider.suffix}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          <div className="bg-navy-custom text-white rounded-[2rem] p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🎯</span> 실시간 시뮬레이션
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-300 text-sm">월 매출</span>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">${(projection.revenue / 1000).toFixed(1)}K</div>
                  <div className="text-xs text-slate-500">기존: ${(data.monthlyRevenue / 1000).toFixed(1)}K</div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-300 text-sm">월 지출</span>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-400">${(projection.burn / 1000).toFixed(1)}K</div>
                  <div className="text-xs text-slate-500">기존: ${(data.monthlyBurn / 1000).toFixed(1)}K</div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-300 text-sm">월 순이익</span>
                <div className={`text-lg font-bold ${projection.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {projection.profit >= 0 ? '+' : ''}${(projection.profit / 1000).toFixed(1)}K
                </div>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-300 text-sm">런웨이</span>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${projection.runway > 6 ? 'text-primary' : projection.runway > 3 ? 'text-amber-400' : 'text-red-400'}`}>
                    {projection.runway.toFixed(1)}개월
                  </div>
                  <div className="text-xs text-slate-500">기존: {data.runway.toFixed(1)}개월</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-navy-custom mb-4">🗺️ 24개월 타임라인 미리보기</h4>
            <div className="flex items-end justify-between h-32 gap-1">
              {[...Array(24)].map((_, i) => {
                const monthRevenue = projection.revenue * Math.pow(1 + settings.revenueGrowth / 1200, i);
                const monthBurn = projection.burn;
                const profit = monthRevenue - monthBurn;
                const height = (Math.abs(profit) / 50000) * 100;
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(height, 100)}%` }}
                    transition={{ delay: i * 0.02 }}
                    className={`flex-1 rounded-t ${profit >= 0 ? 'bg-green-500' : 'bg-red-500'} border border-slate-100`}
                    title={`${i + 1}개월: $${(profit / 1000).toFixed(1)}K`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-4 text-xs text-slate-400">
              <span>현재</span><span>6개월</span><span>12개월</span><span>18개월</span><span>24개월</span>
            </div>
          </div>

          <motion.div
            className={`rounded-2xl p-6 border-2 ${projection.runway < 3 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{projection.runway < 3 ? '⚠️' : projection.runway > 12 ? '🎉' : '💡'}</span>
              <div>
                <div className="font-bold text-navy-custom mb-2">
                  {projection.runway < 3 ? '위험: 런웨이 부족' : projection.runway > 12 ? '안전: 장기 지속 가능' : '주의: 적정 런웨이 유지'}
                </div>
                <p className="text-slate-600 text-sm">
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
        className="flex justify-center gap-4 mt-8"
      >
        <PixelButton onClick={onBack} variant="secondary">← 시나리오 선택</PixelButton>
        <PixelButton onClick={onSimulate} variant="success" size="large">⚔️ 시뮬레이션 실행</PixelButton>
      </motion.div>
    </div>
  );
}
