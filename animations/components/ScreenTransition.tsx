import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Animated } from 'react-native';
import { useFade } from '../hooks/useFade';
import { useSlide } from '../hooks/useSlide';

interface ScreenTransitionProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  direction?: 'left' | 'right' | 'top' | 'bottom';
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  style,
  delay = 0,
  direction = 'right',
}) => {
  const { opacity, fadeIn } = useFade(0);
  const { transformStyle, slideIn } = useSlide(direction, false, 30);

  useEffect(() => {
    // Start animations on mount
    const timer = setTimeout(() => {
      fadeIn();
      slideIn();
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, style, { opacity }, transformStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%', 
  },
});
