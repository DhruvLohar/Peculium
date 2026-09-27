import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import CustomText from '@/components/atoms/CustomText';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'self-start flex-row items-center border-2 border-border px-2 py-0.5 shadow-xs',
  {
    variants: {
      variant: {
        warning: 'bg-primary',
        success: 'bg-safe',
        destructive: 'bg-destructive',
        muted: 'bg-muted',
      },
    },
    defaultVariants: {
      variant: 'warning',
    },
  }
);

const badgeTextVariants = cva('font-sans-bold text-[10px] tracking-widest', {
  variants: {
    variant: {
      warning: 'text-primary-foreground',
      success: 'text-safe-foreground',
      destructive: 'text-destructive-foreground',
      muted: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'warning',
  },
});

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  label: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ label, variant, className }) => {
  const containerClass = useMemo(
    () => cn(badgeVariants({ variant }), className),
    [variant, className]
  );
  const textClass = useMemo(() => badgeTextVariants({ variant }), [variant]);

  return (
    <View className={containerClass}>
      <CustomText className={textClass}>{label}</CustomText>
    </View>
  );
};

export default memo(Badge);
