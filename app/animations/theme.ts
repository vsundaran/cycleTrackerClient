import { Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

/**
 * Premium Motion Design Tokens
 */

export const DURATIONS = {
  instant: 100,
  fast: 200,
  normal: 350,
  slow: 500,
  stagger: 60,
} as const;

export const EASINGS = {
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),
  out: Easing.bezier(0.0, 0.0, 0.2, 1),
  in: Easing.bezier(0.4, 0.0, 1, 1),
  emphasized: Easing.bezier(0.3, 0.0, 0.1, 1.0),
} as const;

export const SPRINGS = {
  standard: {
    damping: 18,
    stiffness: 120,
    mass: 1,
  },
  bouncy: {
    damping: 12,
    stiffness: 180,
    mass: 0.8,
  },
  stiff: {
    damping: 25,
    stiffness: 250,
    mass: 1,
  },
} as const;

export const HAPTIC_INTENSITY = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  success: Haptics.NotificationFeedbackType.Success,
  error: Haptics.NotificationFeedbackType.Error,
} as const;

export const COLORS = {
  primary: '#4ade80',
  primaryDark: '#122017',
  danger: '#ef4444',
  text: '#0f1a13',
  textSecondary: '#64748b',
  bg: '#FFFFFF',
  bgSecondary: '#f6f8f7',
} as const;
