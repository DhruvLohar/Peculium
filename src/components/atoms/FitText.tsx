import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import CustomText from './CustomText';

interface FitTextProps {
  children: string;
  /** Largest font size to use when the text fits. */
  maxFontSize: number;
  /** Never shrink below this. */
  minFontSize?: number;
  className?: string;
}

// Average glyph width of ArchivoBlack digits/punctuation as a fraction of font size
const GLYPH_WIDTH_RATIO = 0.68;

/**
 * Single-line heading text that shrinks to fit its container's width.
 * Measures the real width, so it behaves the same on web (where adjustsFontSizeToFit is unsupported)
 * and on narrow phones.
 */
const FitText: React.FC<FitTextProps> = ({
  children,
  maxFontSize,
  minFontSize = 12,
  className,
}) => {
  const [width, setWidth] = useState(0);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const textStyle = useMemo(() => {
    const fitted = width > 0 ? width / (children.length * GLYPH_WIDTH_RATIO) : maxFontSize;
    const fontSize = Math.max(minFontSize, Math.min(maxFontSize, Math.floor(fitted)));
    return { fontSize, lineHeight: Math.round(fontSize * 1.2) };
  }, [width, children.length, maxFontSize, minFontSize]);

  return (
    <View onLayout={handleLayout}>
      <CustomText variant="h3" numberOfLines={1} className={className} style={textStyle}>
        {children}
      </CustomText>
    </View>
  );
};

export default memo(FitText);
