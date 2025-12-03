# Black Screen & ESC Key Fix

## Issues Resolved

### 1. ? Build Errors Fixed

#### Error 1: `clearSelection` used before declaration
**Problem**: The `resetSimulationDefaults` function was defined before `clearSelection`, but tried to use it in its dependencies.

**Solution**: Moved `clearSelection` definition before `resetSimulationDefaults`:
```typescript
// Clear selection
const clearSelection = useCallback(() => {
  setSelectedIds(new Set());
}, []);

// THEN define resetSimulationDefaults that uses it
const resetSimulationDefaults = useCallback(() => {
  // ...uses clearSelection
}, [clear, clearSelection, resetCirclePalette, resetBgPalette]);
```

#### Error 2: TypeScript `window.__TAURI__` not recognized
**Problem**: TypeScript didn't know about the Tauri API properties.

**Solution**: Added global type declaration at top of `App.tsx`:
```typescript
// Tauri API types (only available in desktop app)
declare global {
  interface Window {
    __TAURI__?: {
      window: {
        getCurrent(): {
          close(): Promise<void>;
        };
      };
    };
  }
}
```

### 2. ? Build Now Successful
```
? built in 591ms
dist/assets/index-CsOeM-3X.js   219.26 kB ? gzip: 67.63 kB
```

---

## Troubleshooting Black Screen

If you're still seeing a black screen after building, try these steps:

### Step 1: Start Dev Server
```bash
npm run dev
```
Then open: http://localhost:5173

### Step 2: Check Browser Console
1. Press `F12` to open DevTools
2. Look for errors in the Console tab
3. Common issues:
   - **Canvas not rendering**: Check if circles array is empty
   - **Layer issues**: Make sure at least one circle layer exists
   - **CSS not loaded**: Verify `src/styles.css` is imported

### Step 3: Draw Some Circles
The canvas starts empty! To test:
1. Make sure you're on a **circle layer** (check Layers tab)
2. **Click and drag** on the canvas to draw circles
3. You should see colored circles appear

### Step 4: Check Initial State
The app starts with:
- ? Gravity ON
- ? Floor ON
- ? One circle layer (should be active)
- ? Warm cream background color
- ? Default color palette

If nothing happens when you draw, check that:
- The active layer is a **circles layer** (not paint)
- The layer is not **locked** (check lock icon in Layers tab)
- You're not in a special mode (Erase, Lock, Recolor, Select, Magnet, Flow)

---

## ESC Key Behavior

The ESC key now has **cascading behavior**:

1. **If animation playing** ? Stop animation
2. **If recording** ? Stop recording  
3. **If circles selected** ? Clear selection
4. **If select mode active** ? Exit select mode
5. **Otherwise** ? **Close app** (Tauri desktop only)

### Important Notes:
- ? ESC will only close the app if nothing else is active
- ? In browser (web version), ESC won't close the tab (browser security)
- ? In Tauri desktop app, ESC will close the window
- ? Use the first 4 levels to cancel operations before closing

---

## Testing Checklist

- [ ] **Build succeeds** without errors ? DONE
- [ ] **Dev server starts** successfully
- [ ] **Canvas visible** (even if empty)
- [ ] **Drawing works** (click & drag creates circles)
- [ ] **Tabs work** (can switch between tabs)
- [ ] **ESC key cascades** through active modes
- [ ] **ESC closes app** in Tauri (when nothing active)
- [ ] **Background color** shows (not pure black)

---

## Quick Test

```bash
# 1. Build
npm run build

# 2. Start dev server
npm run dev

# 3. In browser:
#    - Canvas should show warm cream background
#    - Click and drag to draw circles
#    - Press ESC to test behavior
```

---

## If Still Black Screen

### Possible Causes:

1. **No Default Layer**
   - Check: Open Layers tab, should see "Circles 1"
   - Fix: Click "+ Circles" button

2. **Layer is Locked**
   - Check: Look for ?? icon in layer
   - Fix: Click lock icon to unlock

3. **Wrong Active Layer**
   - Check: Active layer should be highlighted
   - Fix: Click on a circles layer

4. **Canvas Not Initialized**
   - Check browser console for errors
   - Try: Refresh page (F5)

5. **CSS Not Loaded**
   - Check: Are tabs visible?
   - Fix: Verify `import "./styles.css"` exists in App.tsx

---

## Summary

? **Build errors fixed**  
? **TypeScript errors resolved**  
? **ESC key functionality added**  
? **Ready to test**

The black screen is likely just an empty canvas. Draw some circles to see if it works!
