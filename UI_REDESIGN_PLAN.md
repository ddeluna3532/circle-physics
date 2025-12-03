# UI Redesign Plan - Tab-Based Interface

## Overview
Redesign the Circle Physics UI to use tabs for better screen real estate management, removing drawing-related controls since drawing is disabled.

## Left Panel Organization

### Tab Structure
```
[Project] [Colors] [Tools] [Physics]
```

#### **Project Tab**
- Canvas Settings
  - Aspect Ratio input
  - Circles count display
- File Operations
  - Save/Load Project
  - Export (PNG, SVG)
  - Save/Load Palettes
- Undo/Redo buttons

#### **Colors Tab**
- Circle Colors Section
  - 5-swatch palette
  - H/S/L sliders for selected swatch
  - Reset button
- Background Colors Section  
  - 5-swatch palette
  - H/S/L sliders for selected swatch
  - Reset button
- Brush Size slider (for spawn tools)

#### **Tools Tab**
- Mode Buttons (mutually exclusive)
  - Select Mode
  - Erase Mode
  - Lock/Unlock Mode
  - Recolor Mode
- Auto-Spawn Tools
  - Hold to Spawn (Brush Size)
  - Hold to Spawn (Random Size)
- Selection Actions (when items selected)
  - Recolor Selection
  - Delete Selection
  - Invert Selection
  - Lock Inverse
  - Unlock All
- Clear All button

#### **Physics Tab**
- Simulation Control
  - Pause/Resume button
  - Gravity toggle
  - Walls toggle
  - Floor toggle
- Collision Settings
  - Accuracy slider (1-8)
  - Bounciness slider (0-1)
- Forces
  - Clump/Spread toggle buttons
  - Force Strength slider
  - Sticky toggle
  - Sticky Strength slider
- Magnet Tool
  - Attract/Repel buttons
  - Strength slider
  - Radius slider

## Right Panel Organization

### Tab Structure
```
[Layers] [Animation] [Effects]
```

#### **Layers Tab**
- Layer Management
  - Add Circles/Paint buttons
  - Layer list with controls
    - Visibility toggle
    - Lock toggle
    - Move up/down
    - Delete
    - Opacity slider
- Paint Layer Settings (when paint layer active)
  - Paint Mode toggle
  - Wetness slider
  - Flow slider
  - Bleed slider
  - Clear Paint button

#### **Animation Tab**
- Recording Controls
  - Record/Stop button
  - Duration/Frames display
- Playback Controls (when animation exists)
  - Play/Stop button
  - Duration display
  - Smoothing slider + Apply button
- Export Settings
  - Resolution selector (1x, 2x, 4x)
  - Camera controls
    - Zoom slider
    - Pan X/Y sliders
    - Preview toggle
    - Reset button
  - Export PNG Sequence button
  - Progress indicator
- File Operations
  - Save Animation
  - Load Animation
  - Clear Animation

#### **Effects Tab**
- Flow Field
  - Draw/Erase mode buttons
  - Visible toggle
  - Clear All button
  - Strength slider
  - Radius slider
- Scale Effects
  - Scale All slider (spring-mounted, -100 to +100)
  - Random Scale slider (spring-mounted, -100 to +100)

## Removed Elements
- All drawing mode controls (since drawing is disabled)
- "Draw" section header
- Paint mode toggle from main tools (moved to paint layer settings)
- Redundant controls that appear in multiple places

## CSS Changes Needed

### Add tab navigation styles
```css
.tab-nav {
  display: flex;
  gap: 2px;
  padding: 8px 8px 0 8px;
  background: var(--panel-bg);
  border-bottom: 1px solid var(--panel-border);
}

.tab-button {
  flex: 1;
  padding: 6px 8px;
  background: var(--btn-inactive);
  border: 1px solid var(--btn-border);
  border-bottom: none;
  color: var(--text-muted);
  font-size: 10px;
  cursor: pointer;
  border-radius: 2px 2px 0 0;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.tab-button:hover {
  background: #202020;
  color: var(--text-color);
}

.tab-button.active {
  background: var(--panel-bg);
  border-color: var(--accent);
  border-bottom-color: var(--panel-bg);
  color: var(--text-active);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
}

.tab-pane {
  display: none;
}

.tab-pane.active {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

## State Management

### New state variables needed
```typescript
const [leftTab, setLeftTab] = useState<'project' | 'colors' | 'tools' | 'physics'>('project');
const [rightTab, setRightTab] = useState<'layers' | 'animation' | 'effects'>('layers');
```

## Benefits
1. **Better Organization**: Related features grouped logically
2. **More Screen Space**: Can fit more controls in same space
3. **Cleaner Interface**: No clutter from disabled drawing features
4. **Scalability**: Easy to add new features in appropriate tabs
5. **User Experience**: Clearer workflow and feature discovery

## Implementation Priority
1. Add tab state and CSS
2. Restructure left panel with tabs
3. Restructure right panel with tabs
4. Test all functionality
5. Remove obsolete code
6. Update documentation
