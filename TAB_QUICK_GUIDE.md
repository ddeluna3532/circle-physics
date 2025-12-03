# Quick Tab Addition Guide

## Summary
Your App.tsx is missing tabs. The CSS is ready but the JSX needs tabs added.

## Changes Needed

### 1. Add Tab State (after line 56 - after useLayers hook)
```typescript
// Tab state  
const [leftTab, setLeftTab] = useState<'project' | 'colors' | 'tools' | 'physics'>('project');
const [rightTab, setRightTab] = useState<'layers' | 'effects'>('layers');
```

### 2. Left Panel Structure
Replace entire left panel `<aside>` starting around line 1045 with:

```tsx
<aside className="panel left-panel">
  {/* Tab Navigation */}
  <div className="tab-nav">
    <button className={`tab-button ${leftTab === 'project' ? 'active' : ''}`} onClick={() => setLeftTab('project')}>Project</button>
    <button className={`tab-button ${leftTab === 'colors' ? 'active' : ''}`} onClick={() => setLeftTab('colors')}>Colors</button>
    <button className={`tab-button ${leftTab === 'tools' ? 'active' : ''}`} onClick={() => setLeftTab('tools')}>Tools</button>
    <button className={`tab-button ${leftTab === 'physics' ? 'active' : ''}`} onClick={() => setLeftTab('physics')}>Physics</button>
  </div>

  <div className="tab-content">
    {/* PROJECT TAB - move Canvas, Export, Animation, Project sections here */}
    <div className={`tab-pane ${leftTab === 'project' ? 'active' : ''}`}>
      {/* Canvas, Export, Animation, Project H2 sections go here */}
    </div>

    {/* COLORS TAB - move Background, Color, palette sections here */}
    <div className={`tab-pane ${leftTab === 'colors' ? 'active' : ''}`}>
      {/* Background, Color H2 sections go here */}
    </div>

    {/* TOOLS TAB - move Draw, Tools sections here */}
    <div className={`tab-pane ${leftTab === 'tools' ? 'active' : ''}`}>
      {/* Draw, Tools H2 sections go here */}
    </div>

    {/* PHYSICS TAB - move Magnet, Physics, Forces sections here */}
    <div className={`tab-pane ${leftTab === 'physics' ? 'active' : ''}`}>
      {/* Magnet, Physics, Forces H2 sections go here */}
    </div>
  </div>
</aside>
```

### 3. Right Panel Structure
Replace entire right panel `<aside>` starting around line 1530 with:

```tsx
<aside className="panel right-panel">
  {/* Tab Navigation */}
  <div className="tab-nav">
    <button className={`tab-button ${rightTab === 'layers' ? 'active' : ''}`} onClick={() => setRightTab('layers')}>Layers</button>
    <button className={`tab-button ${rightTab === 'effects' ? 'active' : ''}`} onClick={() => setRightTab('effects')}>Effects</button>
  </div>

  <div className="tab-content">
    {/* LAYERS TAB */}
    <div className={`tab-pane ${rightTab === 'layers' ? 'active' : ''}`}>
      {/* Layers H2 section, layer list, paint settings go here */}
    </div>

    {/* EFFECTS TAB */}
    <div className={`tab-pane ${rightTab === 'effects' ? 'active' : ''}`}>
      {/* Flow Field, Scale All, Random Scale H2 sections go here */}
    </div>
  </div>
</aside>
```

## Content Organization

### Left Panel
**Project Tab:**
- Canvas (aspect ratio)
- Export (PNG, SVG)
- Animation (all animation controls)
- Project (save/load)

**Colors Tab:**
- Background (palette + HSL sliders)
- Color (circle palette + HSL sliders)
- Palette save/load buttons

**Tools Tab:**
- Draw (circles count, brush size)
- Hold to spawn buttons
- Tool toggles (Erase, Lock, Recolor, Select)
- Selection actions (when selection active)
- Clear All, Undo, Redo buttons

**Physics Tab:**
- Magnet (attract/repel + strength/radius)
- Physics (pause, gravity, walls, floor, collision, bounciness)
- Forces (clump, spread, sticky)

### Right Panel
**Layers Tab:**
- Layer management (add buttons, layer list)
- Paint Settings (conditional, when paint layer active)

**Effects Tab:**
- Flow Field
- Scale All slider
- Random Scale slider

This keeps all existing functionality but organizes it into logical tabs!
