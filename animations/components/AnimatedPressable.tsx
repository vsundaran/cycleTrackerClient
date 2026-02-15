import React from 'react';
import { Pressable, Animated, ViewStyle, StyleProp, PressableProps } from 'react-native';
import { usePress } from '../hooks/usePress';
import { SCALES, OPACITY } from '../config';

interface ValidAnimatedPressableProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  scaleActive?: number;
  opacityActive?: number;
  children: React.ReactNode;
}

export const AnimatedPressable: React.FC<ValidAnimatedPressableProps> = ({
  children,
  style,
  scaleActive = SCALES.Press,
  opacityActive = OPACITY.High,
  onPressIn,
  onPressOut,
  ...props
}) => {
  const { animatedStyle, handlers } = usePress({ scaleActive, opacityActive });

  return (
    <Pressable
      onPressIn={(e) => {
        handlers.onPressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        handlers.onPressOut();
        onPressOut?.(e);
      }}
      {...props}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
