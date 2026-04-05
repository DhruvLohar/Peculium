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

export interface GroupedBarSegment {
  key: string;
  color: string;
}

export interface GroupedBarChartDataPoint {
  label: string;
  values: Record<string, number>;
}

export interface GroupedBarChartProps {
  data: GroupedBarChartDataPoint[];
  segments: GroupedBarSegment[];
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
}

const AnimatedBar: React.FC<AnimatedBarProps> = memo(
  ({ x, value, maxValue, barWidth, chartHeight, color, delay, duration }) => {
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

    return (
      <AnimatedRect
        x={x}
        width={barWidth}
        fill={color}
        stroke="#000000"
        strokeWidth={2}
        animatedProps={animatedProps}
      />
    );
  },
);

AnimatedBar.displayName = 'AnimatedBar';

// ─── GroupedTooltip ──────────────────────────────────────────────────────────

interface GroupedTooltipProps {
  x: number;
  y: number;
  label: string;
  segments: GroupedBarSegment[];
  values: Record<string, number>;
  visible: boolean;
}

const GroupedTooltip: React.FC<GroupedTooltipProps> = memo(
  ({ x, y, label, segments, values, visible }) => {
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
      </AnimatedView>
    );
  },
);

GroupedTooltip.displayName = 'GroupedTooltip';

// ─── GroupedBarChart ─────────────────────────────────────────────────────────

const GroupedBarChart: React.FC<GroupedBarChartProps> = ({
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

  const maxValue = useMemo(() => {
    let m = 0;
    for (const point of data) {
      for (const seg of segments) {
        const v = point.values[seg.key] ?? 0;
        if (v > m) m = v;
      }
    }
    return m;
  }, [data, segments]);

  const { max, ticks } = useMemo(() => computeYAxisScale(maxValue, 5), [maxValue]);

  const yAxisWidth = 40;
  const xAxisHeight = 24;
  const chartHeight = height - xAxisHeight;
  const svgWidth = Math.max(chartWidth - yAxisWidth, 0);

  const groupGap = 12;
  const innerGap = 3;
  const segCount = segments.length;

  const groupWidth = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.max(
      (svgWidth - groupGap * (data.length + 1)) / data.length,
      segCount * 8 + (segCount - 1) * innerGap,
    );
  }, [svgWidth, data.length, segCount]);

  const singleBarWidth = useMemo(() => {
    return Math.max((groupWidth - innerGap * (segCount - 1)) / segCount, 4);
  }, [groupWidth, segCount]);

  const groups = useMemo(() => {
    return data.map((point, index) => {
      const x = groupGap + index * (groupWidth + groupGap);
      return { x, point, index };
    });
  }, [data, groupWidth]);

  const handleBarPress = useCallback((index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleBackgroundPress = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const tooltipData = useMemo(() => {
    if (selectedIndex === null || !groups[selectedIndex]) return null;

    const group = groups[selectedIndex];
    const groupCenterX = yAxisWidth + group.x + groupWidth / 2;

    const groupMax = Math.max(
      ...segments.map((seg) => group.point.values[seg.key] ?? 0),
    );
    const barTopY = chartHeight - (groupMax / max) * chartHeight;

    const tooltipWidth = 130;
    const tooltipHeight = 30 + segments.length * 22;
    const gap = 12;

    let tooltipX = groupCenterX - tooltipWidth / 2;
    tooltipX = Math.max(8, Math.min(tooltipX, chartWidth - tooltipWidth - 8));

    let tooltipY = barTopY - tooltipHeight - gap;
    if (tooltipY < 0) {
      tooltipY = barTopY + gap;
    }

    return {
      x: tooltipX,
      y: tooltipY,
      label: group.point.label,
      values: group.point.values,
    };
  }, [selectedIndex, groups, groupWidth, max, chartHeight, chartWidth, yAxisWidth, segments]);

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

                {/* Selection shadow */}
                {selectedIndex !== null && groups[selectedIndex] && (
                  <Rect
                    x={groups[selectedIndex].x + 3}
                    y={3}
                    width={groupWidth}
                    height={chartHeight}
                    fill="#5a5a5a"
                    opacity={0.3}
                  />
                )}

                {/* Grouped bars */}
                {groups.map(({ x, point, index }) =>
                  segments.map((seg, segIdx) => {
                    const value = point.values[seg.key] ?? 0;
                    if (value === 0) return null;
                    const barX = x + segIdx * (singleBarWidth + innerGap);
                    return (
                      <AnimatedBar
                        key={`bar-${index}-${seg.key}`}
                        x={barX}
                        value={value}
                        maxValue={max}
                        barWidth={singleBarWidth}
                        chartHeight={chartHeight}
                        color={seg.color}
                        delay={index * 80}
                        duration={animationDuration}
                      />
                    );
                  }),
                )}
              </Svg>

              {/* Invisible tap targets */}
              {groups.map(({ x, index }) => (
                <Pressable
                  key={`tap-${index}`}
                  onPress={() => handleBarPress(index)}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: 0,
                    width: groupWidth + groupGap,
                    height: chartHeight,
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* X-axis labels */}
        <View className="flex-row" style={{ height: xAxisHeight, marginLeft: yAxisWidth }}>
          {groups.map(({ x, point, index }) => (
            <View
              key={`x-label-${index}`}
              style={{
                position: 'absolute',
                left: x,
                width: groupWidth,
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
          <GroupedTooltip
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

export default memo(GroupedBarChart);
