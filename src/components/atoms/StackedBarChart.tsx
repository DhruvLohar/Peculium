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

export interface StackedBarSegment {
  key: string;
  color: string;
}

export interface StackedBarChartDataPoint {
  label: string;
  values: Record<string, number>;
}

export interface StackedBarChartProps {
  data: StackedBarChartDataPoint[];
  segments: StackedBarSegment[];
  height?: number;
  animationDuration?: number;
  className?: string;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function computeYAxisScale(maxValue: number, tickCount: number = 5) {
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

// ─── AnimatedStackSegment ────────────────────────────────────────────────────

interface AnimatedStackSegmentProps {
  x: number;
  baseY: number;
  segmentHeight: number;
  barWidth: number;
  chartHeight: number;
  color: string;
  delay: number;
  duration: number;
}

const AnimatedStackSegment: React.FC<AnimatedStackSegmentProps> = memo(
  ({ x, baseY, segmentHeight, barWidth, chartHeight, color, delay, duration }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
      progress.value = withDelay(
        delay,
        withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
      );
    }, [delay, duration, progress]);

    const animatedProps = useAnimatedProps(() => {
      const totalFromBottom = (chartHeight - baseY) * progress.value;
      const currentSegH = segmentHeight * progress.value;
      const y = chartHeight - totalFromBottom;
      return {
        y,
        height: Math.max(currentSegH, 0),
      };
    });

    return (
      <AnimatedRect
        x={x}
        width={barWidth}
        fill={color}
        animatedProps={animatedProps}
      />
    );
  },
);

AnimatedStackSegment.displayName = 'AnimatedStackSegment';

// ─── StackedTooltip ──────────────────────────────────────────────────────────

interface StackedTooltipProps {
  x: number;
  y: number;
  label: string;
  segments: StackedBarSegment[];
  values: Record<string, number>;
  visible: boolean;
}

const StackedTooltip: React.FC<StackedTooltipProps> = memo(
  ({ x, y, label, segments, values, visible }) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
      opacity.value = withTiming(visible ? 1 : 0, { duration: 150 });
    }, [visible, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    const total = useMemo(
      () => segments.reduce((sum, seg) => sum + (values[seg.key] ?? 0), 0),
      [segments, values],
    );

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
        className="bg-white border-2 border-black px-3 py-2 min-w-[130px]"
        pointerEvents="none"
      >
        <CustomText variant="label" className="text-xs font-sans-bold mb-2">
          {label}
        </CustomText>
        {segments.map((seg) => (
          <View key={seg.key} className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center">
              <View
                style={{ width: 10, height: 10, backgroundColor: seg.color, marginRight: 6 }}
                className="border border-black"
              />
              <CustomText variant="label" className="text-xs text-muted-foreground">
                {seg.key}
              </CustomText>
            </View>
            <CustomText className="text-xs font-sans-bold ml-4">
              {values[seg.key] ?? 0}
            </CustomText>
          </View>
        ))}
        <View className="border-t border-black mt-1 pt-1 flex-row justify-between">
          <CustomText variant="label" className="text-xs text-muted-foreground">
            Total
          </CustomText>
          <CustomText className="text-xs font-sans-bold">{total}</CustomText>
        </View>
      </AnimatedView>
    );
  },
);

StackedTooltip.displayName = 'StackedTooltip';

// ─── StackedBarChart ─────────────────────────────────────────────────────────

const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data,
  segments,
  height = 240,
  animationDuration = 600,
  className,
}) => {
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setChartWidth(width);
  }, []);

  const totals = useMemo(
    () =>
      data.map((point) =>
        segments.reduce((sum, seg) => sum + (point.values[seg.key] ?? 0), 0),
      ),
    [data, segments],
  );

  const maxTotal = useMemo(() => Math.max(...totals, 0), [totals]);

  const { max, ticks } = useMemo(() => computeYAxisScale(maxTotal, 5), [maxTotal]);

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
      return { x, point, index };
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
    const total = totals[selectedIndex];
    const barCenterX = yAxisWidth + bar.x + barWidth / 2;
    const barTopY = chartHeight - (total / max) * chartHeight;

    const tooltipWidth = 130;
    const tooltipHeight = 40 + segments.length * 22 + 28;
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
      label: bar.point.label,
      values: bar.point.values,
    };
  }, [selectedIndex, bars, barWidth, max, chartHeight, chartWidth, yAxisWidth, totals, segments]);

  const LABEL_HEIGHT = 16;

  return (
    <Pressable onPress={handleBackgroundPress} className={className}>
      <View style={{ height, position: 'relative' }} onLayout={handleLayout}>
        <View className="flex-row" style={{ height: chartHeight }}>
          {/* Y-axis labels */}
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

                {/* Selection shadow — render behind bars */}
                {selectedIndex !== null && bars[selectedIndex] && (
                  <Rect
                    x={bars[selectedIndex].x + 3}
                    y={3}
                    width={barWidth}
                    height={chartHeight}
                    fill="#5a5a5a"
                    opacity={0.3}
                  />
                )}

                {/* Stacked bar segments */}
                {bars.map(({ x, point, index }) => {
                  let cumulativeValue = 0;
                  return segments.map((seg) => {
                    const segValue = point.values[seg.key] ?? 0;
                    if (segValue === 0) {
                      return null;
                    }
                    cumulativeValue += segValue;
                    const baseY = chartHeight - (cumulativeValue / max) * chartHeight;
                    const segmentHeight = (segValue / max) * chartHeight;

                    return (
                      <AnimatedStackSegment
                        key={`bar-${index}-${seg.key}`}
                        x={x}
                        baseY={baseY}
                        segmentHeight={segmentHeight}
                        barWidth={barWidth}
                        chartHeight={chartHeight}
                        color={seg.color}
                        delay={index * 80}
                        duration={animationDuration}
                      />
                    );
                  });
                })}

                {/* Single border outline for each full stacked bar */}
                {bars.map(({ x, index }) => {
                  const total = totals[index];
                  if (total === 0) return null;
                  const barH = (total / max) * chartHeight;
                  return (
                    <Rect
                      key={`outline-${index}`}
                      x={x}
                      y={chartHeight - barH}
                      width={barWidth}
                      height={barH}
                      fill="none"
                      stroke="#000000"
                      strokeWidth={2}
                    />
                  );
                })}
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
          <StackedTooltip
            x={tooltipData.x}
            y={tooltipData.y}
            label={tooltipData.label}
            segments={segments}
            values={tooltipData.values}
            visible={selectedIndex !== null}
          />
        )}
      </View>
    </Pressable>
  );
};

export default memo(StackedBarChart);
