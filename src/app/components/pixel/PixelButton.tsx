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
        return 'sg-btn-primary';
      case 'secondary':
        return 'sg-btn-secondary';
      case 'danger':
        return 'sg-btn-danger';
      case 'success':
        return 'sg-btn-success';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-2 text-[10px]';
      case 'medium':
        return 'px-4 py-2.5 text-[11px]';
      case 'large':
        return 'px-6 py-3.5 text-xs';
    }
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        sg-btn
        ${getVariantClasses()}
        ${getSizeClasses()}
        font-bold
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {children}
    </motion.button>
  );
}
