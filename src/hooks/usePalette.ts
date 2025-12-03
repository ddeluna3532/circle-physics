import { useState, useCallback } from 'react';

export interface ColorSwatch {
  h: number;
  s: number;
  l: number;
}

const DEFAULT_CIRCLE_PALETTE: ColorSwatch[] = [
  { h: 187, s: 94, l: 18 },  // #034f59 - dark teal
  { h: 156, s: 38, l: 67 },  // #8ccbb2 - sage green
  { h: 41, s: 52, l: 91 },   // #f2ebdc - cream
  { h: 11, s: 100, l: 71 },  // #ff8469 - coral
  { h: 190, s: 8, l: 29 },   // #444e50 - dark gray
];

const DEFAULT_BG_PALETTE: ColorSwatch[] = [
  { h: 0, s: 0, l: 100 },    // #ffffff - white
  { h: 0, s: 0, l: 0 },      // #000000 - black
  { h: 41, s: 45, l: 85 },   // #ebe0c8 - warm cream
  { h: 0, s: 0, l: 25 },     // #404040 - dark gray
  { h: 0, s: 0, l: 75 },     // #bfbfbf - light gray
];

export function usePalette() {
  // Circle palette
  const [palette, setPalette] = useState<ColorSwatch[]>(DEFAULT_CIRCLE_PALETTE);
  const [selectedSwatch, setSelectedSwatch] = useState(0);
  
  // Background palette
  const [bgPalette, setBgPalette] = useState<ColorSwatch[]>(DEFAULT_BG_PALETTE);
  const [selectedBgSwatch, setSelectedBgSwatch] = useState(2); // Default to warm cream
  
  // Which color type is being edited
  const [colorEditMode, setColorEditMode] = useState<'circle' | 'background'>('circle');
  
  // Get current background color as HSL string
  const getBackgroundColor = useCallback(() => {
    const bg = bgPalette[selectedBgSwatch];
    return `hsl(${bg.h}, ${bg.s}%, ${bg.l}%)`;
  }, [bgPalette, selectedBgSwatch]);
  
  // Get current background color as hex for SVG export
  const getBackgroundHex = useCallback(() => {
    const bg = bgPalette[selectedBgSwatch];
    const h = bg.h;
    const s = bg.s / 100;
    const l = bg.l / 100;
    
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    
    const r = Math.round(f(0) * 255);
    const g = Math.round(f(8) * 255);
    const b = Math.round(f(4) * 255);
    
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }, [bgPalette, selectedBgSwatch]);
  
  // Update background palette swatch
  const updateBgPalette = useCallback((key: 'h' | 's' | 'l', value: number) => {
    setBgPalette(prev => {
      const newPalette = [...prev];
      newPalette[selectedBgSwatch] = { ...newPalette[selectedBgSwatch], [key]: value };
      return newPalette;
    });
  }, [selectedBgSwatch]);

  // Update circle palette swatch
  const updateSwatch = useCallback((key: 'h' | 's' | 'l', value: number) => {
    setPalette(prev => {
      const newPalette = [...prev];
      newPalette[selectedSwatch] = { ...newPalette[selectedSwatch], [key]: value };
      return newPalette;
    });
  }, [selectedSwatch]);
  
  // Update color based on current edit mode
  const updateActiveColor = useCallback((key: 'h' | 's' | 'l', value: number) => {
    if (colorEditMode === 'circle') {
      updateSwatch(key, value);
    } else {
      updateBgPalette(key, value);
    }
  }, [colorEditMode, updateSwatch, updateBgPalette]);
  
  // Get the currently active color
  const activeColor = colorEditMode === 'circle' 
    ? palette[selectedSwatch] 
    : bgPalette[selectedBgSwatch];

  // Generate color from selected swatch with slight variation
  const getColor = useCallback(() => {
    const swatch = palette[selectedSwatch];
    const h = swatch.h + Math.random() * 10 - 5;
    return `hsl(${h}, ${swatch.s}%, ${swatch.l}%)`;
  }, [palette, selectedSwatch]);
  
  // Get random color from any swatch in the palette
  const getRandomPaletteColor = useCallback(() => {
    const swatch = palette[Math.floor(Math.random() * palette.length)];
    const h = swatch.h + Math.random() * 10 - 5;
    return `hsl(${h}, ${swatch.s}%, ${swatch.l}%)`;
  }, [palette]);

  // Reset palettes to defaults
  const resetCirclePalette = useCallback(() => {
    setPalette(DEFAULT_CIRCLE_PALETTE);
    setSelectedSwatch(0);
  }, []);

  const resetBgPalette = useCallback(() => {
    setBgPalette(DEFAULT_BG_PALETTE);
    setSelectedBgSwatch(2);
  }, []);

  // Save palettes to file
  const savePalettes = useCallback(() => {
    const data = {
      version: 1,
      circlePalette: palette,
      bgPalette: bgPalette,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const name = prompt('Palette name:', 'my-palette') || 'my-palette';
    link.href = url;
    link.download = `${name}.palette.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [palette, bgPalette]);

  // Load palettes from file
  const loadPalettes = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.circlePalette && Array.isArray(data.circlePalette)) {
            setPalette(data.circlePalette);
            setSelectedSwatch(0);
          }
          if (data.bgPalette && Array.isArray(data.bgPalette)) {
            setBgPalette(data.bgPalette);
            setSelectedBgSwatch(0);
          }
          console.log('Palettes loaded');
        } catch (err) {
          console.error('Failed to parse palette file:', err);
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }, []);
  
  return {
    // Circle palette
    palette,
    setPalette,
    selectedSwatch,
    setSelectedSwatch,
    updateSwatch,
    resetCirclePalette,
    
    // Background palette
    bgPalette,
    setBgPalette,
    selectedBgSwatch,
    setSelectedBgSwatch,
    updateBgPalette,
    resetBgPalette,
    
    // Shared
    colorEditMode,
    setColorEditMode,
    activeColor,
    updateActiveColor,
    
    // Utilities
    getColor,
    getRandomPaletteColor,
    getBackgroundColor,
    getBackgroundHex,
    
    // File operations
    savePalettes,
    loadPalettes,
  };
}
