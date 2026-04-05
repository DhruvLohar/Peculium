# ProgressBar Component

A beautiful, animated progress bar component with neo-brutalism styling for React Native.

## Features

✨ **Smooth Animations** - Spring or timing animations with Reanimated
🎨 **Neo-Brutalism Design** - Bold borders and vibrant colors
🎯 **Type-Safe** - Full TypeScript support
⚡ **Performant** - Uses React Native Reanimated
🔧 **Customizable** - Multiple variants, sizes, and colors
📦 **Zero Dependencies** - Only uses existing project libraries

## Usage

### Basic Example

```tsx
import ProgressBar from '@/components/atoms/ProgressBar';

<ProgressBar value={75} />
```

### With Custom Colors

```tsx
<ProgressBar value={60} color="destructive" />
<ProgressBar value={45} color="secondary" />
<ProgressBar value={90} color="accent" />
```

### Different Sizes

```tsx
<ProgressBar value={50} size="sm" />
<ProgressBar value={50} size="md" /> {/* Default */}
<ProgressBar value={50} size="lg" />
```

### Variants

```tsx
<ProgressBar value={75} variant="default" /> {/* White background */}
<ProgressBar value={75} variant="muted" />   {/* Muted background */}
```

### Animation Types

```tsx
{/* Smooth timing animation (default) */}
<ProgressBar value={80} animationType="timing" />

{/* Bouncy spring animation */}
<ProgressBar value={80} animationType="spring" />

{/* No animation */}
<ProgressBar value={80} animated={false} />
```

### Custom Max Value

```tsx
{/* Progress out of 200 */}
<ProgressBar value={150} max={200} />
```

### Custom Styling

```tsx
<ProgressBar
  value={65}
  className="rounded-full h-8"
  indicatorClassName="bg-gradient-to-r from-yellow-400 to-orange-500"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | `0` | Current progress value (0 to max) |
| `max` | `number` | `100` | Maximum value |
| `variant` | `'default' \| 'muted'` | `'default'` | Background variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Height of the progress bar |
| `color` | `'primary' \| 'secondary' \| 'destructive' \| 'accent'` | `'primary'` | Indicator color |
| `animated` | `boolean` | `true` | Enable/disable animation |
| `animationType` | `'timing' \| 'spring'` | `'timing'` | Type of animation |
| `className` | `string` | - | Additional classes for container |
| `indicatorClassName` | `string` | - | Additional classes for indicator |

## Real-World Examples

### Budget Progress

```tsx
const BudgetCard = ({ spent, budget }: { spent: number; budget: number }) => {
  const percentage = (spent / budget) * 100;
  const isOverBudget = percentage > 100;
  
  return (
    <View className="p-4 bg-white border-2 border-black">
      <CustomText variant="h4">Monthly Budget</CustomText>
      <CustomText variant="muted">
        ₹{spent.toLocaleString()} / ₹{budget.toLocaleString()}
      </CustomText>
      <ProgressBar
        value={spent}
        max={budget}
        color={isOverBudget ? 'destructive' : 'primary'}
        className="mt-2"
      />
    </View>
  );
};
```

### Savings Goal

```tsx
const SavingsGoal = () => {
  const saved = 45000;
  const goal = 100000;
  
  return (
    <View className="gap-2">
      <View className="flex-row justify-between">
        <CustomText variant="label">Savings Goal</CustomText>
        <CustomText variant="label">{Math.round((saved / goal) * 100)}%</CustomText>
      </View>
      <ProgressBar
        value={saved}
        max={goal}
        color="accent"
        size="lg"
        animationType="spring"
      />
      <CustomText variant="muted" className="text-xs">
        ₹{saved.toLocaleString()} saved of ₹{goal.toLocaleString()}
      </CustomText>
    </View>
  );
};
```

### Multi-Step Progress

```tsx
const OnboardingProgress = ({ currentStep, totalSteps }: { 
  currentStep: number; 
  totalSteps: number; 
}) => {
  return (
    <View className="gap-2">
      <CustomText variant="label">
        Step {currentStep} of {totalSteps}
      </CustomText>
      <ProgressBar
        value={currentStep}
        max={totalSteps}
        size="sm"
        color="secondary"
      />
    </View>
  );
};
```

### Loading State

```tsx
const UploadProgress = ({ progress }: { progress: number }) => {
  return (
    <View className="gap-2">
      <View className="flex-row justify-between">
        <CustomText>Uploading...</CustomText>
        <CustomText>{progress}%</CustomText>
      </View>
      <ProgressBar
        value={progress}
        color="primary"
        animationType="timing"
      />
    </View>
  );
};
```

### Category Spending Breakdown

```tsx
const CategoryProgress = () => {
  const categories = [
    { name: 'Food', spent: 5000, budget: 8000, color: 'primary' as const },
    { name: 'Rent', spent: 15000, budget: 15000, color: 'secondary' as const },
    { name: 'Travel', spent: 3500, budget: 2000, color: 'destructive' as const },
  ];

  return (
    <View className="gap-4">
      {categories.map((cat) => (
        <View key={cat.name} className="gap-1">
          <View className="flex-row justify-between">
            <CustomText variant="label">{cat.name}</CustomText>
            <CustomText variant="muted" className="text-xs">
              ₹{cat.spent} / ₹{cat.budget}
            </CustomText>
          </View>
          <ProgressBar
            value={cat.spent}
            max={cat.budget}
            color={cat.color}
            size="sm"
          />
        </View>
      ))}
    </View>
  );
};
```

## Design Specs

- **Border:** 2px solid black (neo-brutalism)
- **Colors:** Uses theme colors from tailwind.config.js
- **Heights:** sm: 8px, md: 16px, lg: 24px
- **Animation:** 300ms timing / spring with damping 15

## Performance

- ✅ Uses `memo()` to prevent unnecessary re-renders
- ✅ Uses `useMemo()` for computed values
- ✅ Reanimated runs on UI thread (60fps guaranteed)
- ✅ No expensive calculations on render

## Accessibility

- Progress is visually represented with color and width
- Consider adding text labels for percentage/values
- Ensure sufficient color contrast

## Tips

1. **Always provide context**: Show numbers alongside the bar
2. **Use appropriate colors**: Red for over-budget, yellow for progress, green for goals
3. **Animate wisely**: Use spring for user actions, timing for data updates
4. **Size matters**: Use `sm` for lists, `md` for cards, `lg` for highlights
5. **Clamp values**: Component automatically clamps 0 ≤ value ≤ max

## Related Components

- `BarChart` - For historical data visualization
- `CustomText` - For labels and values
- `Button` - For interactive elements
