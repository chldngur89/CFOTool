import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { PixelCastle } from './pixel/PixelCastle';
import { RepresentativeCharacter } from './character/RepresentativeCharacter';
import { BanditCharacter } from './character/BanditCharacter';
import type { RepresentativeVariant } from './character/CharacterChoiceScreen';

interface BattleMonthlyResult {
  month: number;
  profit: number;
  runway: number;
}

interface ResultBattleSceneProps {
  scenario: 'defense' | 'maintain' | 'attack';
  representativeVariant: RepresentativeVariant;
  success: boolean;
  results: BattleMonthlyResult[];
}

type Attacker = 'hero' | 'bandit';

interface TurnAction {
  attacker: Attacker;
  damage: number;
  month: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function ResultBattleScene({
  scenario,
  representativeVariant,
  success,
  results,
}: ResultBattleSceneProps) {
  const banditVariants: Array<'hogeoa' | 'extra_1' | 'extra_2'> = [
    'hogeoa',
    'extra_1',
    'extra_2',
  ];

  const actions = useMemo<TurnAction[]>(() => {
    const sampled = results.filter((_, i) => i % 2 === 0).slice(0, 10);
    if (sampled.length === 0) {
      return [{ attacker: 'bandit', damage: 10, month: 1 }];
    }

    const heroScenarioBoost =
      scenario === 'attack' ? 2 : scenario === 'maintain' ? 1 : 0;
    const banditScenarioBoost =
      scenario === 'attack' ? 2 : scenario === 'maintain' ? 0 : -1;

    return sampled.map((point) => {
      const growthScore = Math.round(point.profit / 4000);
      const runwayScore = Math.round((point.runway - 6) * 1.2);

      if (point.profit >= 0) {
        const damage = clamp(
          10 + growthScore + runwayScore + heroScenarioBoost + (success ? 2 : 0),
          6,
          24
        );
        return { attacker: 'hero', damage, month: point.month };
      }

      const damage = clamp(
        9 +
          Math.abs(Math.min(growthScore, 0)) +
          Math.max(0, -runwayScore) +
          banditScenarioBoost,
        6,
        24
      );
      return { attacker: 'bandit', damage, month: point.month };
    });
  }, [results, scenario, success]);

  const [turnIndex, setTurnIndex] = useState(0);
  const [castleHp, setCastleHp] = useState(100);
  const [banditHp, setBanditHp] = useState(100);
  const [lastStrike, setLastStrike] = useState<Attacker | null>(null);

  useEffect(() => {
    setTurnIndex(0);
    setCastleHp(100);
    setBanditHp(100);
    setLastStrike(null);
  }, [actions]);

  useEffect(() => {
    if (actions.length === 0) return;
    const id = setInterval(() => {
      setTurnIndex((prev) => (prev + 1) % (actions.length + 1));
    }, 1100);
    return () => clearInterval(id);
  }, [actions.length]);

  useEffect(() => {
    if (turnIndex === 0) {
      setCastleHp(100);
      setBanditHp(100);
      setLastStrike(null);
      return;
    }

    const action = actions[turnIndex - 1];
    setLastStrike(action.attacker);

    if (action.attacker === 'hero') {
      setBanditHp((hp) => Math.max(0, hp - action.damage));
    } else {
      setCastleHp((hp) => Math.max(0, hp - action.damage));
    }

    const clear = setTimeout(() => {
      setLastStrike(null);
    }, 450);
    return () => clearTimeout(clear);
  }, [turnIndex, actions]);

  const activeAction =
    turnIndex === 0
      ? actions[Math.max(0, actions.length - 1)]
      : actions[Math.max(0, turnIndex - 1)];

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sg-panel-dark p-4 md:p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="sg-heading">전투 리플레이</h3>
        <span className="sg-chip">
          {turnIndex === 0 ? '재정비' : `${turnIndex}/${actions.length} 턴`}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sg-card-dark p-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
            아군 성 체력
          </div>
          <div className="h-3 overflow-hidden rounded-sm border border-emerald-900/40 bg-[#12223f]">
            <motion.div
              animate={{ width: `${castleHp}%` }}
              transition={{ duration: 0.45 }}
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
            />
          </div>
          <div className="mt-1 text-right text-xs font-bold text-emerald-300">
            {castleHp}%
          </div>
        </div>
        <div className="sg-card-dark p-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
            도적군 체력
          </div>
          <div className="h-3 overflow-hidden rounded-sm border border-red-900/40 bg-[#12223f]">
            <motion.div
              animate={{ width: `${banditHp}%` }}
              transition={{ duration: 0.45 }}
              className="h-full bg-gradient-to-r from-red-400 to-red-600"
            />
          </div>
          <div className="mt-1 text-right text-xs font-bold text-red-300">
            {banditHp}%
          </div>
        </div>
      </div>

      <div className="relative h-[218px] overflow-hidden rounded-md border border-amber-700/70 bg-gradient-to-b from-[#1b2d52] via-[#1a2949] to-[#12203a] shadow-[inset_0_0_0_1px_rgba(255,224,132,0.16)]">
        <div className="absolute inset-x-0 bottom-14 h-px bg-amber-300/40" />
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-[#303f65] to-[#263457]" />

        <motion.div
          className="absolute bottom-5 left-3 flex items-end gap-3 md:left-6"
          animate={
            lastStrike === 'hero'
              ? { x: [0, 18, 0] }
              : lastStrike === 'bandit'
                ? { x: [0, -5, 0] }
                : { x: 0 }
          }
          transition={{ duration: 0.45 }}
        >
          <div className="mb-2">
            <PixelCastle hp={castleHp} />
          </div>
          <RepresentativeCharacter variant={representativeVariant} size={76} />
        </motion.div>

        <motion.div
          className="absolute bottom-5 right-4 flex items-end gap-1 md:right-7"
          animate={
            lastStrike === 'bandit'
              ? { x: [0, -18, 0] }
              : lastStrike === 'hero'
                ? { x: [0, 8, -4, 0] }
                : { x: 0 }
          }
          transition={{ duration: 0.45 }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.14 }}
            >
              <BanditCharacter variant={banditVariants[i]} size={56} />
            </motion.div>
          ))}
        </motion.div>

        {lastStrike === 'hero' && (
          <motion.div
            key={`hero-hit-${turnIndex}`}
            className="absolute bottom-20 right-[26%] text-3xl"
            initial={{ opacity: 0, scale: 0.5, x: -12 }}
            animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.84], x: [-12, 10, 18] }}
            transition={{ duration: 0.42 }}
          >
            ⚔️
          </motion.div>
        )}

        {lastStrike === 'bandit' && (
          <motion.div
            key={`bandit-hit-${turnIndex}`}
            className="absolute bottom-24 left-[28%] text-3xl"
            initial={{ opacity: 0, scale: 0.5, x: 10 }}
            animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.84], x: [8, -4, -12] }}
            transition={{ duration: 0.42 }}
          >
            💥
          </motion.div>
        )}
      </div>

      <div className="mt-3 rounded-md border border-amber-700/50 bg-[#172747] px-3 py-2 text-xs text-amber-100">
        {turnIndex === 0
          ? '전투 로그를 재정비 중입니다.'
          : `${activeAction.month}개월차: ${
              activeAction.attacker === 'hero' ? '대표군 공격' : '도적군 공격'
            } (-${activeAction.damage} HP)`}
      </div>
    </motion.div>
  );
}
