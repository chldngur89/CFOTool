import { motion } from 'motion/react';
import { RepresentativeCharacter } from './RepresentativeCharacter';

export type RepresentativeVariant = 'strategist' | 'general';

interface CharacterChoiceScreenProps {
  onSelect: (variant: RepresentativeVariant) => void;
}

export function CharacterChoiceScreen({ onSelect }: CharacterChoiceScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1528]/92 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg text-center"
      >
        <div className="sg-panel-dark p-5 mb-6">
          <h2 className="sg-heading">대표 캐릭터를 선택하세요</h2>
          <p className="sg-subtitle mt-2">나를 나타낼 스타일을 골라주세요. 언제든 클릭해서 바꿀 수 있어요.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('strategist')}
            className="sg-card-dark border-2 border-amber-900/70 p-6 transition-colors hover:border-amber-400/90"
          >
            <div className="flex justify-center mb-3">
              <RepresentativeCharacter variant="strategist" size={96} />
            </div>
            <span className="text-lg font-black text-amber-100">책사 스타일</span>
            <p className="text-xs mt-1 text-slate-300">전략과 지혜</p>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('general')}
            className="sg-card-dark border-2 border-amber-900/70 p-6 transition-colors hover:border-amber-400/90"
          >
            <div className="flex justify-center mb-3">
              <RepresentativeCharacter variant="general" size={96} />
            </div>
            <span className="text-lg font-black text-amber-100">장군 스타일</span>
            <p className="text-xs mt-1 text-slate-300">리더십과 결단</p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
