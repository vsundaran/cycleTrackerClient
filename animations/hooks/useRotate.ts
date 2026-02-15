import { useRef, useCallback, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { animateTiming } from '../engine';
import { DURATIONS } from '../config';

export const useRotate = (initialDegree: number = 0) => {
  const rotation = useRef(new Animated.Value(initialDegree)).current;

  const rotateTo = useCallback((degree: number, duration: number = DURATIONS.Medium) => {
    animateTiming(rotation, degree, { duration }).start();
  }, [rotation]);

  const spin = useCallback((duration: number = 1000) => {
    rotation.setValue(0);
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 360,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotation]);

  const stop = useCallback(() => {
    rotation.stopAnimation();
  }, [rotation]);

  const rotateStyle = {
    transform: [
      {
        rotate: rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return {
    rotation,
    rotateTo,
    spin,
    stop,
    rotateStyle,
  };
};
