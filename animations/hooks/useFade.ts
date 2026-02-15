import { useRef, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import { animateTiming } from '../engine';
import { DURATIONS } from '../config';

export const useFade = (initialValue: number = 0, duration: number = DURATIONS.Medium) => {
  const opacity = useRef(new Animated.Value(initialValue)).current;

  const fadeIn = useCallback(
    (finishedCallback?: () => void) => {
      animateTiming(opacity, 1, { duration }).start(({ finished }) => {
        if (finished && finishedCallback) finishedCallback();
      });
    },
    [opacity, duration]
  );

  const fadeOut = useCallback(
    (finishedCallback?: () => void) => {
      animateTiming(opacity, 0, { duration }).start(({ finished }) => {
        if (finished && finishedCallback) finishedCallback();
      });
    },
    [opacity, duration]
  );

  return {
    opacity,
    fadeIn,
    fadeOut,
  };
};
