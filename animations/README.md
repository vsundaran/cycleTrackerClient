# React Native Animation System (Animated API)

## Architecture Overview

This system is built using React Native's built-in `Animated` API, optimized for 60fps performance by strictly adhering to `useNativeDriver` and avoiding re-renders.

### Folder Structure

- **`config.ts`**: Single source of truth for motion tokens (duration, easing).
- **`engine.ts`**: Core wrapper enabling production-safe animation execution.
- **`hooks/`**: Reusable logic (`useFade`, `useScale`, etc.) following the "hook returns controller" pattern.
- **`components/`**: Animated primitives (`AnimatedPressable`, `AnimatedCard`) that compose hooks.

### Performance Strategy

1.  **Native Driver**: All transform/opacity animations use `useNativeDriver: true` (enforced by `engine.ts`).
2.  **Memoization**: Hooks use `useRef` for `Animated.Value` to prevent recreation on re-renders.
3.  **Batching**: Complex sequences are batched using `Animated.parallel` or `stagger`.

---

## Testing Checklist

Verify the following before shipping:

- [ ] **Frame Rate**: Monitor FPS overlay (Expo menu -> Perf Monitor). Should stay at 60fps during transitions.
- [ ] **Dropped Frames**: Rapidly toggle animations (e.g., press button quickly). No stutter should occur.
- [ ] **Native Driver**: Check JS thread FPS. If it drops but UI thread stays high, animations are correctly native.
- [ ] **Unmount Safety**: Navigate away while animation is running. App should not crash.
- [ ] **Memory**: Check for `Animated.Value` leaks (hooks handle cleanup).
- [ ] **Reduced Motion**: Verify app respects system reduced motion settings.

---

## Common Mistakes & Fixes

### 1. Creating `Animated.Value` in render

**Mistake**: `const fade = new Animated.Value(0);`
**Fix**: `const fade = useRef(new Animated.Value(0)).current;`
**Why**: Recreating value resets animation state and hurts memory.

### 2. forgetting `useNativeDriver`

**Mistake**: `Animated.timing(val, { toValue: 1 }).start()`
**Fix**: Use `animateTiming` helper which enforces native driver.
**Why**: Without native driver, animation runs on JS thread, causing jank.

### 3. Inline Styles for Animated Values

**Mistake**: `<Animated.View style={{ opacity: fade }} />`
**Fix**: `const style = { opacity: fade };` (defined outside or memoized)
**Why**: Inline objects trigger re-renders.

### 4. Animating Layout Properties

**Mistake**: Animating `width`, `height`, `marginTop`.
**Fix**: Animate `transform: [{ scale }]` or `translateY` instead.
**Why**: Layout animations trigger expensive reflows. Transform is GPU-accelerated.

---

## Usage Examples

### Fade In

```tsx
const { opacity, fadeIn } = useFade();
useEffect(() => {
  fadeIn();
}, []);
return <Animated.View style={{ opacity }} />;
```

### Scale Button

```tsx
const { scale, handlers } = useScale();
return (
  <Pressable {...handlers}>
    <Animated.View style={{ transform: [{ scale }] }}>
      <Text>Press Me</Text>
    </Animated.View>
  </Pressable>
);
```
