import React, { useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { Animated } from 'react-native';
import { useFade } from '../hooks/useFade';
import { useSlide } from '../hooks/useSlide';
import { AnimatedPressable } from './AnimatedPressable';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  onPress?: () => void;
  index?: number; // For staggering
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  delay = 0,
  onPress,
  index = 0,
}) => {
  const { opacity, fadeIn } = useFade(0);
  const { transformStyle, slideIn } = useSlide('bottom', false, 50);

  useEffect(() => {
    const startDelay = delay + (index * 50); // Stagger by index
    const timer = setTimeout(() => {
      fadeIn();
      slideIn();
    }, startDelay);
    return () => clearTimeout(timer);
  }, [delay, index]);

  const Container = onPress ? AnimatedPressable : Animated.View;

  return (
    <Container 
      onPress={onPress}
      style={[
        style, 
        { opacity }, 
        transformStyle
      ]}
    >
      {children}
    </Container>
  );
};
