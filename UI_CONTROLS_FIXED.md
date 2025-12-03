# ? UI Elements Now Functional - Variable Re-Registration Fix

## The Problem

**UI controls didn't affect drawing behavior** because:
1. Variables were registered **ONCE** with an empty dependency array
2. When you changed `brushSize` or `selectedSwatch`, the state updated in React
3. But the **old values were still in the variable resolver**
4. Pointer handlers kept using the stale values forever!

### Example Flow (BROKEN):

```typescript
// Initial render:
brushSize = 30  ? registerAll({ brushSize: 30 })  ? $get('brushSize') = 30 ?

// User moves slider to 50:
setBrushSize(50)  ? brushSize = 50 in React ?
                  ? But registry still has 30! ?
                  ? $get('brushSize') = 30 ?
                  ? Circles still size 30! ?
```

## The Root Cause

```typescript
// ? BROKEN: Empty dependency array
useEffect(() => {
  registerAll({
    brushSize,      // Captured value: 30
    getColor,       // Captured closure
    eraseMode,      // Captured value: false
    // ...
  });
}, []); // Never re-runs!
```

When you change the brush size:
- React state updates: `brushSize = 50`  
- useEffect doesn't re-run (empty dependencies)
- Registry still has `brushSize: 30`
- Pointer handlers use `$get('brushSize')` ? gets 30 ?

## The Fix

Added dependencies to **re-register when UI values change**:

```typescript
// ? FIXED: Re-register on relevant changes
useEffect(() => {
  registerAll({
    brushSize,           // Current value
    getColor,            // Current closure with palette/swatch
    eraseMode,           // Current value
    // ...all other values
  });
}, [
  // Re-run when these change:
  brushSize,             // ? Slider changes
  eraseMode,             // ? Mode buttons
  lockMode,
  recolorMode,
  paintMode,
  selectMode,
  magnetMode,
  flowMode,
  getColor,              // ? Depends on palette/selectedSwatch
  getRandomPaletteColor, // ? Depends on palette
]);
```

## Why This Works

Now when you change the UI:

```typescript
// User moves brush size slider:
setBrushSize(50)
  ?
brushSize state changes to 50
  ?
useEffect dependency changes ? re-runs
  ?
registerAll({ brushSize: 50 ... })
  ?
$get('brushSize') returns 50 ?
  ?
New circles have radius 50! ?
```

## What's Now Fixed

? **Brush Size slider** ? Changes circle spawn size  
? **Color palette selection** ? Changes drawing color  
? **Erase mode button** ? Enables/disables erase  
? **Select mode button** ? Enables/disables selection  
? **Lock mode button** ? Enables/disables locking  
? **Recolor mode button** ? Enables/disables recoloring  
? **Magnet mode buttons** ? Enables attract/repel  
? **Flow field mode buttons** ? Enables draw/erase  

## Technical Details

### Why `getColor` is a Dependency

```typescript
const getColor = useCallback(() => {
  const swatch = palette[selectedSwatch];
  const h = swatch.h + Math.random() * 10 - 5;
  return `hsl(${h}, ${swatch.s}%, ${swatch.l}%)`;
}, [palette, selectedSwatch]); // Re-created when palette/swatch changes
```

When `getColor` function reference changes:
1. useCallback creates a new function
2. useEffect sees the new function reference
3. Re-registers with the new closure
4. Pointer handlers get the updated color generator

### Why Refs Are Not Dependencies

Refs like `draggingRef`, `isPaintingRef` etc. are **NOT** in the dependency array because:
- Refs have **stable object identity** (never change)
- Their `.current` values ARE updated directly
- No re-registration needed!

### Why Static Functions Are Not Dependencies

Functions like `getCanvasCoords`, `getTouchDistance` from hooks are **NOT** dependencies because:
- They're wrapped in `useCallback` with their own dependencies
- They return stable references (don't change)
- No need to watch them

## Performance Note

**Q: Won't this cause too many re-registrations?**

A: No, because:
- Only 10-15 values are in the dependency array
- Most don't change frequently (mode buttons change rarely)
- `registerAll()` is very fast (Map operations)
- No actual DOM updates or renders happen
- Registration only happens when USER changes something

Compare to the alternative:
- ? Re-register on EVERY render ? 60 times/second
- ? Re-register on USER INPUT ? Maybe 1-2 times/second

## Testing

1. **Change brush size slider** ? Draw ? Circle size matches slider ?
2. **Select different color swatch** ? Draw ? Color matches selection ?
3. **Enable erase mode** ? Click circles ? They disappear ?
4. **Enable select mode** ? Drag box ? Circles get selected ?
5. **Change palette HSL sliders** ? Draw ? New color used ?

All UI controls should now immediately affect the app behavior!

## Files Modified

1. **src/App.tsx**:
   - Changed `registerAll` useEffect from `[]` to dependency array
   - Added 10 dependencies that affect pointer behavior
   - No other changes needed!

## Alternative Approaches (Not Used)

### ? Re-register on Every Render
```typescript
// BAD: Would run 60 times/second
registerAll({ brushSize, ... });
// No useEffect, just in component body
```

### ? Manual Updates
```typescript
// BAD: Error-prone, easy to forget
useEffect(() => {
  $set('brushSize', brushSize);
}, [brushSize]);
```

### ? Reactive Store
```typescript
// OVERKILL: Would require complete architecture change
const store = useStore();
store.subscribe('brushSize', (val) => { /* ... */ });
```

## Why This Pattern Is Good

? **Declarative**: Dependencies list exactly what matters  
? **Automatic**: No manual updates needed  
? **Safe**: Can't forget to update a value  
? **Fast**: Only re-registers when user changes something  
? **Debuggable**: Can log re-registrations to see what changed  

The variable resolver pattern with selective re-registration gives us the best of both worlds:
- ? Fast lookups during interactions (no prop drilling)
- ?? Automatic updates when state changes (React way)
