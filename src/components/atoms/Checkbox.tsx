import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { getThemeColors } from '@/utils/themeColors';

const checkboxVariants = cva('border-2 items-center justify-center', {
  variants: {
    variant: {
      default: 'border-border',
      outline: 'border-border bg-transparent',
      solid: 'border-border',
    },
    size: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const checkedBgVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-primary',
      outline: 'bg-transparent',
      solid: 'bg-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const checkIconSizes: Record<NonNullable<VariantProps<typeof checkboxVariants>['size']>, number> = {
  sm: 10,
  md: 12,
  lg: 14,
};

export interface CheckboxProps extends VariantProps<typeof checkboxVariants> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const handlePress = useCallback(() => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setInternalChecked(next);
    onCheckedChange?.(next);
  }, [disabled, isChecked, isControlled, onCheckedChange]);

  const containerClass = useMemo(
    () =>
      cn(
        checkboxVariants({ variant, size }),
        isChecked && checkedBgVariants({ variant }),
        disabled && 'opacity-50',
        className,
      ),
    [variant, size, isChecked, disabled, className],
  );

  const iconColor = variant === 'solid' ? colors.foreground : colors.border;

  const iconSize = useMemo(
    () => checkIconSizes[size ?? 'md'],
    [size],
  );

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <View className={containerClass}>
        {isChecked && (
          <Feather name="check" size={iconSize} color={iconColor} />
        )}
      </View>
    </Pressable>
  );
};

export default memo(Checkbox);
