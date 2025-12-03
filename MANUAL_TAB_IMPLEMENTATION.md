# Manual Tab Implementation Guide

## Step-by-Step Instructions

Follow these steps carefully to add tabs to your App.tsx without breaking anything.

---

## Step 1: Add Tab State (Line ~58)

**Location:** After the `useLayers()` hook call, before the UI state declarations.

**Find this section:**
```typescript
  } = useLayers();

  // UI state
  const [brushSize, setBrushSize] = useState(30);
```

**Add these two lines BETWEEN them:**
```typescript
  } = useLayers();

  // Tab state
  const [leftTab, setLeftTab] = useState<'project' | 'colors' | 'tools' | 'physics'>('project');
  const [rightTab, setRightTab] = useState<'layers' | 'effects'>('layers');

  // UI state
  const [brushSize, setBrushSize] = useState(30);
```

? **Verify:** File should still compile. Run `npm run build` to check.

---

## Step 2: Add Left Panel Tab Navigation (Line ~1045)

**Location:** Find the opening of the left panel: `<aside className="panel left-panel">`

**Replace:**
```typescript
      <aside className="panel left-panel">
        <h2>Canvas</h2>
```

**With:**
```typescript
      <aside className="panel left-panel">
        {/* Tab Navigation */}
        <div className="tab-nav">
          <button 
            className={`tab-button ${leftTab === 'project' ? 'active' : ''}`}
            onClick={() => setLeftTab('project')}
          >
            Project
          </button>
          <button 
            className={`tab-button ${leftTab === 'colors' ? 'active' : ''}`}
            onClick={() => setLeftTab('colors')}
          >
            Colors
          </button>
          <button 
            className={`tab-button ${leftTab === 'tools' ? 'active' : ''}`}
            onClick={() => setLeftTab('tools')}
          >
            Tools
          </button>
          <button 
            className={`tab-button ${leftTab === 'physics' ? 'active' : ''}`}
            onClick={() => setLeftTab('physics')}
          >
            Physics
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* PROJECT TAB */}
          <div className={`tab-pane ${leftTab === 'project' ? 'active' : ''}`}>
            <h2>Canvas</h2>
```

---

## Step 3: Wrap Left Panel Sections in Tab Panes

### Project Tab (Already started above)

**Sections to include:**
- Canvas (h2) - aspect ratio input
- Export (h2) - PNG, SVG buttons
- Animation (h2) - all animation controls
- Project (h2) - save/load buttons

**Find the END of Project section** (after Load button, before `<h2>Draw</h2>`):

**Add closing div and start Colors tab:**
```typescript
          </div>

          {/* COLORS TAB */}
          <div className={`tab-pane ${leftTab === 'colors' ? 'active' : ''}`}>
```

### Colors Tab

**Sections to include:**
- Background (h2) - background palette + HSL sliders
- Color (h2) - circle palette + HSL sliders  
- Palette save/load buttons

**Find the END of Colors section** (after Load Palettes button, before `<h2>Tools</h2>` or `<h2>Draw</h2>`):

**Add closing div and start Tools tab:**
```typescript
          </div>

          {/* TOOLS TAB */}
          <div className={`tab-pane ${leftTab === 'tools' ? 'active' : ''}`}>
```

### Tools Tab

**Sections to include:**
- Draw (h2) - circles count, brush size
- Hold to spawn buttons
- Tools (h2) - Clear All, Undo, Redo
- Erase button
- Lock/Unlock buttons
- Recolor button
- Select button
- Selection actions (conditional, when selectedIds.size > 0)

**Find the END of Tools section** (after Lock Inverse/Unlock All buttons, before `<h2>Magnet</h2>`):

**Add closing div and start Physics tab:**
```typescript
          </div>

          {/* PHYSICS TAB */}
          <div className={`tab-pane ${leftTab === 'physics' ? 'active' : ''}`}>
```

### Physics Tab

**Sections to include:**
- Magnet (h2) - attract/repel buttons, strength, radius
- Physics (h2) - pause, gravity, walls, floor, collision, bounciness
- Forces (h2) - clump, spread, sticky

**Find the END of Physics section** (after Sticky Strength slider, before `</aside>`):

**Add closing divs:**
```typescript
          </div>
        </div>
      </aside>
```

---

## Step 4: Add Right Panel Tab Navigation (Line ~1530)

**Location:** Find the opening of the right panel: `<aside className="panel right-panel">`

**Replace:**
```typescript
      <aside className="panel right-panel">
        <h2>Flow Field</h2>
```

**With:**
```typescript
      <aside className="panel right-panel">
        {/* Tab Navigation */}
        <div className="tab-nav">
          <button 
            className={`tab-button ${rightTab === 'layers' ? 'active' : ''}`}
            onClick={() => setRightTab('layers')}
          >
            Layers
          </button>
          <button 
            className={`tab-button ${rightTab === 'effects' ? 'active' : ''}`}
            onClick={() => setRightTab('effects')}
          >
            Effects
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* EFFECTS TAB */}
          <div className={`tab-pane ${rightTab === 'effects' ? 'active' : ''}`}>
            <h2>Flow Field</h2>
```

---

## Step 5: Wrap Right Panel Sections in Tab Panes

### Effects Tab (Already started above)

**Sections to include:**
- Flow Field (h2)
- Scale All (h2)
- Random Scale (h2)

**Find the END of Random Scale section** (after the spring-slider, before `<h2>Layers</h2>`):

**Add closing div and start Layers tab:**
```typescript
          </div>

          {/* LAYERS TAB */}
          <div className={`tab-pane ${rightTab === 'layers' ? 'active' : ''}`}>
```

### Layers Tab

**Sections to include:**
- Layers (h2) - add buttons, layer list
- Paint Settings (h3) - conditional, only when paint layer active

**Find the END of Layers section** (after the last `</>` closing paint settings, before `</aside>`):

**Add closing divs:**
```typescript
          </div>
        </div>
      </aside>
```

---

## Step 6: Verify and Test

1. **Save App.tsx**
2. **Run build:**
   ```powershell
   npm run build
   ```

3. **If successful, start dev server:**
   ```powershell
   npm run dev
   ```

4. **Test in browser:**
   - Should see 4 tabs in left panel: Project, Colors, Tools, Physics
   - Should see 2 tabs in right panel: Layers, Effects
   - Clicking tabs should switch content
   - All functionality should work exactly as before

---

## Common Issues

### Issue: Missing closing tags
**Solution:** Count your opening and closing divs. Each section needs:
- 1 opening `<div className="tab-pane ...">` 
- 1 closing `</div>`

### Issue: Content not showing
**Solution:** Check the `active` class logic:
```typescript
className={`tab-pane ${leftTab === 'project' ? 'active' : ''}`}
```

### Issue: Tabs not clickable
**Solution:** Verify tab navigation is OUTSIDE tab-content:
```typescript
<div className="tab-nav">...</div>  {/* Tabs */}
<div className="tab-content">       {/* Content */}
  <div className="tab-pane">...</div>
</div>
```

---

## Rollback Plan

If something breaks:

```powershell
git checkout src/App.tsx
```

This restores the working version without tabs.

---

## Visual Verification

After implementation, your panel structure should look like:

```
LEFT PANEL
??? Tab Navigation [Project] [Colors] [Tools] [Physics]
??? Tab Content
    ??? Project Pane (visible)
    ??? Colors Pane (hidden)
    ??? Tools Pane (hidden)
    ??? Physics Pane (hidden)

RIGHT PANEL  
??? Tab Navigation [Layers] [Effects]
??? Tab Content
    ??? Effects Pane (hidden)
    ??? Layers Pane (visible)
```

---

## Final Notes

- **Don't rush** - This is ~50 lines of changes spread across ~500 lines of code
- **Test frequently** - Run `npm run build` after each major section
- **Use Find (Ctrl+F)** - Search for exact h2 text to locate sections
- **Keep backups** - Git is your friend: `git status`, `git diff src/App.tsx`

Good luck! The result will be a much cleaner, more organized UI! ??
