import React from 'react';
import { ViewProps, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useEntranceAnimation } from '../hooks/useEntranceAnimation';

interface AnimatedCardProps extends ViewProps {
  children: React.ReactNode;
  index?: number;
  delayOffset?: number;
}

/**
 * AnimatedCard
 * Base container component with intelligent stagger and entrance physics.
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  index = 0,
  delayOffset = 0,
  ...props
}) => {
  const entranceStyle = useEntranceAnimation(index, delayOffset);

  return (
    <Animated.View
      {...props}
      style={[styles.card, style, entranceStyle]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
});
