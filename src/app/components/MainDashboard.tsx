import { useState } from 'react';
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

interface MainDashboardProps {
  data: FinancialData;
  onStartScenario: () => void;
  representativeVariant: RepresentativeVariant;
  onRepresentativeVariantChange: (variant: RepresentativeVariant) => void;
  onEditMoney: () => void;
  userDisplayName?: string;
  companyName?: string;
}

export function MainDashboard({
  data,
  onStartScenario,
  representativeVariant,
  onRepresentativeVariantChange,
  onEditMoney,
  userDisplayName,
  companyName,
}: MainDashboardProps) {
  // 재무 판단: 월 지출·런웨이 기준은 lib/finance.ts 참고
  const monthlyBurn = computeMonthlyBurn(data.employees, data.marketingCost, data.officeCost);
  const runwayStatus = getRunwayStatus(data.runway);
  const hpPercentage = Math.min((data.runway / 12) * 100, 100); // 12개월 = 100%
  const [popoverOpen, setPopoverOpen] = useState(false);
  const titleName = userDisplayName?.trim() || '대표';
  const subtitle = companyName?.trim()
    ? `${companyName.trim()} 재무 전장 시뮬레이터`
    : '삼국지 전장 감성 재무 시뮬레이터';

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
            <span className="text-4xl drop-shadow-[0_2px_0_rgba(0,0,0,0.65)]">🏯</span>
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
                  대표 CEO
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
              ⚔️ 도적군이 가져가는 월 비용
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <PixelMonster
              type="personnel"
              cost={data.employees * 3125}
              label="인건비"
              count={data.employees}
            />
            <PixelMonster
              type="marketing"
              cost={data.marketingCost}
              label="마케팅비"
            />
            <PixelMonster
              type="office"
              cost={data.officeCost}
              label="사무실비"
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {data.historicalData.map((record, i) => (
            <div key={i} className="sg-card p-3 text-center">
              <div className="text-[11px] font-bold text-amber-800 mb-2">{record.month}</div>
              <div className="text-lg font-bold">
                {record.revenue > record.burn ? '💰' : record.revenue === record.burn ? '⚖️' : '📉'}
              </div>
              <div className="mt-1 text-xs text-amber-900/80">
                {record.revenue > record.burn ? '승리' : record.revenue === record.burn ? '균형' : '고전'}
              </div>
            </div>
          ))}
        </div>

        {/* 미니 차트 */}
        <div className="mt-6 h-24 flex items-end gap-2 justify-center">
          {data.historicalData.map((record, i) => {
            const profit = record.revenue - record.burn;
            const maxProfit = 15000;
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
      </motion.div>

      {/* 전략 시작 버튼 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <div className="sg-command-row">
          <PixelButton onClick={onStartScenario} variant="primary" size="large">
            ⚔️ 다음 웨이브 대비 전략 수립
          </PixelButton>
        </div>

        <div className="mt-4 text-sm text-amber-100/85">
          💡 현재 상태: 월 소득 {formatKoreanMoney(data.monthlyRevenue)} | 월 지출 {formatKoreanMoney(data.monthlyBurn)} | 순이익 {formatKoreanMoney(data.monthlyRevenue - data.monthlyBurn, { signed: true })}
        </div>
      </motion.div>
    </div>
  );
}
