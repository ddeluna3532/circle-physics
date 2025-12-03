# UI Refactoring Instructions

## The Task
The `src/App.tsx` file is too large (~2000 lines) to safely edit in one operation. The redesign involves:
1. Adding tab navigation to both panels
2. Removing drawing-related UI (since drawing is disabled)
3. Reorganizing features into logical tabs
4. Optimizing screen real estate

## Recommended Approach

### Option 1: Manual Refactoring (Safest)
Follow these steps to manually refactor the file:

1. **Add Tab State** (around line 73)
   ```typescript
   // Tab state
   const [leftTab, setLeftTab] = useState<'project' | 'colors' | 'tools' | 'physics'>('project');
   const [rightTab, setRightTab] = useState<'layers' | 'animation' | 'effects'>('layers');
   ```

2. **Update Left Panel Structure** (starting around line 1417)
   Replace the `<aside className="panel left-panel">` section with tab navigation:
   ```tsx
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
         {/* Canvas settings, file operations, export, etc. */}
       </div>

       {/* COLORS TAB */}
       <div className={`tab-pane ${leftTab === 'colors' ? 'active' : ''}`}>
         {/* Circle and background palettes */}
       </div>

       {/* TOOLS TAB */}
       <div className={`tab-pane ${leftTab === 'tools' ? 'active' : ''}`}>
         {/* Selection, erase, lock, recolor modes */}
       </div>

       {/* PHYSICS TAB */}
       <div className={`tab-pane ${leftTab === 'physics' ? 'active' : ''}`}>
         {/* Physics controls, gravity, forces, magnet */}
       </div>
     </div>
   </aside>
   ```

3. **Update Right Panel Structure** (starting around line 2050)
   Similar tab navigation for layers, animation, and effects.

### Option 2: Component-Based Refactoring (Best Long-term)
Break the massive App.tsx into smaller components:

```
src/
??? components/
?   ??? panels/
?   ?   ??? LeftPanel.tsx          (with tabs)
?   ?   ??? RightPanel.tsx         (with tabs)
?   ?   ??? tabs/
?   ?   ?   ??? ProjectTab.tsx
?   ?   ?   ??? ColorsTab.tsx
?   ?   ?   ??? ToolsTab.tsx
?   ?   ?   ??? PhysicsTab.tsx
?   ?   ?   ??? LayersTab.tsx
?   ?   ?   ??? AnimationTab.tsx
?   ?   ?   ??? EffectsTab.tsx
?   ??? Canvas.tsx
?   ??? indicators/
?       ??? RecordingIndicator.tsx
?       ??? PlaybackIndicator.tsx
?       ??? ExportIndicator.tsx
??? App.tsx (much smaller, just composition)
```

## Detailed Tab Content

### LEFT PANEL

#### Project Tab
- Aspect Ratio input
- Circles count display
- Save/Load Project buttons
- Export PNG/SVG buttons
- Undo/Redo buttons  
- Save/Load Palettes buttons

#### Colors Tab
```tsx
<h2>Circle Colors</h2>
{/* Swatch row */}
{/* H/S/L sliders */}
{/* Reset button */}

<h2>Background</h2>
{/* Swatch row */}
{/* H/S/L sliders */}
{/* Reset button */}

<h2>Brush Size</h2>
{/* Size slider for spawn tools */}
```

#### Tools Tab
```tsx
<h2>Modes</h2>
{/* Select, Erase, Lock, Recolor buttons */}

<h2>Spawn Tools</h2>
{/* Hold to spawn buttons */}

<h2>Actions</h2>
{/* Clear All */}
{/* Unlock All */}

{selectedIds.size > 0 && (
  <div className="selection-actions">
    {/* Selection-specific actions */}
  </div>
)}
```

#### Physics Tab
```tsx
<h2>Simulation</h2>
{/* Pause/Resume */}
{/* Gravity, Walls, Floor toggles */}

<h2>Collision</h2>
{/* Accuracy and Bounciness sliders */}

<h2>Forces</h2>
{/* Clump/Spread */}
{/* Sticky */}

<h2>Magnet</h2>
{/* Attract/Repel */}
{/* Strength/Radius sliders */}
```

### RIGHT PANEL

#### Layers Tab
- Add Circles/Paint buttons
- Layer list with controls
- Paint layer settings (conditional)

#### Animation Tab  
- Recording controls
- Playback controls
- Export settings
- File operations

#### Effects Tab
- Flow Field controls
- Scale All slider
- Random Scale slider

## Testing Checklist
After refactoring:
- [ ] All tabs switch correctly
- [ ] No functionality is lost
- [ ] Keyboard shortcuts still work
- [ ] Selection actions appear/disappear correctly
- [ ] Paint layer settings only show for paint layers
- [ ] Animation UI only shows when appropriate
- [ ] All tooltips still work
- [ ] Mobile/touch still works

## Notes
- The CSS for tabs has been added to `src/styles.css`
- See `UI_REDESIGN_PLAN.md` for detailed specifications
- Drawing-related controls should be removed (paint mode is now in Layers tab for paint layers only)
- Keep all the existing logic - only the UI layout changes
