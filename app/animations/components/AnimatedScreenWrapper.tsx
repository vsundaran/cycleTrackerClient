import React from 'react';
import { ViewProps, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AnimatedScreenWrapperProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * AnimatedScreenWrapper
 * Global screen layout engine ensuring smooth fade transitions and proper safe area handling.
 */
export const AnimatedScreenWrapper: React.FC<AnimatedScreenWrapperProps> = ({
  children,
  style,
  ...props
}) => {
  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View 
        entering={FadeIn.duration(400)} 
        exiting={FadeOut.duration(300)}
        style={[styles.container, style]} 
        {...props}
      >
        {children}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
});
