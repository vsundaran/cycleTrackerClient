import { useRef, useCallback } from 'react';
import { Animated, Dimensions } from 'react-native';
import { animateTiming, animateSpring } from '../engine';
import { DURATIONS, EASINGS } from '../config';

const { width, height } = Dimensions.get('window');

type SlideDirection = 'left' | 'right' | 'top' | 'bottom';

export const useSlide = (
  direction: SlideDirection = 'bottom',
  visible: boolean = false,
  offset: number = 50 // Distance to slide
) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return -offset;
      case 'right': return offset;
      case 'top': return -offset;
      case 'bottom': return offset;
      default: return offset;
    }
  };

  const translation = useRef(new Animated.Value(visible ? 0 : getInitialPosition())).current;

  const slideIn = useCallback((finishedCallback?: () => void) => {
    animateSpring(translation, 0, {
      useNativeDriver: true,
      velocity: 5
    }).start(({ finished }) => {
      if (finished && finishedCallback) finishedCallback();
    });
  }, [translation]);

  const slideOut = useCallback((finishedCallback?: () => void) => {
    animateTiming(translation, getInitialPosition(), {
      duration: DURATIONS.Fast,
      easing: EASINGS.Exit,
    }).start(({ finished }) => {
      if (finished && finishedCallback) finishedCallback();
    });
  }, [translation, direction]);

  const transformStyle = {
    transform: [
      direction === 'left' || direction === 'right'
        ? { translateX: translation }
        : { translateY: translation },
    ],
  };

  return {
    translation,
    slideIn,
    slideOut,
    transformStyle,
  };
};
