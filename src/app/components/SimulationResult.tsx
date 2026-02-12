import { motion } from 'motion/react';
import { PixelButton } from './pixel/PixelButton';
import { StrategySettings, FinancialData } from './CastleDefense';
import { HPBar } from './pixel/HPBar';
import { ResultBattleScene } from './ResultBattleScene';
import type { RepresentativeVariant } from './character/CharacterChoiceScreen';

interface SimulationResultProps {
  settings: StrategySettings;
  scenario: 'defense' | 'maintain' | 'attack';
  initialData: FinancialData;
  representativeVariant: RepresentativeVariant;
  onRestart: () => void;
  onAdjust: () => void;
}

export function SimulationResult({
  settings,
  scenario,
  initialData,
  representativeVariant,
  onRestart,
  onAdjust
}: SimulationResultProps) {
  const simulate24Months = () => {
    const results = [];
    let currentCash = initialData.cash;
    let currentRevenue = initialData.monthlyRevenue;
    const employeeCost = (initialData.employees + settings.headcountChange) * 3125;
    const marketingCost = initialData.marketingCost * (1 + settings.marketingIncrease / 100);
    const fixedCost = initialData.officeCost;

    for (let month = 1; month <= 24; month++) {
      currentRevenue = currentRevenue * (1 + settings.revenueGrowth / 1200);
      if (month === 1) currentRevenue = currentRevenue * (1 + settings.priceIncrease / 100);
      const totalBurn = employeeCost + marketingCost + fixedCost;
      const profit = currentRevenue - totalBurn;
      currentCash += profit;
      results.push({ month, revenue: currentRevenue, burn: totalBurn, profit, cash: currentCash, runway: currentCash / totalBurn });
    }
    return results;
  };

  const results = simulate24Months();
  const finalResult = results[results.length - 1];
  const isSuccess = finalResult.cash > initialData.cash && finalResult.runway > 6;
  const breakEvenMonth = results.findIndex(r => r.profit > 0);
  const cashoutMonth = results.findIndex(r => r.cash <= 0);
  const peakCashMonth = results.reduce((max, r, i) => r.cash > results[max].cash ? i : max, 0);

  const getAIRecommendations = () => {
    const recommendations = [];
    if (settings.marketingIncrease > 30) recommendations.push({ icon: '📢', text: '마케팅 ROI를 주간 단위로 모니터링하세요' });
    if (settings.headcountChange > 0) recommendations.push({ icon: '👥', text: `${Math.ceil(settings.headcountChange / 2)}월차에 첫 채용 시작` });
    if (settings.priceIncrease > 0) recommendations.push({ icon: '💸', text: `${settings.priceIncrease}% 가격 인상을 A/B 테스트로 검증` });
    if (finalResult.runway < 6) recommendations.push({ icon: '⚠️', text: '비상 자금 확보 또는 비용 재조정 필요' });
    else if (finalResult.runway > 18) recommendations.push({ icon: '🚀', text: '공격적 마케팅/채용 기회 검토' });
    return recommendations.slice(0, 3);
  };

  const recommendations = getAIRecommendations();

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-5">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8 text-center">
        <div className={`inline-block rounded-xl p-6 border-2 ${isSuccess ? 'border-emerald-400 bg-emerald-100' : 'border-amber-300 bg-amber-100'}`}>
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }} className="text-5xl mb-3">
            {isSuccess ? '🎉' : '⚔️'}
          </motion.div>
          <h2 className="sg-heading !text-amber-900 mb-2">
            {isSuccess ? '승리의 전략!' : '시뮬레이션 완료'}
          </h2>
          <p className="text-sm text-amber-900/75">24개월 재무 전투 시뮬레이션 결과</p>
        </div>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
        <HPBar percentage={Math.min((finalResult.runway / 12) * 100, 100)} label={`최종 런웨이: ${finalResult.runway.toFixed(1)}개월`} />
      </motion.div>

      <ResultBattleScene
        scenario={scenario}
        representativeVariant={representativeVariant}
        success={isSuccess}
        results={results}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="sg-panel p-6">
          <h3 className="sg-label mb-6 text-amber-900">24개월 전투 타임라인</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {results.filter((_, i) => i % 2 === 0 || i === results.length - 1).map((result, index) => (
              <motion.div
                key={result.month}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex items-center justify-between rounded-md border border-amber-900/20 bg-amber-50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {result.profit > 5000 ? '🏰💰💰💰' : result.profit > 0 ? '🏰💰💰' : result.profit > -5000 ? '🏰💰' : result.cash > 0 ? '🏰' : '💀'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-900">{result.month}개월차</div>
                    <div className="text-xs text-amber-900/60">런웨이: {result.runway.toFixed(1)}개월</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-sm ${result.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {result.profit >= 0 ? '+' : ''}${(result.profit / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-amber-900/60">금고: ${(result.cash / 1000).toFixed(0)}K</div>
                </div>
                {result.month === breakEvenMonth + 1 && breakEvenMonth >= 0 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">손익분기</span>
                )}
                {result.month === peakCashMonth + 1 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">최고점</span>
                )}
              </motion.div>
            ))}
          </div>
          <div className="mt-6 h-32 flex items-end gap-1">
            {results.map((result, i) => {
              const height = Math.max((result.profit / 50000) * 100 + 50, 5);
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex-1 rounded-t-sm ${result.profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'} border border-amber-900/20`}
                  title={`${result.month}개월: $${(result.profit / 1000).toFixed(1)}K`}
                />
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          <div className="sg-panel-dark p-6">
            <h3 className="sg-heading mb-4 flex items-center gap-2"><span>📈</span> 핵심 지표</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="sg-card-dark p-4 text-center">
                <div className="text-slate-400 text-xs mb-1">최종 금고</div>
                <div className={`text-xl font-bold ${finalResult.cash > initialData.cash ? 'text-green-400' : 'text-red-400'}`}>${(finalResult.cash / 1000).toFixed(0)}K</div>
                <div className="text-xs text-slate-500 mt-1">{finalResult.cash > initialData.cash ? '+' : ''}{((finalResult.cash - initialData.cash) / 1000).toFixed(0)}K</div>
              </div>
              <div className="sg-card-dark p-4 text-center">
                <div className="text-slate-400 text-xs mb-1">최종 런웨이</div>
                <div className={`text-xl font-bold ${finalResult.runway > 6 ? 'text-green-400' : 'text-red-400'}`}>{finalResult.runway.toFixed(1)}개월</div>
              </div>
              <div className="sg-card-dark p-4 text-center">
                <div className="text-slate-400 text-xs mb-1">월 평균 매출</div>
                <div className="text-xl font-bold text-primary">${(finalResult.revenue / 1000).toFixed(0)}K</div>
              </div>
              <div className="sg-card-dark p-4 text-center">
                <div className="text-slate-400 text-xs mb-1">손익분기점</div>
                <div className="text-xl font-bold text-amber-400">{breakEvenMonth >= 0 ? `${breakEvenMonth + 1}개월` : '미달성'}</div>
              </div>
            </div>
          </div>

          <div className="sg-panel p-6">
            <h3 className="sg-label mb-4 text-amber-900">AI 전술가의 조언</h3>
            <div className="mb-4 rounded-md border border-amber-900/20 bg-amber-50 p-4">
              <p className="text-sm leading-relaxed text-amber-900/85">
                {isSuccess
                  ? `훌륭합니다! 이 전략은 24개월 후 ${finalResult.runway.toFixed(1)}개월의 런웨이를 확보합니다. 공격적이면서도 지속 가능한 성장 경로입니다.`
                  : finalResult.cash > 0
                    ? `주의가 필요합니다. 현재 전략은 생존 가능하지만, ${cashoutMonth >= 0 ? `${cashoutMonth + 1}개월차에 자금 부족` : '장기적으로 불안정'}할 수 있습니다. 일부 조정을 고려하세요.`
                    : `위험한 전략입니다. ${cashoutMonth + 1}개월차에 자금이 고갈됩니다. 비용 절감이나 매출 증대가 시급합니다.`}
              </p>
            </div>
            <div className="mb-2 text-sm font-bold text-amber-900">지금 실행할 액션 3가지:</div>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-start gap-3 rounded-md border border-amber-900/20 bg-amber-50 p-3"
                >
                  <span className="text-2xl">{rec.icon}</span>
                  <span className="flex-1 text-sm text-amber-900/85">{rec.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className={`rounded-xl p-6 border-2 text-center ${isSuccess ? 'bg-green-50 border-green-200' : finalResult.cash > 0 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <div className="text-4xl mb-3">{isSuccess ? '🏆' : finalResult.cash > 0 ? '⚠️' : '💀'}</div>
            <div className="mb-2 text-xl font-black text-amber-900">
              {isSuccess ? '전략 검증 완료!' : finalResult.cash > 0 ? '조정 필요' : '전략 재검토 필요'}
            </div>
            <p className="text-sm text-amber-900/80">
              {isSuccess ? '이 전략으로 실행을 시작할 수 있습니다.' : finalResult.cash > 0 ? '일부 파라미터를 조정해보세요.' : '더 보수적인 접근이 필요합니다.'}
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="sg-command-row">
        <PixelButton onClick={onAdjust} variant="secondary" size="large">⚙️ 전략 재조정</PixelButton>
        <PixelButton onClick={onRestart} variant="success" size="large">🏰 처음부터 다시</PixelButton>
      </motion.div>
    </div>
  );
}
