import React, { memo, useCallback, useState, useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import CustomText from './CustomText';
import Label from './Label';
import { getThemeColors } from '@/utils/themeColors';

interface DateTimeInputProps {
  label?: string;
  value: string;
  onChange: (datetime: string) => void;
  isInvalid?: boolean;
  errorMessage?: string;
}

function isoToDate(iso: string): Date {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
}

const DateTimeInput: React.FC<DateTimeInputProps> = ({
  label,
  value,
  onChange,
  isInvalid = false,
  errorMessage,
}) => {
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');

  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(isoToDate(value));

  const date = useMemo(() => isoToDate(value), [value]);

  const handleDateChange = useCallback(
    (_event: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === 'android') setShowDate(false);
      if (selected) {
        const newDate = new Date(date);
        newDate.setFullYear(selected.getFullYear());
        newDate.setMonth(selected.getMonth());
        newDate.setDate(selected.getDate());
        setTempDate(newDate);
        onChange(newDate.toISOString());
      }
    },
    [onChange, date],
  );

  const handleTimeChange = useCallback(
    (_event: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === 'android') setShowTime(false);
      if (selected) {
        const newDate = new Date(date);
        newDate.setHours(selected.getHours());
        newDate.setMinutes(selected.getMinutes());
        onChange(newDate.toISOString());
      }
    },
    [onChange, date],
  );

  const displayDate = useMemo(() => date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }), [date]);

  const displayTime = useMemo(() => date.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  }), [date]);

  const iconColor = isInvalid ? colors.destructive : colors.foreground;

  return (
    <View>
      {label && <Label className="mb-1.5">{label}</Label>}

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setShowDate(true)}
          className="flex-1 flex-row items-center justify-between border-2 border-border py-2 px-4 bg-background"
          style={isInvalid ? { borderColor: colors.destructive } : undefined}
        >
          <CustomText className={isInvalid ? 'text-destructive' : 'text-foreground'}>
            {displayDate}
          </CustomText>
          <MaterialIcons name="calendar-today" size={18} color={iconColor} />
        </Pressable>

        <Pressable
          onPress={() => setShowTime(true)}
          className="flex-1 flex-row items-center justify-between border-2 border-border py-2 px-4 bg-background"
          style={isInvalid ? { borderColor: colors.destructive } : undefined}
        >
          <CustomText className={isInvalid ? 'text-destructive' : 'text-foreground'}>
            {displayTime}
          </CustomText>
          <MaterialIcons name="access-time" size={18} color={iconColor} />
        </Pressable>
      </View>

      {isInvalid && errorMessage && (
        <CustomText className="text-xs text-destructive mt-1">{errorMessage}</CustomText>
      )}

      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {showTime && (
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

export default memo(DateTimeInput);
