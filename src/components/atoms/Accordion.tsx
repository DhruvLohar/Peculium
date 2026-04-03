import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { cn } from '../../utils/cn';

// ─── Root Context ────────────────────────────────────────────────────────────

interface AccordionContextValue {
  type: 'single' | 'multiple';
  collapsible: boolean;
  openItems: Set<string>;
  toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion compound components must be used inside <Accordion>');
  return ctx;
}

// ─── Item Context ─────────────────────────────────────────────────────────────

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  toggle: () => void;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionItem() {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) throw new Error('AccordionHeader / AccordionContent must be used inside <Accordion.Item>');
  return ctx;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

interface AccordionProps {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string | string[];
  children: React.ReactNode;
  className?: string;
}

const AccordionRoot: React.FC<AccordionProps> = ({
  type = 'single',
  collapsible = false,
  defaultValue,
  children,
  className,
}) => {
  const [openItems, setOpenItems] = useState<Set<string>>(() => {
    if (!defaultValue) return new Set();
    if (Array.isArray(defaultValue)) return new Set(defaultValue);
    return new Set([defaultValue]);
  });

  const toggle = useCallback(
    (value: string) => {
      setOpenItems((prev) => {
        const next = new Set(prev);
        if (next.has(value)) {
          if (collapsible || type === 'multiple') next.delete(value);
        } else {
          if (type === 'single') next.clear();
          next.add(value);
        }
        return next;
      });
    },
    [type, collapsible],
  );

  const contextValue = useMemo(
    () => ({ type, collapsible, openItems, toggle }),
    [type, collapsible, openItems, toggle],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <View className={cn('gap-2', className)}>{children}</View>
    </AccordionContext.Provider>
  );
};

// ─── Item ─────────────────────────────────────────────────────────────────────

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const AccordionItem: React.FC<AccordionItemProps> = memo(({ value, children, className }) => {
  const { openItems, toggle } = useAccordion();
  const isOpen = openItems.has(value);

  const handleToggle = useCallback(() => toggle(value), [toggle, value]);

  const itemContext = useMemo(
    () => ({ value, isOpen, toggle: handleToggle }),
    [value, isOpen, handleToggle],
  );

  return (
    <AccordionItemContext.Provider value={itemContext}>
      <View
        className={cn('border-2 border-black bg-background overflow-hidden', className)}
        style={{ boxShadow: '4px 4px 0px black' }}
      >
        {children}
      </View>
    </AccordionItemContext.Provider>
  );
});

AccordionItem.displayName = 'AccordionItem';

// ─── Header ───────────────────────────────────────────────────────────────────

interface AccordionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const AccordionHeader: React.FC<AccordionHeaderProps> = memo(({ children, className }) => {
  const { isOpen, toggle } = useAccordionItem();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(isOpen ? 180 : 0, { duration: 200 });
  }, [isOpen, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Pressable
      onPress={toggle}
      className={cn('flex-row flex-1 items-center justify-between px-4 py-3', className)}
    >
      <Text className="font-head flex-1 text-foreground">{children}</Text>
      <Animated.View style={chevronStyle}>
        <Feather name="chevron-down" size={16} color="#000000" />
      </Animated.View>
    </Pressable>
  );
});

AccordionHeader.displayName = 'AccordionHeader';

// ─── Content ──────────────────────────────────────────────────────────────────

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

const AccordionContent: React.FC<AccordionContentProps> = memo(({ children, className }) => {
  const { isOpen } = useAccordionItem();
  const [contentHeight, setContentHeight] = useState(0);
  const animatedHeight = useSharedValue(0);

  useEffect(() => {
    if (contentHeight > 0) {
      animatedHeight.value = withTiming(isOpen ? contentHeight : 0, { duration: 200 });
    }
  }, [isOpen, contentHeight, animatedHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: 'hidden',
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && h !== contentHeight) setContentHeight(h);
        }}
        className="absolute left-0 right-0 top-0"
      >
        <View className={cn('px-4 pb-4 pt-2 bg-white', className)}>
          <Text className="font-sans text-muted-foreground">{children}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

AccordionContent.displayName = 'AccordionContent';

// ─── Export ───────────────────────────────────────────────────────────────────

const Accordion = Object.assign(memo(AccordionRoot), {
  Item: AccordionItem,
  Header: AccordionHeader,
  Content: AccordionContent,
});

export { Accordion };
export type { AccordionProps, AccordionItemProps, AccordionHeaderProps, AccordionContentProps };
