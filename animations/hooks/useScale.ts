import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { animateSpring } from '../engine';
import { SCALES, SPRING_CONFIGS } from '../config';

export const useScale = (initialValue: number = SCALES.Normal) => {
  const scale = useRef(new Animated.Value(initialValue)).current;

  const pressIn = useCallback(() => {
    animateSpring(scale, SCALES.Press, {
      config: SPRING_CONFIGS.Stiff, // Snappy response
    }).start();
  }, [scale]);

  const pressOut = useCallback(() => {
    animateSpring(scale, SCALES.Normal, {
      config: SPRING_CONFIGS.Default, // Smooth return
    }).start();
  }, [scale]);

  return {
    scale,
    pressIn,
    pressOut,
    handlers: {
      onPressIn: pressIn,
      onPressOut: pressOut,
    },
  };
};
