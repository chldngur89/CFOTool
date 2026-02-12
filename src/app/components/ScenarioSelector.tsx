import { motion } from 'motion/react';
import { PixelButton } from './pixel/PixelButton';
import type { FinancialData, ScenarioCopyMap, ScenarioId } from './CastleDefense';
import type { EditableScenarioId } from './ScenarioEditDialog';
import { formatKoreanMoney } from '../lib/finance';

interface ScenarioSelectorProps {
  selectedScenario: ScenarioId;
  onSelectScenario: (scenario: ScenarioId) => void;
  scenarioCopy: ScenarioCopyMap;
  financialData: FinancialData;
  onEditScenario: (scenario: EditableScenarioId) => void;
  onNext: () => void;
  onSimulate: () => void;
  onBack: () => void;
}

interface ScenarioAiOption {
  title: string;
  action: string;
  expected: string;
}

interface ScenarioAiBrief {
  summary: string;
  options: ScenarioAiOption[];
  recommendation: string;
}

function buildScenarioAiBrief(
  selectedScenario: ScenarioId,
  data: FinancialData
): ScenarioAiBrief {
  const burn = Math.max(data.monthlyBurn, 1);
  const personnelShare = Math.round((data.personnelCost / burn) * 100);
  const marketingShare = Math.round((data.marketingCost / burn) * 100);
  const officeShare = Math.round((data.officeCost / burn) * 100);
  const profit = data.monthlyRevenue - data.monthlyBurn;
  const runwayText = `${data.runway.toFixed(1)}개월`;
  const composition = `비용 구성: 인건비 ${personnelShare}% · 마케팅 ${marketingShare}% · 사무실 ${officeShare}%`;

  if (selectedScenario === 'defense') {
    return {
      summary: `방어 전술 브리핑 | ${composition}`,
      options: [
        {
          title: '안건 1. 런웨이 방패안',
          action: '채용은 동결하고 고정비를 재점검합니다.',
          expected: `현금 소모 속도를 완화해 런웨이(${runwayText}) 방어에 유리합니다.`,
        },
        {
          title: '안건 2. 선택적 절감안',
          action: '저효율 마케팅 채널만 줄이고 핵심 채널은 유지합니다.',
          expected: '매출 충격을 줄이면서 지출을 줄일 수 있습니다.',
        },
        {
          title: '안건 3. 운영 최적화안',
          action: '사무실/운영비를 우선 조정하고 인력은 유지합니다.',
          expected: '팀 안정성을 지키면서 비용 구조를 개선합니다.',
        },
      ],
      recommendation:
        data.runway < 6
          ? 'AI 판단: 지금은 안건 1이 가장 안전합니다. 이렇게 가겠습니다.'
          : 'AI 판단: 안건 2로 방어와 성장 균형을 맞추는 편이 좋겠습니다. 이렇게 가겠습니다.',
    };
  }

  if (selectedScenario === 'attack') {
    return {
      summary: `공격 전술 브리핑 | ${composition}`,
      options: [
        {
          title: '안건 1. 성장 가속안',
          action: '마케팅을 확장하고 신규 고객 유입을 최우선합니다.',
          expected: '상방 매출 기회를 크게 확보할 수 있습니다.',
        },
        {
          title: '안건 2. 제품-가격 실험안',
          action: '가격/상품 조합 A/B 테스트를 병행합니다.',
          expected: '매출 증대와 마진 개선을 동시에 노릴 수 있습니다.',
        },
        {
          title: '안건 3. 집중 채용안',
          action: '핵심 포지션만 제한적으로 증원합니다.',
          expected: '실행 속도를 높이되 인건비 급등을 통제합니다.',
        },
      ],
      recommendation:
        marketingShare < 20
          ? 'AI 판단: 현재는 안건 1이 공격 선택과 가장 잘 맞습니다. 이렇게 가겠습니다.'
          : 'AI 판단: 마케팅 비중이 이미 높아 안건 2가 더 안정적인 공격안입니다. 이렇게 가겠습니다.',
    };
  }

  return {
    summary: `균형 전술 브리핑 | ${composition}`,
    options: [
      {
        title: '안건 1. 균형 유지안',
        action: '비용 구조는 유지하고 매출 전환 효율만 개선합니다.',
        expected: '지표 급변 없이 안정적인 운영이 가능합니다.',
      },
      {
        title: '안건 2. 미세 조정안',
        action: '마케팅/사무실비를 소폭 조정해 순이익을 개선합니다.',
        expected: '리스크를 낮추면서 손익을 점진적으로 높일 수 있습니다.',
      },
      {
        title: '안건 3. 방어 전환 준비안',
        action: '런웨이 하락 시 즉시 실행할 절감 플랜을 준비합니다.',
        expected: '시장 악화 시 빠르게 대응할 수 있습니다.',
      },
    ],
    recommendation:
      profit >= 0
        ? 'AI 판단: 현재는 안건 1이 가장 합리적입니다. 이렇게 가겠습니다.'
        : 'AI 판단: 적자 구간이라 안건 2로 미세 조정부터 시작하는 편이 좋겠습니다. 이렇게 가겠습니다.',
  };
}

export function ScenarioSelector({
  selectedScenario,
  onSelectScenario,
  scenarioCopy,
  financialData,
  onEditScenario,
  onNext,
  onSimulate,
  onBack
}: ScenarioSelectorProps) {
  const scenarios = [
    {
      id: 'defense' as const,
      icon: '🛡️',
      ...scenarioCopy.defense,
    },
    {
      id: 'maintain' as const,
      icon: '⚔️',
      ...scenarioCopy.maintain,
    },
    {
      id: 'attack' as const,
      icon: '⚡',
      ...scenarioCopy.attack,
    },
  ];

  const handleScenarioCardClick = (scenarioId: ScenarioId) => {
    if (
      scenarioId === selectedScenario &&
      (scenarioId === 'defense' || scenarioId === 'attack')
    ) {
      onEditScenario(scenarioId);
      return;
    }
    onSelectScenario(scenarioId);
  };

  const aiBrief = buildScenarioAiBrief(selectedScenario, financialData);

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-5">
      {/* 헤더 */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-auto mb-8 max-w-3xl text-center"
      >
        <div className="sg-panel-dark p-5">
          <h2 className="sg-heading">다음 웨이브 대비 전략 선택</h2>
          <p className="sg-subtitle mt-2">어떤 전략으로 도적군의 공격을 막아낼 것인가?</p>
        </div>
      </motion.div>

      {/* 시나리오 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {scenarios.map((scenario, index) => (
          <motion.div
            key={scenario.id}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleScenarioCardClick(scenario.id)}
            className={`
              sg-card-dark p-6 cursor-pointer relative
              border-2 transition-all duration-200
              ${selectedScenario === scenario.id ? 'border-amber-400 bg-[#253969]' : `border-amber-900/70 hover:border-amber-500/70`}
            `}
          >
            {selectedScenario === scenario.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-amber-800 bg-amber-400 text-sm font-black text-[#2d2000] shadow-md"
              >
                ✓
              </motion.div>
            )}

            <motion.div
              animate={selectedScenario === scenario.id ? { rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="text-6xl text-center mb-4"
            >
              {scenario.icon}
            </motion.div>

            <h3 className="text-center text-lg font-black text-amber-100 mb-3">
              {scenario.title}
            </h3>

            <div className="space-y-2 text-center">
              <div className="rounded-md border border-amber-700/50 bg-[#1f3058] p-2 shadow-[inset_0_0_0_1px_rgba(255,221,139,0.16)]">
                <div className="text-sm font-bold text-amber-100">{scenario.description}</div>
              </div>
              <div className="rounded-md border border-amber-700/40 bg-[#1f3058] p-2 shadow-[inset_0_0_0_1px_rgba(255,221,139,0.14)]">
                <div className="text-sm font-bold text-emerald-300">{scenario.effect}</div>
              </div>
              <div className="text-sm text-slate-200/85">
                {scenario.detail}
              </div>
              {(scenario.id === 'defense' || scenario.id === 'attack') && (
                <div className="text-[10px] font-bold text-amber-300/90">
                  같은 카드 재클릭 시 문구 수정
                </div>
              )}
            </div>

            <div className="flex justify-center mt-4 gap-2">
              {scenario.id === 'defense' && (
                <>
                  <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}>👥</motion.span>
                  <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}>👥</motion.span>
                </>
              )}
              {scenario.id === 'maintain' && (
                <>
                  <motion.span animate={{ x: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>👥</motion.span>
                  <motion.span animate={{ x: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>👥</motion.span>
                  <motion.span animate={{ x: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>👥</motion.span>
                </>
              )}
              {scenario.id === 'attack' && (
                <>
                  <motion.span animate={{ x: [0, 15, 0] }} transition={{ duration: 1, repeat: Infinity }}>💰</motion.span>
                  <motion.span animate={{ x: [0, 15, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}>💰</motion.span>
                  <motion.span animate={{ x: [0, 15, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>💰</motion.span>
                  <motion.span animate={{ x: [0, 15, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}>💰</motion.span>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="sg-panel-dark mb-8 p-5"
      >
        <div className="mb-2 text-sm font-black text-amber-100">🤖 AI 시나리오 회의록 (3안)</div>
        <p className="text-xs text-slate-300">{aiBrief.summary}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {aiBrief.options.map((option) => (
            <div key={option.title} className="rounded-md border border-amber-700/45 bg-[#1f3058] p-3">
              <div className="text-xs font-black text-amber-100">{option.title}</div>
              <div className="mt-1 text-[11px] text-slate-200">{option.action}</div>
              <div className="mt-2 text-[11px] font-bold text-emerald-300">{option.expected}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-md border border-amber-600/55 bg-[#172844] px-3 py-2 text-xs font-bold text-amber-100">
          {aiBrief.recommendation} (현재 월 손익 {formatKoreanMoney(financialData.monthlyRevenue - financialData.monthlyBurn, { signed: true })})
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="sg-command-row"
      >
        <PixelButton onClick={onBack} variant="secondary">
          ← 돌아가기
        </PixelButton>
        <PixelButton onClick={onNext} variant="success" size="large">
          전략 세부 조정 →
        </PixelButton>
        <PixelButton onClick={onSimulate} variant="primary" size="large">
          ⚔️ 바로 시뮬레이션
        </PixelButton>
      </motion.div>
    </div>
  );
}
