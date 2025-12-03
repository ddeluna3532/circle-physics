# Tab System Implementation

## Overview
Adding a tabbed interface to organize the overwhelming amount of controls in the left and right panels.

## Left Panel Tabs (4 tabs)
1. **Project** - File operations
   - Canvas settings (aspect ratio)
   - Export (PNG, SVG)
   - Animation (recording, playback, export)
   - Project (save/load)

2. **Colors** - Color management
   - Background palette
   - Circle palette  
   - Palette save/load

3. **Tools** - Drawing & selection
   - Draw controls (circles count, brush size)
   - Auto-spawn buttons
   - Tool modes (erase, lock, recolor, select)
   - Selection actions
   - Undo/Redo
   
4. **Physics** - Simulation
   - Physics toggle, gravity, walls, floor
   - Collision settings
   - Magnet (attract/repel)
   - Forces (clump, spread, sticky)

## Right Panel Tabs (2-3 tabs)
1. **Layers** - Layer management
   - Layer list with controls
   - Add layer buttons

2. **Effects** - Real-time effects
   - Flow field controls
   - Scale All slider
   - Random Scale slider

3. **Paint** (conditional) - Only visible when paint layer active
   - Paint mode toggle
   - Brush settings (wetness, flow, bleed)
   - Clear paint button

## Implementation Details
- State: `leftTab` and `rightTab` (strings)
- UI: `.tab-nav` with `.tab-button` elements
- Content: `.tab-content` with `.tab-pane` divs
- Active tab gets `.active` class
- CSS already has all necessary styles
