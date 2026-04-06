import { View } from 'react-native';
import { cn } from '@/utils/cn';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, className }) => {
  return <View className={cn(styles.container, className)} style={{ paddingLeft: 16, paddingRight: 16 }}>{children}</View>;
};

const styles = {
  container: 'flex flex-1 p-safe bg-background px-4',
};
