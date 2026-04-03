import React, { memo, useMemo } from 'react';
import { Text, type TextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      p: 'font-sans text-base',
      li: 'font-sans text-base',
      h1: 'font-head text-4xl',
      h2: 'font-head text-3xl',
      h3: 'font-head text-2xl',
      h4: 'font-head text-xl',
      h5: 'font-head text-lg',
      h6: 'font-head text-base',
      muted: 'font-sans text-base text-muted-foreground',
      label: 'font-sans-medium text-sm',
    },
  },
  defaultVariants: {
    variant: 'p',
  },
});

export interface CustomTextProps extends TextProps, VariantProps<typeof textVariants> {
  className?: string;
}

const CustomText: React.FC<CustomTextProps> = ({ variant = 'p', className, children, ...props }) => {
  const textClass = useMemo(
    () => cn(textVariants({ variant }), className),
    [variant, className],
  );

  return (
    <Text className={textClass} {...props}>
      {children}
    </Text>
  );
};

export default memo(CustomText);
export { textVariants };
