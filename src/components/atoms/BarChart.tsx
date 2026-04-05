import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import CustomText from './CustomText';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedView = Animated.View;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BarChartDataPoint {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarChartDataPoint[];
  height?: number;
  barColor?: string;
  tooltipHeaders?: [string, string];
  animationDuration?: number;
  className?: string;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function computeYAxisScale(data: BarChartDataPoint[], tickCount: number = 5) {
  const maxValue = Math.max(...data.map((d) => d.value), 0);
  
  if (maxValue === 0) {
    return { max: 10, ticks: [0, 2, 4, 6, 8, 10] };
  }

  const roughStep = maxValue / (tickCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;

  let niceStep: number;
  if (normalized <= 1) niceStep = 1;
  else if (normalized <= 2) niceStep = 2;
  else if (normalized <= 5) niceStep = 5;
  else niceStep = 10;

  const step = niceStep * magnitude;
  const max = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];
  for (let i = 0; i <= max; i += step) {
    ticks.push(i);
  }

  return { max, ticks };
}

// ─── GridLines ───────────────────────────────────────────────────────────────

interface GridLinesProps {
  ticks: number[];
  maxValue: number;
  chartHeight: number;
  chartWidth: number;
}

const GridLines: React.FC<GridLinesProps> = memo(({ ticks, maxValue, chartHeight, chartWidth }) => {
  const lines = useMemo(() => {
    return ticks.map((tick) => {
      const y = chartHeight - (tick / maxValue) * chartHeight;
      return (
        <Line
          key={`grid-${tick}`}
          x1={0}
          y1={y}
          x2={chartWidth}
          y2={y}
          stroke="#aeaeae"
          strokeWidth={1}
          strokeDasharray="6 4"
        />
      );
    });
  }, [ticks, maxValue, chartHeight, chartWidth]);

  return <>{lines}</>;
});

GridLines.displayName = 'GridLines';

// ─── AnimatedBar ─────────────────────────────────────────────────────────────

interface AnimatedBarProps {
  x: number;
  value: number;
  maxValue: number;
  barWidth: number;
  chartHeight: number;
  color: string;
  delay: number;
  duration: number;
  isSelected: boolean;
}

const AnimatedBar: React.FC<AnimatedBarProps> = memo(
  ({ x, value, maxValue, barWidth, chartHeight, color, delay, duration, isSelected }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
      progress.value = withDelay(
        delay,
        withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
      );
    }, [delay, duration, progress]);

    const animatedProps = useAnimatedProps(() => {
      const barHeight = (value / maxValue) * chartHeight * progress.value;
      const barY = chartHeight - barHeight;
      return {
        y: barY,
        height: Math.max(barHeight, 0),
      };
    });

    const shadowOffset = 3;

    return (
      <>
        {isSelected && (
          <Rect
            x={x + shadowOffset}
            y={shadowOffset}
            width={barWidth}
            height={chartHeight}
            fill="#5a5a5a"
            opacity={0.3}
          />
        )}
        <AnimatedRect
          x={x}
          width={barWidth}
          fill={color}
          stroke="#000000"
          strokeWidth={2}
          animatedProps={animatedProps}
        />
      </>
    );
  },
);

AnimatedBar.displayName = 'AnimatedBar';

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipProps {
  x: number;
  y: number;
  name: string;
  value: number;
  headers: [string, string];
  visible: boolean;
}

const Tooltip: React.FC<TooltipProps> = memo(({ x, y, name, value, headers, visible }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 150 });
  }, [visible, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <AnimatedView
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          boxShadow: '3px 3px 0 0 #000000',
        },
        animatedStyle,
      ]}
      className="bg-white border-2 border-black px-3 py-2 min-w-[120px]"
      pointerEvents="none"
    >
      <View className="flex-row justify-between mb-1">
        <CustomText variant="label" className="text-xs text-muted-foreground mr-4">
          {headers[0]}
        </CustomText>
        <CustomText variant="label" className="text-xs text-muted-foreground">
          {headers[1]}
        </CustomText>
      </View>
      <View className="flex-row justify-between">
        <CustomText className="text-sm font-sans-medium mr-4">{name}</CustomText>
        <CustomText className="text-sm font-sans-bold">{value}</CustomText>
      </View>
    </AnimatedView>
  );
});

Tooltip.displayName = 'Tooltip';

// ─── BarChart ────────────────────────────────────────────────────────────────

const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 240,
  barColor = '#ffdb33',
  tooltipHeaders = ['NAME', 'ORDERS'],
  animationDuration = 600,
  className,
}) => {
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setChartWidth(width);
  }, []);

  const { max, ticks } = useMemo(() => computeYAxisScale(data, 5), [data]);

  const yAxisWidth = 40;
  const xAxisHeight = 24;
  const chartHeight = height - xAxisHeight;
  const svgWidth = Math.max(chartWidth - yAxisWidth, 0);
  
  const barGap = 12;
  const barWidth = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.max((svgWidth - barGap * (data.length + 1)) / data.length, 8);
  }, [svgWidth, data.length]);

  const bars = useMemo(() => {
    return data.map((point, index) => {
      const x = barGap + index * (barWidth + barGap);
      return {
        x,
        point,
        index,
      };
    });
  }, [data, barWidth]);

  const handleBarPress = useCallback((index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleBackgroundPress = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const tooltipData = useMemo(() => {
    if (selectedIndex === null || !bars[selectedIndex]) return null;

    const bar = bars[selectedIndex];
    const barCenterX = yAxisWidth + bar.x + barWidth / 2;
    const barTopY = chartHeight - (bar.point.value / max) * chartHeight;
    
    const tooltipWidth = 120;
    const tooltipHeight = 60;
    const gap = 12;

    let tooltipX = barCenterX - tooltipWidth / 2;
    tooltipX = Math.max(8, Math.min(tooltipX, chartWidth - tooltipWidth - 8));

    let tooltipY = barTopY - tooltipHeight - gap;
    if (tooltipY < 0) {
      tooltipY = barTopY + gap;
    }

    return {
      x: tooltipX,
      y: tooltipY,
      name: bar.point.label,
      value: bar.point.value,
    };
  }, [selectedIndex, bars, barWidth, max, chartHeight, chartWidth, yAxisWidth]);

  const LABEL_HEIGHT = 16;

  return (
    <Pressable onPress={handleBackgroundPress} className={className}>
      <View style={{ height, position: 'relative' }} onLayout={handleLayout}>
        <View className="flex-row" style={{ height: chartHeight }}>
          {/* Y-axis labels — absolutely positioned to match SVG grid lines */}
          <View style={{ width: yAxisWidth, position: 'relative' }}>
            {ticks.map((tick) => {
              const y = chartHeight - (tick / max) * chartHeight;
              return (
                <View
                  key={`y-label-${tick}`}
                  style={{
                    position: 'absolute',
                    top: y - LABEL_HEIGHT / 2,
                    right: 0,
                    height: LABEL_HEIGHT,
                    justifyContent: 'center',
                    paddingRight: 8,
                  }}
                >
                  <CustomText
                    variant="label"
                    className="text-xs text-muted-foreground text-right"
                  >
                    {tick}
                  </CustomText>
                </View>
              );
            })}
          </View>

          {/* Chart area */}
          {chartWidth > 0 && (
            <View style={{ flex: 1, position: 'relative' }}>
              <Svg width={svgWidth} height={chartHeight}>
                <GridLines
                  ticks={ticks}
                  maxValue={max}
                  chartHeight={chartHeight}
                  chartWidth={svgWidth}
                />
                {bars.map(({ x, point, index }) => (
                  <AnimatedBar
                    key={`bar-${index}-${point.label}`}
                    x={x}
                    value={point.value}
                    maxValue={max}
                    barWidth={barWidth}
                    chartHeight={chartHeight}
                    color={barColor}
                    delay={index * 80}
                    duration={animationDuration}
                    isSelected={selectedIndex === index}
                  />
                ))}
              </Svg>

              {/* Invisible tap targets */}
              {bars.map(({ x, index }) => (
                <Pressable
                  key={`tap-${index}`}
                  onPress={() => handleBarPress(index)}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: 0,
                    width: barWidth + barGap,
                    height: chartHeight,
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* X-axis labels */}
        <View className="flex-row" style={{ height: xAxisHeight, marginLeft: yAxisWidth }}>
          {bars.map(({ x, point, index }) => (
            <View
              key={`x-label-${index}`}
              style={{
                position: 'absolute',
                left: x,
                width: barWidth,
                alignItems: 'center',
              }}
            >
              <CustomText variant="label" className="text-xs text-muted-foreground mt-1">
                {point.label}
              </CustomText>
            </View>
          ))}
        </View>

        {/* Tooltip */}
        {tooltipData && (
          <Tooltip
            x={tooltipData.x}
            y={tooltipData.y}
            name={tooltipData.name}
            value={tooltipData.value}
            headers={tooltipHeaders}
            visible={selectedIndex !== null}
          />
        )}
      </View>
    </Pressable>
  );
};

export default memo(BarChart);
