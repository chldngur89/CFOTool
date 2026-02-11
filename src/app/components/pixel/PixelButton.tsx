import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface PixelButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export function PixelButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false
}: PixelButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-white hover:bg-primary/90 shadow-sm';
      case 'secondary':
        return 'bg-white border border-slate-200 text-navy-custom hover:bg-slate-50 shadow-sm';
      case 'danger':
        return 'bg-red-500 text-white hover:bg-red-600 shadow-sm';
      case 'success':
        return 'bg-green-600 text-white hover:bg-green-700 shadow-sm';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-1.5 text-[10px]';
      case 'medium':
        return 'px-4 py-2.5 text-sm';
      case 'large':
        return 'px-6 py-3 text-base';
    }
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        font-bold rounded-xl transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {children}
    </motion.button>
  );
}
