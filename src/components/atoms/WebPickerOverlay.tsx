import React, { createElement, memo, useCallback, useMemo } from 'react';

interface WebPickerOverlayProps {
  mode: 'date' | 'time';
  value: Date;
  maximumDate?: Date;
  onChange: (selected: Date) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toDateValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeValue = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const OVERLAY_STYLE = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  cursor: 'pointer',
  border: 0,
  padding: 0,
  margin: 0,
} as const;

/**
 * Web only: an invisible native <input type="date|time"> laid over the field, so tapping it opens
 * the browser's own picker (the wheel picker in iOS Safari). @react-native-community/datetimepicker
 * has no web implementation. Render inside a relatively positioned parent.
 */
const WebPickerOverlay: React.FC<WebPickerOverlayProps> = ({
  mode,
  value,
  maximumDate,
  onChange,
}) => {
  const inputValue = useMemo(
    () => (mode === 'date' ? toDateValue(value) : toTimeValue(value)),
    [mode, value]
  );
  const max = useMemo(
    () => (mode === 'date' && maximumDate ? toDateValue(maximumDate) : undefined),
    [mode, maximumDate]
  );

  const handleChange = useCallback(
    (event: { target: { value: string } }) => {
      const raw = event.target.value;
      if (!raw) return;
      const next = new Date(value);
      if (mode === 'date') {
        const [y, m, d] = raw.split('-').map(Number);
        next.setFullYear(y, m - 1, d);
      } else {
        const [h, min] = raw.split(':').map(Number);
        next.setHours(h, min);
      }
      onChange(next);
    },
    [mode, value, onChange]
  );

  // Desktop browsers only open the picker from the calendar icon unless asked explicitly
  const handleClick = useCallback((event: { currentTarget: { showPicker?: () => void } }) => {
    try {
      event.currentTarget.showPicker?.();
    } catch {
      // showPicker throws outside a user gesture; the native tap behaviour still applies
    }
  }, []);

  return createElement('input', {
    type: mode,
    value: inputValue,
    max,
    onChange: handleChange,
    onClick: handleClick,
    'aria-label': mode === 'date' ? 'Pick date' : 'Pick time',
    style: OVERLAY_STYLE,
  });
};

export default memo(WebPickerOverlay);
