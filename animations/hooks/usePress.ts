import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { animateSpring, animateTiming } from '../engine';
import { SCALES, OPACITY, SPRING_CONFIGS, DURATIONS } from '../config';

export const usePress = ({
  scaleActive = SCALES.Press,
  opacityActive = OPACITY.High,
} = {}) => {
  const scale = useRef(new Animated.Value(SCALES.Normal)).current;
  const opacity = useRef(new Animated.Value(OPACITY.Full)).current;

  const pressIn = useCallback(() => {
    Animated.parallel([
      animateSpring(scale, scaleActive, { config: SPRING_CONFIGS.Stiff }),
      animateTiming(opacity, opacityActive, { duration: DURATIONS.VeryFast }),
    ]).start();
  }, [scale, opacity, scaleActive, opacityActive]);

  const pressOut = useCallback(() => {
    Animated.parallel([
      animateSpring(scale, SCALES.Normal, { config: SPRING_CONFIGS.Default }),
      animateTiming(opacity, OPACITY.Full, { duration: DURATIONS.Fast }),
    ]).start();
  }, [scale, opacity]);

  return {
    scale,
    opacity,
    pressIn,
    pressOut,
    handlers: {
      onPressIn: pressIn,
      onPressOut: pressOut,
    },
    animatedStyle: {
      transform: [{ scale }],
      opacity,
    },
  };
};
