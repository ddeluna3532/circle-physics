import { ColorSwatch } from '../../hooks/usePalette';

interface ColorsPanelProps {
  // Circle palette
  palette: ColorSwatch[];
  selectedSwatch: number;
  setSelectedSwatch: (index: number) => void;
  updateSwatch: (key: 'h' | 's' | 'l', value: number) => void;
  resetCirclePalette: () => void;
  
  // Background palette
  bgPalette: ColorSwatch[];
  selectedBgSwatch: number;
  setSelectedBgSwatch: (index: number) => void;
  updateBgPalette: (key: 'h' | 's' | 'l', value: number) => void;
  resetBgPalette: () => void;
  
  // Shared
  colorEditMode: 'circle' | 'background';
  setColorEditMode: (mode: 'circle' | 'background') => void;
  activeColor: ColorSwatch;
  updateActiveColor: (key: 'h' | 's' | 'l', value: number) => void;
  
  // File operations
  savePalettes: () => void;
  loadPalettes: () => void;
}

export function ColorsPanel({
  palette,
  selectedSwatch,
  setSelectedSwatch,
  resetCirclePalette,
  bgPalette,
  selectedBgSwatch,
  setSelectedBgSwatch,
  resetBgPalette,
  colorEditMode,
  setColorEditMode,
  activeColor,
  updateActiveColor,
  savePalettes,
  loadPalettes,
}: ColorsPanelProps) {
  return (
    <>
      <div className="section-header">Circle Colors</div>
      
      <div className="control-group">
        <span className="swatch-section-label">Palette</span>
        <div className="swatch-row">
          {palette.map((color, i) => (
            <div
              key={i}
              className={`swatch ${colorEditMode === 'circle' && selectedSwatch === i ? 'selected' : ''}`}
              style={{ background: `hsl(${color.h}, ${color.s}%, ${color.l}%)` }}
              onClick={() => { 
                setSelectedSwatch(i); 
                setColorEditMode('circle'); 
              }}
            />
          ))}
        </div>
      </div>

      <div className="section-header">Background Colors</div>
      
      <div className="control-group">
        <span className="swatch-section-label">Palette</span>
        <div className="swatch-row">
          {bgPalette.map((color, i) => (
            <div
              key={i}
              className={`swatch ${colorEditMode === 'background' && selectedBgSwatch === i ? 'selected' : ''}`}
              style={{ background: `hsl(${color.h}, ${color.s}%, ${color.l}%)` }}
              onClick={() => { 
                setSelectedBgSwatch(i); 
                setColorEditMode('background'); 
              }}
            />
          ))}
        </div>
      </div>

      <div className="section-header">Color Editor</div>
      
      <div className="control-group">
        <label>H: {activeColor.h}</label>
        <input
          type="range"
          className="hue-slider"
          min="0"
          max="360"
          value={activeColor.h}
          onChange={(e) => updateActiveColor('h', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label>S: {activeColor.s}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={activeColor.s}
          onChange={(e) => updateActiveColor('s', Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, hsl(${activeColor.h}, 0%, ${activeColor.l}%), hsl(${activeColor.h}, 100%, ${activeColor.l}%))`
          }}
        />
      </div>

      <div className="control-group">
        <label>L: {activeColor.l}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={activeColor.l}
          onChange={(e) => updateActiveColor('l', Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, hsl(${activeColor.h}, ${activeColor.s}%, 0%), hsl(${activeColor.h}, ${activeColor.s}%, 50%), hsl(${activeColor.h}, ${activeColor.s}%, 100%))`
          }}
        />
      </div>

      <div className="section-divider"></div>

      <div className="control-group button-row">
        <button onClick={resetCirclePalette} title="Reset circle colors">
          Reset C
        </button>
        <button onClick={resetBgPalette} title="Reset backgrounds">
          Reset BG
        </button>
      </div>

      <div className="control-group button-row">
        <button onClick={savePalettes} title="Save palettes">
          Save
        </button>
        <button onClick={loadPalettes} title="Load palettes">
          Load
        </button>
      </div>
    </>
  );
}
