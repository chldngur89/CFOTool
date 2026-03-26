import { useMemo } from 'react';
import { motion } from 'motion/react';
import { PixelButton } from './pixel/PixelButton';
import { StrategySettings, FinancialData } from './CastleDefense';
import { HPBar } from './pixel/HPBar';
import { ResultBattleScene } from './ResultBattleScene';
import type { RepresentativeVariant } from './character/CharacterChoiceScreen';
import {
  formatKoreanMoney,
} from '../lib/finance';
import { summarizeSimulation } from '../lib/simulation';

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
  const { results, finalResult, isSuccess, breakEvenMonth, cashoutMonth, peakCashMonth } =
    useMemo(() => summarizeSimulation(initialData, settings), [initialData, settings]);
  const maxChartMagnitude = Math.max(
    ...results.map((result) => Math.abs(result.profit)),
    1
  );

  const getStrategicNotes = () => {
    const recommendations = [];
    if (settings.marketingIncrease > 30) recommendations.push({ tag: '홍보', text: '마케팅 효율을 주간 단위로 점검해 허실을 가르세요.' });
    if (settings.headcountChange > 0) recommendations.push({ tag: '병력', text: `${Math.ceil(settings.headcountChange / 2)}개월차부터 순차 채용을 시작하는 편이 안전합니다.` });
    if (settings.priceIncrease > 0) recommendations.push({ tag: '단가', text: `${settings.priceIncrease}% 가격 조정은 소규모 실험부터 검증하는 편이 좋습니다.` });
    if (finalResult.runway < 6) recommendations.push({ tag: '경계', text: '예비 자금을 확보하거나 비용 구조를 다시 정비할 필요가 있습니다.' });
    else if (finalResult.runway > 18) recommendations.push({ tag: '확장', text: '공세를 한 단계 올릴 여력이 있어 성장 실험을 검토할 수 있습니다.' });
    return recommendations.slice(0, 3);
  };

  const recommendations = getStrategicNotes();

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-5">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8 text-center">
        <div className={`inline-block rounded-xl p-6 border-2 ${isSuccess ? 'border-emerald-400 bg-emerald-100' : 'border-amber-300 bg-amber-100'}`}>
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 0.5 }}
            className={`mx-auto mb-3 inline-flex rounded-full border px-4 py-2 text-sm font-black tracking-[0.22em] ${isSuccess ? 'border-emerald-500 bg-emerald-200 text-emerald-800' : 'border-amber-500 bg-amber-200 text-amber-800'}`}
          >
            {isSuccess ? '승전' : '결과'}
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
                  <div className={`rounded-full border px-3 py-1 text-[10px] font-black tracking-[0.16em] ${
                    result.cash <= 0
                      ? 'border-red-300 bg-red-100 text-red-700'
                      : result.profit > result.burn * 0.15
                        ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                        : result.profit > 0
                          ? 'border-sky-300 bg-sky-100 text-sky-700'
                          : result.profit > result.burn * -0.1
                            ? 'border-amber-300 bg-amber-100 text-amber-700'
                            : 'border-rose-300 bg-rose-100 text-rose-700'
                  }`}>
                    {result.cash <= 0
                      ? '붕괴'
                      : result.profit > result.burn * 0.15
                        ? '우세'
                        : result.profit > 0
                          ? '반등'
                          : result.profit > result.burn * -0.1
                            ? '교착'
                            : '후퇴'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-900">{result.month}개월차</div>
                    <div className="text-xs text-amber-900/60">런웨이: {result.runway.toFixed(1)}개월</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-sm ${result.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatKoreanMoney(result.profit, { signed: true })}
                  </div>
                  <div className="text-xs text-amber-900/60">금고: {formatKoreanMoney(result.cash)}</div>
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
              const normalizedHeight = (Math.abs(result.profit) / maxChartMagnitude) * 100;
              const height = Math.min(Math.max(normalizedHeight, 6), 100);
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex-1 rounded-t-sm ${result.profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'} border border-amber-900/20`}
                  title={`${result.month}개월: ${formatKoreanMoney(result.profit, { signed: true })}`}
                />
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          <div className="sg-panel-dark p-6">
            <h3 className="sg-heading mb-4">핵심 지표</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="sg-card-dark p-4 text-center">
                <div className="text-slate-400 text-xs mb-1">최종 금고</div>
                <div className={`text-xl font-bold ${finalResult.cash > initialData.cash ? 'text-green-400' : 'text-red-400'}`}>{formatKoreanMoney(finalResult.cash)}</div>
                <div className="text-xs text-slate-500 mt-1">{formatKoreanMoney(finalResult.cash - initialData.cash, { signed: true })}</div>
              </div>
              <div className="sg-card-dark p-4 text-center">
                <div className="text-slate-400 text-xs mb-1">최종 런웨이</div>
                <div className={`text-xl font-bold ${finalResult.runway > 6 ? 'text-green-400' : 'text-red-400'}`}>{finalResult.runway.toFixed(1)}개월</div>
              </div>
              <div className="sg-card-dark p-4 text-center">
                <div className="text-slate-400 text-xs mb-1">월 평균 매출</div>
                <div className="text-xl font-bold text-primary">{formatKoreanMoney(finalResult.revenue)}</div>
              </div>
              <div className="sg-card-dark p-4 text-center">
                <div className="text-slate-400 text-xs mb-1">손익분기점</div>
                <div className="text-xl font-bold text-amber-400">{breakEvenMonth >= 0 ? `${breakEvenMonth + 1}개월` : '미달성'}</div>
              </div>
            </div>
          </div>

          <div className="sg-panel p-6">
            <h3 className="sg-label mb-4 text-amber-900">참모 메모</h3>
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
                  <span className="rounded-full border border-amber-500/60 bg-amber-100 px-2 py-1 text-[10px] font-black tracking-[0.16em] text-amber-900">
                    {rec.tag}
                  </span>
                  <span className="flex-1 text-sm text-amber-900/85">{rec.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className={`rounded-xl p-6 border-2 text-center ${isSuccess ? 'bg-green-50 border-green-200' : finalResult.cash > 0 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`mx-auto mb-3 inline-flex rounded-full border px-4 py-2 text-sm font-black tracking-[0.22em] ${isSuccess ? 'border-emerald-300 bg-emerald-100 text-emerald-700' : finalResult.cash > 0 ? 'border-amber-300 bg-amber-100 text-amber-700' : 'border-red-300 bg-red-100 text-red-700'}`}>
              {isSuccess ? '승전' : finalResult.cash > 0 ? '조정' : '위기'}
            </div>
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
        <PixelButton onClick={onAdjust} variant="secondary" size="large">전략 재조정</PixelButton>
        <PixelButton onClick={onRestart} variant="success" size="large">처음부터 다시</PixelButton>
      </motion.div>
    </div>
  );
}
