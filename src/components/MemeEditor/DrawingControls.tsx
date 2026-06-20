import React from 'react';
import { Palette, Trash2, Edit3 } from 'lucide-react';
import styles from './MemeEditor.module.css';

interface DrawingControlsProps {
  isDrawingMode: boolean;
  brushColor: string;
  brushWidth: number;
  setIsDrawingMode: (active: boolean) => void;
  setBrushColor: (color: string) => void;
  setBrushWidth: (width: number) => void;
  clearDrawing: () => void;
}

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#000000', // Black
];

export default function DrawingControls({
  isDrawingMode,
  brushColor,
  brushWidth,
  setIsDrawingMode,
  setBrushColor,
  setBrushWidth,
  clearDrawing,
}: DrawingControlsProps) {
  return (
    <>
      <h3 className={styles.panelTitle}>Brush / Doodle Tool</h3>

      {/* Mode Toggle */}
      <div className={styles.controlGroup}>
        <button
          className={`${styles.btn} ${isDrawingMode ? styles.btnPrimary : ''}`}
          style={{ width: '100%', padding: '12px' }}
          onClick={() => setIsDrawingMode(!isDrawingMode)}
        >
          <Edit3 size={18} />
          {isDrawingMode ? 'Disable Brush Mode' : 'Enable Brush Mode'}
        </button>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>
          {isDrawingMode 
            ? 'Click and drag on the canvas to draw freehand!' 
            : 'Enable brush mode to draw on your meme.'}
        </span>
      </div>

      {isDrawingMode && (
        <>
          {/* Brush Size */}
          <div className={styles.propertySection}>
            <div className={styles.controlLabel}>
              <span>Brush Thickness</span>
              <span>{brushWidth}px</span>
            </div>
            <input
              type="range"
              min="2"
              max="40"
              step="1"
              className={styles.rangeInput}
              value={brushWidth}
              onChange={(e) => setBrushWidth(parseInt(e.target.value))}
            />
          </div>

          {/* Brush Color Swatches */}
          <div className={styles.propertySection}>
            <div className={styles.propertySectionTitle}>Brush Color</div>
            <div className={styles.brushColors} style={{ marginBottom: '12px' }}>
              {PRESET_COLORS.map((color) => (
                <div
                  key={color}
                  className={`${styles.colorSwatch} ${brushColor === color ? styles.activeColorSwatch : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setBrushColor(color)}
                />
              ))}
            </div>

            {/* Custom Color Picker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Custom Color</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{brushColor}</span>
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  style={{ border: 'none', background: 'transparent', width: '32px', height: '32px', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Clear Actions */}
          <div className={styles.propertySection}>
            <button
              className={`${styles.btn} ${styles.btnDanger}`}
              style={{ width: '100%' }}
              onClick={clearDrawing}
            >
              <Trash2 size={16} /> Clear Drawing
            </button>
          </div>
        </>
      )}
    </>
  );
}
