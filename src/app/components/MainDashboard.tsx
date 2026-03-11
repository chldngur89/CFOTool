import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FinancialData } from './CastleDefense';
import { computeMonthlyBurn, formatKoreanMoney, getRunwayStatus } from '../lib/finance';
import { PixelCastle } from './pixel/PixelCastle';
import { RepresentativeCharacter } from './character/RepresentativeCharacter';
import { PixelMonster } from './pixel/PixelMonster';
import { PixelGoldChest } from './pixel/PixelGoldChest';
import { HPBar } from './pixel/HPBar';
import { PixelButton } from './pixel/PixelButton';
import { MoneyTakenByBandits } from './MoneyTakenByBandits';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import type { RepresentativeVariant } from './character/CharacterChoiceScreen';

const ENCOURAGEMENT_MESSAGES = [
  '오늘의 한 수가 내일의 런웨이를 지킵니다.',
  '작은 조정 하나가 큰 적자를 막아냅니다.',
  '첫 기록이 쌓이면 다음 결정이 훨씬 정확해집니다.',
  '지금 시작한 한 번의 시뮬레이션이 팀의 방향을 바꿉니다.',
];

interface MainDashboardProps {
  data: FinancialData;
  onStartScenario: () => void;
  representativeVariant: RepresentativeVariant;
  onRepresentativeVariantChange: (variant: RepresentativeVariant) => void;
  onEditMoney: () => void;
  onEditCost: (target: 'personnel' | 'marketing' | 'office') => void;
  userDisplayName?: string;
  companyName?: string;
}

export function MainDashboard({
  data,
  onStartScenario,
  representativeVariant,
  onRepresentativeVariantChange,
  onEditMoney,
  onEditCost,
  userDisplayName,
  companyName,
}: MainDashboardProps) {
  // 재무 판단: 월 지출·런웨이 기준은 lib/finance.ts 참고
  const monthlyBurn = computeMonthlyBurn(
    data.personnelCost,
    data.marketingCost,
    data.officeCost
  );
  const runwayStatus = getRunwayStatus(data.runway);
  const hpPercentage = Math.min((data.runway / 12) * 100, 100); // 12개월 = 100%
  const [popoverOpen, setPopoverOpen] = useState(false);
  const recentHistory = data.historicalData.slice(-6);
  const hasHistory = recentHistory.length > 0;
  const placeholderCount = Math.max(0, 6 - recentHistory.length);
  const maxProfit =
    recentHistory.length > 0
      ? Math.max(...recentHistory.map((record) => Math.abs(record.revenue - record.burn)), 1)
      : 1;
  const [encouragementIndex, setEncouragementIndex] = useState(0);
  const titleName = userDisplayName?.trim() || '대표';
  const companyLabel = companyName?.trim() || '우리 회사';
  const subtitle = companyName?.trim()
    ? `${companyName.trim()} 재무 전장 시뮬레이터`
    : '삼국지 전장 감성 재무 시뮬레이터';

  useEffect(() => {
    if (recentHistory.length > 0) return;
    const interval = setInterval(() => {
      setEncouragementIndex((prev) => (prev + 1) % ENCOURAGEMENT_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [recentHistory.length]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 md:px-5">
      {/* 헤더 */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sg-panel-dark p-5 md:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-amber-500/70 bg-[#162541] text-[11px] font-black tracking-[0.2em] text-amber-200 shadow-[inset_0_0_0_1px_rgba(255,224,132,0.16)]">
              성채
            </div>
            <div>
              <h1 className="sg-heading">{titleName}님의 성 방어전</h1>
              <p className="sg-subtitle mt-1">{subtitle}</p>
            </div>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onEditMoney}
            className="sg-card-dark cursor-pointer px-5 py-3 text-center"
          >
            <div className="sg-label text-amber-200">금고</div>
            <div className="mt-1 text-2xl font-black text-amber-200">{formatKoreanMoney(data.cash)}</div>
            <div className="mt-1 text-[10px] font-bold text-slate-300">클릭하여 수정</div>
          </motion.button>
        </div>
      </motion.div>

      {/* 메인 배틀필드 */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="sg-panel-dark sg-panel-animated relative overflow-hidden p-6 md:p-8"
      >
        {/* 월 지출 = 도적군이 금고에서 돈 가져가는 모션 */}
        <MoneyTakenByBandits monthlyBurn={monthlyBurn} runOnce={false} />

        <div className="relative z-10 mb-6 flex items-start justify-between">
          <div>
            <h2 className="sg-heading">재무 전장 현황</h2>
            <p className="sg-subtitle mt-1">Runway & Burn Rate</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-black text-amber-200">{data.runway.toFixed(1)}</div>
            <div className="sg-label text-[9px] text-slate-300">Runway (월)</div>
            <div className={`sg-label mt-1 text-[10px] ${runwayStatus === 'danger' ? 'text-red-300' : runwayStatus === 'warning' ? 'text-amber-300' : 'text-emerald-300'}`}>
              {runwayStatus === 'danger' ? '위험' : runwayStatus === 'warning' ? '주의' : '안전'}
            </div>
          </div>
        </div>

        {/* HP 바 */}
        <div className="relative z-10 mb-8">
          <HPBar percentage={hpPercentage} label={`런웨이: ${data.runway}개월`} />
        </div>

        {/* 성과 캐릭터 */}
        <div className="flex justify-center items-center mb-12 relative">
          <PixelCastle hp={hpPercentage} />

          {/* 대표 캐릭터 (성 앞) - 클릭하면 책사/장군 전환 */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <motion.div
                className="absolute cursor-pointer select-none"
                style={{ bottom: '-20px' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <RepresentativeCharacter variant={representativeVariant} size={88} />
                <div className="mt-2 flex items-center justify-center gap-1 rounded-md border border-amber-600/70 bg-[#1d2e54]/90 px-2 py-1 text-xs font-bold text-amber-100">
                  {companyLabel}
                  <span className="text-[10px] text-slate-300">(클릭하여 변경)</span>
                </div>
              </motion.div>
            </PopoverTrigger>
            <PopoverContent className="w-56 border-amber-600/60 bg-[#182642] p-3 text-white" align="center" side="top">
              <div className="sg-label mb-3 text-amber-200">스타일 변경</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { onRepresentativeVariantChange('strategist'); setPopoverOpen(false); }}
                  className={`rounded-md border px-3 py-2 text-xs font-bold transition-colors ${representativeVariant === 'strategist' ? 'border-amber-400 bg-amber-500 text-[#2d1f00]' : 'border-slate-500 bg-slate-700/80 text-slate-200 hover:bg-slate-600'}`}
                >
                  책사
                </button>
                <button
                  type="button"
                  onClick={() => { onRepresentativeVariantChange('general'); setPopoverOpen(false); }}
                  className={`rounded-md border px-3 py-2 text-xs font-bold transition-colors ${representativeVariant === 'general' ? 'border-amber-400 bg-amber-500 text-[#2d1f00]' : 'border-slate-500 bg-slate-700/80 text-slate-200 hover:bg-slate-600'}`}
                >
                  장군
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* 몬스터 웨이브 (월 비용 = 도적군이 가져가는 금액) */}
        <div className="relative z-10">
          <div className="text-center mb-4">
            <div className="inline-block rounded-md border border-amber-600/70 bg-[#1b2a4a]/90 px-4 py-2 text-sm font-bold text-amber-100 shadow-[inset_0_0_0_1px_rgba(255,226,143,0.24)]">
              이번 달 작전 운영비 브리핑
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <PixelMonster
              type="personnel"
              cost={data.personnelCost}
              label="인건비"
              count={data.employees}
              onClick={() => onEditCost('personnel')}
            />
            <PixelMonster
              type="marketing"
              cost={data.marketingCost}
              label="마케팅비"
              onClick={() => onEditCost('marketing')}
            />
            <PixelMonster
              type="office"
              cost={data.officeCost}
              label="사무실비"
              onClick={() => onEditCost('office')}
            />
          </div>
        </div>

        {/* 매출 금화 */}
        <motion.div
          className="absolute right-6 top-6"
          animate={{ rotate: [0, 10, 0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <PixelGoldChest amount={data.monthlyRevenue} />
        </motion.div>
      </motion.div>

      {/* 최근 전투 기록 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="sg-panel p-5 md:p-6"
      >
        <h3 className="sg-label mb-4 text-amber-900">
          최근 6개월 전투 기록
        </h3>
        {recentHistory.length === 0 ? (
          <div className="relative overflow-hidden rounded-md border border-amber-800/45 bg-gradient-to-b from-amber-50 to-amber-100 px-4 py-6 text-center">
            <motion.div
              className="absolute right-4 top-3 rounded-full border border-amber-600/45 bg-amber-100 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-amber-900"
              animate={{ rotate: [0, 4, -4, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2.6, repeat: Infinity }}
            >
              출정
            </motion.div>
            <motion.div
              className="absolute left-4 top-3 rounded-full border border-amber-600/45 bg-amber-100 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-amber-900"
              animate={{ y: [0, -4, 0], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              기록
            </motion.div>

            <div className="text-lg font-black text-amber-900">첫 전투가 아직 시작되지 않았습니다</div>
            <div className="mt-2 text-sm font-bold text-amber-900/85">
              시뮬레이션을 실행하면 이 구역에 실제 기록이 차곡차곡 쌓입니다.
            </div>

            <motion.div
              key={encouragementIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-4 rounded-md border border-amber-700/45 bg-amber-200/55 px-3 py-2 text-xs font-bold text-amber-900"
            >
              {ENCOURAGEMENT_MESSAGES[encouragementIndex]}
            </motion.div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold text-amber-900/75">
              <span className="rounded-full border border-amber-700/45 bg-amber-100 px-2 py-1">전략 선택</span>
              <span>→</span>
              <span className="rounded-full border border-amber-700/45 bg-amber-100 px-2 py-1">시뮬레이션 실행</span>
              <span>→</span>
              <span className="rounded-full border border-amber-700/45 bg-amber-100 px-2 py-1">실제 기록 생성</span>
            </div>

            <div className="sg-command-row mt-5">
              <PixelButton onClick={onStartScenario} variant="primary">
                첫 전투 시작하기
              </PixelButton>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {recentHistory.map((record, i) => (
                <div key={i} className="sg-card p-3 text-center">
                  <div className="text-[11px] font-bold text-amber-800 mb-2">{record.month}</div>
                  <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black tracking-[0.16em] ${
                    record.revenue > record.burn
                      ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                      : record.revenue === record.burn
                        ? 'border-slate-300 bg-slate-100 text-slate-700'
                        : 'border-rose-300 bg-rose-100 text-rose-700'
                  }`}>
                    {record.revenue > record.burn ? '흑자' : record.revenue === record.burn ? '균형' : '적자'}
                  </div>
                  <div className="mt-2 text-xs text-amber-900/80">
                    {record.revenue > record.burn ? '승리' : record.revenue === record.burn ? '균형' : '고전'}
                  </div>
                </div>
              ))}
              {Array.from({ length: placeholderCount }).map((_, i) => (
                <div
                  key={`placeholder-${i}`}
                  className="sg-card p-3 text-center opacity-70"
                >
                  <div className="text-[11px] font-bold text-amber-700/80 mb-2">기록 대기</div>
                  <div className="text-lg font-bold text-amber-700/70">…</div>
                  <div className="mt-1 text-xs text-amber-800/70">시뮬레이션 필요</div>
                </div>
              ))}
            </div>

            {/* 미니 차트 */}
            <div className="mt-6 h-24 flex items-end gap-2 justify-center">
              {recentHistory.map((record, i) => {
                const profit = record.revenue - record.burn;
                const height = Math.abs(profit) / maxProfit * 100;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="text-[10px] font-bold text-amber-900/70">{formatKoreanMoney(profit, { signed: true })}</div>
                    <div
                      className={`w-8 rounded-sm ${profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'} border border-amber-900/30`}
                      style={{ height: `${Math.max(height, 10)}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>

      {/* 전략 시작 버튼 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        {hasHistory && (
          <div className="sg-command-row">
            <PixelButton onClick={onStartScenario} variant="primary" size="large">
              다음 웨이브 대비 전략 수립
            </PixelButton>
          </div>
        )}

        <div className="mt-4 text-sm text-amber-100/85">
          {hasHistory
            ? `현재 상태: 월 소득 ${formatKoreanMoney(data.monthlyRevenue)} | 월 지출 ${formatKoreanMoney(data.monthlyBurn)} | 순이익 ${formatKoreanMoney(data.monthlyRevenue - data.monthlyBurn, { signed: true })}`
            : '첫 전투를 시작하면 실제 기록을 바탕으로 다음 전략 수립 버튼이 활성화됩니다.'}
        </div>
      </motion.div>
    </div>
  );
}
