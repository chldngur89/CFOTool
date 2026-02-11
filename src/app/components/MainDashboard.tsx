import { useState } from 'react';
import { motion } from 'motion/react';
import { FinancialData } from './CastleDefense';
import { computeMonthlyBurn, getRunwayStatus } from '../lib/finance';
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
}

export function MainDashboard({
  data,
  onStartScenario,
  representativeVariant,
  onRepresentativeVariantChange,
}: MainDashboardProps) {
  // 재무 판단: 월 지출·런웨이 기준은 lib/finance.ts 참고
  const monthlyBurn = computeMonthlyBurn(data.employees, data.marketingCost, data.officeCost);
  const runwayStatus = getRunwayStatus(data.runway);
  const hpPercentage = Math.min((data.runway / 12) * 100, 100); // 12개월 = 100%
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-5">
      {/* 헤더 */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🏰</span>
            <div>
              <h1 className="text-2xl font-bold text-navy-custom tracking-tight">대표의 성 방어전</h1>
              <p className="text-slate-500 text-sm mt-1">재무 전략 시뮬레이터 v1.0</p>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-3 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">금고</div>
            <div className="text-2xl font-bold text-primary">${(data.cash / 1000).toFixed(0)}K</div>
          </div>
        </div>
      </motion.div>

      {/* 메인 배틀필드 */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-navy-custom text-white rounded-[2rem] p-8 mb-8 relative overflow-hidden shadow-xl"
      >
        {/* 월 지출 = 도적군이 금고에서 돈 가져가는 모션 */}
        <MoneyTakenByBandits monthlyBurn={monthlyBurn} runOnce={false} />

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h2 className="text-xl font-bold leading-tight">재무 현황</h2>
            <p className="text-slate-400 text-xs font-medium mt-1">Runway & Burn Rate</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-primary">{data.runway.toFixed(1)}</div>
            <div className="text-[8px] uppercase font-bold tracking-tighter text-slate-400">Runway (월)</div>
            <div className={`text-[10px] font-bold mt-1 ${runwayStatus === 'danger' ? 'text-red-400' : runwayStatus === 'warning' ? 'text-amber-400' : 'text-green-400'}`}>
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
                <div className="bg-slate-800/80 text-primary px-2 py-1 text-xs font-bold text-center rounded-lg border border-slate-600 mt-2 flex items-center justify-center gap-1">
                  대표 CEO
                  <span className="text-[10px] text-slate-400">(클릭하여 변경)</span>
                </div>
              </motion.div>
            </PopoverTrigger>
            <PopoverContent className="w-56 bg-navy-custom border-slate-600 text-white p-3" align="center" side="top">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">스타일 변경</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { onRepresentativeVariantChange('strategist'); setPopoverOpen(false); }}
                  className={`flex-1 rounded-xl py-2 px-3 text-sm font-bold transition-colors ${representativeVariant === 'strategist' ? 'bg-primary text-white' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'}`}
                >
                  책사
                </button>
                <button
                  type="button"
                  onClick={() => { onRepresentativeVariantChange('general'); setPopoverOpen(false); }}
                  className={`flex-1 rounded-xl py-2 px-3 text-sm font-bold transition-colors ${representativeVariant === 'general' ? 'bg-primary text-white' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'}`}
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
            <div className="inline-block bg-slate-800/80 text-slate-200 px-4 py-2 rounded-xl border border-slate-600 font-bold text-sm">
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
          className="absolute top-8 right-8"
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
        className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm"
      >
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
          최근 6개월 전투 기록
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {data.historicalData.map((record, i) => (
            <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div className="text-slate-400 text-xs mb-2">{record.month}</div>
              <div className="text-lg font-bold">
                {record.revenue > record.burn ? '💰' : record.revenue === record.burn ? '⚖️' : '📉'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
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
                <div className="text-xs text-slate-400">${(profit / 1000).toFixed(0)}K</div>
                <div
                  className={`w-8 rounded-lg ${profit >= 0 ? 'bg-green-500' : 'bg-red-500'} border border-slate-200`}
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
        <PixelButton onClick={onStartScenario} variant="primary" size="large">
          ⚔️ 다음 웨이브 대비 전략 수립
        </PixelButton>

        <div className="mt-4 text-slate-500 text-sm">
          💡 현재 상태: 월 소득 ${(data.monthlyRevenue / 1000).toFixed(0)}K | 월 지출 ${(data.monthlyBurn / 1000).toFixed(0)}K | 순이익 ${((data.monthlyRevenue - data.monthlyBurn) / 1000).toFixed(0)}K
        </div>
      </motion.div>
    </div>
  );
}
