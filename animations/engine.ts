import { Animated, InteractionManager, Platform } from 'react-native';
import { DURATIONS, EASINGS, SPRING_CONFIGS } from './config';

/**
 * Animation Engine
 * Core primitives for the animation system using native driver.
 */

// Use native driver where possible (mostly transform/opacity)
const USE_NATIVE_DRIVER = true;

type AnimationCallback = (finished: boolean) => void;

/**
 * Run a timing animation with standard presets
 */
export const animateTiming = (
  value: Animated.Value | Animated.ValueXY,
  toValue: number | { x: number; y: number },
  options: {
    duration?: number;
    easing?: (value: number) => number;
    delay?: number;
    useNativeDriver?: boolean;
  } = {}
): Animated.CompositeAnimation => {
  return Animated.timing(value, {
    toValue,
    duration: options.duration ?? DURATIONS.Medium,
    easing: options.easing ?? EASINGS.Standard,
    delay: options.delay ?? 0,
    useNativeDriver: options.useNativeDriver ?? USE_NATIVE_DRIVER,
  });
};

/**
 * Run a spring animation with physics presets
 */
export const animateSpring = (
  value: Animated.Value | Animated.ValueXY,
  toValue: number | { x: number; y: number },
  options: {
    config?: typeof SPRING_CONFIGS.Default;
    delay?: number;
    velocity?: number | { x: number; y: number };
    useNativeDriver?: boolean;
  } = {}
): Animated.CompositeAnimation => {
  const config = options.config ?? SPRING_CONFIGS.Default;
  return Animated.spring(value, {
    toValue,
    ...config,
    delay: options.delay ?? 0,
    velocity: options.velocity,
    useNativeDriver: options.useNativeDriver ?? USE_NATIVE_DRIVER,
  });
};

/**
 * Run animation in sequence
 */
export const runSequence = (
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation => {
  return Animated.sequence(animations);
};

/**
 * Run animations in parallel
 */
export const runParallel = (
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation => {
  return Animated.parallel(animations);
};

/**
 * Run animations with stagger
 */
export const runStagger = (
  time: number,
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation => {
  return Animated.stagger(time, animations);
};

/**
 * Helper to run an animation after interactions are cleared
 * Preventing jank during heavy JS thread operations (like navigation)
 */
export const runAfterInteractions = (
  animation: () => void
) => {
  InteractionManager.runAfterInteractions(() => {
    animation();
  });
};
