import { Easing } from 'react-native';

/**
 * Motion System Configuration
 * Defines the physics and timing for all animations in the app.
 */

export const DURATIONS = {
  VeryFast: 200,
  Fast: 300,
  Medium: 400,
  Slow: 600,
  VerySlow: 1000,
};

export const EASINGS = {
  /**
   * Standard easing for UI elements (Material Design standard)
   */
  Standard: Easing.bezier(0.4, 0.0, 0.2, 1),
  /**
   * Decelerate easing for entering elements
   */
  Enter: Easing.out(Easing.cubic),
  /**
   * Accelerate easing for exiting elements
   */
  Exit: Easing.in(Easing.cubic),
  /**
   * Elastic bounce for playful elements
   */
  Elastic: Easing.elastic(1),
};

export const SPRING_CONFIGS = {
  /**
   * Snappy feedback for small elements (toggles, checkboxes)
   */
  Stiff: {
    stiffness: 200,
    damping: 20,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  /**
   * Default spring for most UI interactions
   */
  Default: {
    stiffness: 150,
    damping: 20,
    mass: 1,
  },
  /**
   * Bouncy spring for playful emphasis (success states, badges)
   */
  Bouncy: {
    stiffness: 150,
    damping: 12,
    mass: 1,
  },
  /**
   * Soft spring for large elements (modals, cards)
   */
  Soft: {
    stiffness: 100,
    damping: 30,
    mass: 1,
  },
};

export const OPACITY = {
  Full: 1,
  High: 0.87,
  Medium: 0.60,
  Disabled: 0.38,
  Hidden: 0,
};

export const SCALES = {
  Normal: 1,
  Press: 0.96,
  Hover: 1.02,
  Enter: 0.9,
};

export const DELAYS = {
  Stagger: 50,
  Wait: 100,
};
