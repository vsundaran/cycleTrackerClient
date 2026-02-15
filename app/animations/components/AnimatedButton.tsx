import React from 'react';
import { Pressable, PressableProps, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePremiumPress } from '../hooks/usePremiumPress';

interface AnimatedButtonProps extends PressableProps {
  children: React.ReactNode;
  containerStyle?: any;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * AnimatedButton
 * Global interactive button with haptic feedback and spring scale micro-interactions.
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  containerStyle,
  onPress,
  ...props
}) => {
  const { onPressIn, onPressOut, animatedStyle } = usePremiumPress();

  return (
    <AnimatedPressable
      {...props}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.base, containerStyle, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
