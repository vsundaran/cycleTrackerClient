import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { runStagger, animateSpring, animateTiming } from '../engine';
import { DELAYS } from '../config';

export const useStaggerList = (itemCount: number) => {
  // Create an array of animated values, one for each item
  const validItemCount = Math.max(0, itemCount);
  const animatedValues = useRef<Animated.Value[]>([]).current;

  if (animatedValues.length !== validItemCount) {
    // Reset/Recreate if count changes significantly (naive implementation for static lists)
    // For dynamic lists, we usually map indices to values or use a key-based map.
    // For this simple hook, we'll just fill the array.
     while (animatedValues.length < validItemCount) {
        animatedValues.push(new Animated.Value(0)); // Start hidden/offset
     }
  }

  const startStagger = useCallback((direction: 'in' | 'out' = 'in') => {
    const toValue = direction === 'in' ? 1 : 0;
    const animations = animatedValues.map((anim, index) => {
       // Use spring for entrance, timing for exit
       return direction === 'in'
        ? animateSpring(anim, 1, { useNativeDriver: true, delay: 0 }) 
        : animateTiming(anim, 0, { duration: 200, useNativeDriver: true });
    });

    // Run stagger
    runStagger(DELAYS.Stagger, animations).start();
  }, [animatedValues]);

  return {
    animatedValues,
    startStagger,
  };
};
