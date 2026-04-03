import React, { memo, useMemo } from 'react';
import { Text, type TextProps } from 'react-native';
import { cn } from '../../utils/cn';

export interface LabelProps extends TextProps {
  className?: string;
  disabled?: boolean;
}

const Label: React.FC<LabelProps> = ({ className, disabled = false, children, ...props }) => {
  const labelClass = useMemo(
    () => cn('font-sans text-sm text-foreground leading-none', disabled && 'opacity-50', className),
    [className, disabled],
  );

  return (
    <Text className={labelClass} {...props}>
      {children}
    </Text>
  );
};

export default memo(Label);
