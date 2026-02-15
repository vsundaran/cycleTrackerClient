import React, { useRef, useState } from 'react';
import { TextInput, Animated, StyleSheet, TextInputProps, ViewStyle, StyleProp, View, Text } from 'react-native';
import { animateTiming } from '../engine';
import { DURATIONS } from '../config';

interface ValidAnimatedInputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  label?: string;
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const AnimatedInput: React.FC<ValidAnimatedInputProps> = ({
  style,
  containerStyle,
  label,
  error,
  onFocus,
  onBlur,
  leftElement,
  rightElement,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;
  
  // Use a separate animated value for error shake to avoid conflict
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    animateTiming(focusAnim, 1, { duration: DURATIONS.Fast, useNativeDriver: false }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    animateTiming(focusAnim, 0, { duration: DURATIONS.Fast, useNativeDriver: false }).start();
    onBlur?.(e);
  };

  // Shake animation on error
  React.useEffect(() => {
    if (error) {
      Animated.sequence([
        animateTiming(shakeAnim, 10, { duration: 50, useNativeDriver: true }),
        animateTiming(shakeAnim, -10, { duration: 50, useNativeDriver: true }),
        animateTiming(shakeAnim, 10, { duration: 50, useNativeDriver: true }),
        animateTiming(shakeAnim, 0, { duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(74, 222, 128, 0.2)', '#4ade80'], // Gray/Green tint to Brand Green
  });

  const borderWidth = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  const labelColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(15, 23, 42, 0.8)', '#4ade80'],
  });

  const animatedStyle = {
      borderColor,
      borderWidth,
      transform: [{ translateX: shakeAnim }]
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Animated.Text style={[styles.label, { color: labelColor }]}>
          {label}
        </Animated.Text>
      )}
      
      <Animated.View style={[styles.inputWrapper, animatedStyle]}>
        {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
        <TextInput
          style={[styles.input, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="#94a3b8"
          {...props}
        />
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#f6f8f7',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  leftElement: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  rightElement: {
    paddingRight: 16,
  },
  error: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  }
});
