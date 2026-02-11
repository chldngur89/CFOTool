import { motion } from 'motion/react';
import { RepresentativeCharacter } from './RepresentativeCharacter';

export type RepresentativeVariant = 'strategist' | 'general';

interface CharacterChoiceScreenProps {
  onSelect: (variant: RepresentativeVariant) => void;
}

export function CharacterChoiceScreen({ onSelect }: CharacterChoiceScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-custom/95 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-2">대표 캐릭터를 선택하세요</h2>
        <p className="text-slate-400 text-sm mb-8">나를 나타낼 스타일을 골라주세요. 언제든 클릭해서 바꿀 수 있어요.</p>

        <div className="grid grid-cols-2 gap-6">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('strategist')}
            className="bg-white/10 hover:bg-white/20 border-2 border-slate-600 hover:border-primary rounded-2xl p-6 transition-colors"
          >
            <div className="flex justify-center mb-3">
              <RepresentativeCharacter variant="strategist" size={96} />
            </div>
            <span className="text-lg font-bold text-white">책사 스타일</span>
            <p className="text-slate-400 text-xs mt-1">전략과 지혜</p>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('general')}
            className="bg-white/10 hover:bg-white/20 border-2 border-slate-600 hover:border-primary rounded-2xl p-6 transition-colors"
          >
            <div className="flex justify-center mb-3">
              <RepresentativeCharacter variant="general" size={96} />
            </div>
            <span className="text-lg font-bold text-white">장군 스타일</span>
            <p className="text-slate-400 text-xs mt-1">리더십과 결단</p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
