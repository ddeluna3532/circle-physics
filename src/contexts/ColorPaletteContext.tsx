/**
 * Color Palette Context
 * Manages circle and background color palettes
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

interface ColorPaletteContextValue {
  // Circle palette
  palette: HSLColor[];
  setPalette: React.Dispatch<React.SetStateAction<HSLColor[]>>;
  selectedSwatch: number;
  setSelectedSwatch: (index: number) => void;
  getSelectedColor: () => HSLColor;
  getSelectedColorString: () => string;

  // Background palette
  bgPalette: HSLColor[];
  setBgPalette: React.Dispatch<React.SetStateAction<HSLColor[]>>;
  selectedBgSwatch: number;
  setSelectedBgSwatch: (index: number) => void;
  getBackgroundColor: () => string;
  getBackgroundHex: () => string;
}

const ColorPaletteContext = createContext<ColorPaletteContextValue | null>(null);

// Default palettes
const DEFAULT_CIRCLE_PALETTE: HSLColor[] = [
  { h: 187, s: 94, l: 18 },  // #034f59 - dark teal
  { h: 156, s: 38, l: 67 },  // #8ccbb2 - sage green
  { h: 41, s: 52, l: 91 },   // #f2ebdc - cream
  { h: 11, s: 100, l: 71 },  // #ff8469 - coral
  { h: 190, s: 8, l: 29 },   // #444e50 - dark gray
];

const DEFAULT_BG_PALETTE: HSLColor[] = [
  { h: 0, s: 0, l: 100 },    // #ffffff - white
  { h: 0, s: 0, l: 0 },      // #000000 - black
  { h: 41, s: 45, l: 85 },   // #ebe0c8 - warm cream
  { h: 0, s: 0, l: 25 },     // #404040 - dark gray
  { h: 0, s: 0, l: 75 },     // #bfbfbf - light gray
];

export function ColorPaletteProvider({ children }: { children: React.ReactNode }) {
  // Circle palette state
  const [palette, setPalette] = useState<HSLColor[]>(DEFAULT_CIRCLE_PALETTE);
  const [selectedSwatch, setSelectedSwatch] = useState(0);

  // Background palette state
  const [bgPalette, setBgPalette] = useState<HSLColor[]>(DEFAULT_BG_PALETTE);
  const [selectedBgSwatch, setSelectedBgSwatch] = useState(2); // Default to warm cream

  // Get selected circle color
  const getSelectedColor = useCallback(() => {
    return palette[selectedSwatch];
  }, [palette, selectedSwatch]);

  const getSelectedColorString = useCallback(() => {
    const color = palette[selectedSwatch];
    return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
  }, [palette, selectedSwatch]);

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

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }, [bgPalette, selectedBgSwatch]);

  const value: ColorPaletteContextValue = {
    palette,
    setPalette,
    selectedSwatch,
    setSelectedSwatch,
    getSelectedColor,
    getSelectedColorString,
    bgPalette,
    setBgPalette,
    selectedBgSwatch,
    setSelectedBgSwatch,
    getBackgroundColor,
    getBackgroundHex,
  };

  return <ColorPaletteContext.Provider value={value}>{children}</ColorPaletteContext.Provider>;
}

export function useColorPalette() {
  const context = useContext(ColorPaletteContext);
  if (!context) {
    throw new Error('useColorPalette must be used within ColorPaletteProvider');
  }
  return context;
}
