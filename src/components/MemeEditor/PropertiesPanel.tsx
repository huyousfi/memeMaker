import React from 'react';
import { 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  AlignCenter, 
  AlignLeft, 
  AlignRight, 
  Bold, 
  Italic, 
  CaseSensitive 
} from 'lucide-react';
import { Layer, TextLayer, StickerLayer } from '../../hooks/useMemeCanvas';
import styles from './MemeEditor.module.css';

interface PropertiesPanelProps {
  selectedLayerId: string | null;
  layers: Layer[];
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
}

const FONTS = [
  { value: 'Impact', label: 'Impact (Meme Classic)' },
  { value: 'Outfit', label: 'Outfit (Modern)' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Comic Neue', label: 'Comic Neue' },
  { value: 'Montserrat', label: 'Montserrat (Bold)' },
  { value: 'Pacifico', label: 'Pacifico (Cursive)' },
];

export default function PropertiesPanel({
  selectedLayerId,
  layers,
  updateLayer,
  deleteLayer,
  bringToFront,
  sendToBack,
}: PropertiesPanelProps) {
  const activeLayer = layers.find((l) => l.id === selectedLayerId);

  if (!activeLayer) {
    return (
      <div className={styles.propertiesPanel}>
        <div className={styles.emptyState}>
          <p>No element selected</p>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Click on any text or sticker layer on the canvas to customize it.
          </span>
        </div>
      </div>
    );
  }

  const isText = activeLayer.type === 'text';
  const textLayer = activeLayer as TextLayer;
  const stickerLayer = activeLayer as StickerLayer;

  return (
    <div className={styles.propertiesPanel}>
      <h3 className={styles.panelTitle}>Layer Settings</h3>

      {/* Layer Arrange actions */}
      <div className={styles.propertySection}>
        <div className={styles.propertySectionTitle}>Arrange Layer</div>
        <div className={styles.layerButtonGroup}>
          <button 
            className={styles.layerBtn}
            onClick={() => bringToFront(activeLayer.id)}
            title="Bring to Front"
          >
            <ChevronUp size={16} /> Front
          </button>
          <button 
            className={styles.layerBtn}
            onClick={() => sendToBack(activeLayer.id)}
            title="Send to Back"
          >
            <ChevronDown size={16} /> Back
          </button>
          <button 
            className={`${styles.layerBtn} ${styles.btnDanger}`}
            onClick={() => deleteLayer(activeLayer.id)}
            title="Delete Layer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Opacity Adjustment */}
      <div className={styles.propertySection}>
        <div className={styles.controlLabel}>
          <span>Opacity</span>
          <span>{Math.round(activeLayer.opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          className={styles.rangeInput}
          value={activeLayer.opacity}
          onChange={(e) => updateLayer(activeLayer.id, { opacity: parseFloat(e.target.value) })}
        />
      </div>

      {/* Text Settings */}
      {isText && (
        <>
          {/* Edit Text */}
          <div className={styles.propertySection}>
            <div className={styles.propertySectionTitle}>Edit Content</div>
            <div className={styles.textInputGroup}>
              <textarea
                value={textLayer.text}
                onChange={(e) => updateLayer(textLayer.id, { text: e.target.value })}
                placeholder="Enter text..."
              />
            </div>
          </div>

          {/* Typography options */}
          <div className={styles.propertySection}>
            <div className={styles.propertySectionTitle}>Typography</div>
            
            {/* Font Family */}
            <div style={{ marginBottom: '12px' }}>
              <select
                style={{ width: '100%' }}
                value={textLayer.fontFamily}
                onChange={(e) => updateLayer(textLayer.id, { fontFamily: e.target.value })}
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font size */}
            <div style={{ marginBottom: '12px' }}>
              <div className={styles.controlLabel}>
                <span>Font Size</span>
                <span>{textLayer.fontSize}cqw</span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                step="0.5"
                className={styles.rangeInput}
                value={textLayer.fontSize}
                onChange={(e) => updateLayer(textLayer.id, { fontSize: parseFloat(e.target.value) })}
              />
            </div>

            {/* Text Alignment & style */}
            <div className={styles.formattingGrid} style={{ marginBottom: '12px' }}>
              <button
                className={`${styles.formatBtn} ${textLayer.textAlign === 'left' ? styles.formatBtnActive : ''}`}
                onClick={() => updateLayer(textLayer.id, { textAlign: 'left' })}
              >
                <AlignLeft size={16} />
              </button>
              <button
                className={`${styles.formatBtn} ${textLayer.textAlign === 'center' ? styles.formatBtnActive : ''}`}
                onClick={() => updateLayer(textLayer.id, { textAlign: 'center' })}
              >
                <AlignCenter size={16} />
              </button>
              <button
                className={`${styles.formatBtn} ${textLayer.textAlign === 'right' ? styles.formatBtnActive : ''}`}
                onClick={() => updateLayer(textLayer.id, { textAlign: 'right' })}
              >
                <AlignRight size={16} />
              </button>
            </div>

            <div className={styles.formattingGrid}>
              <button
                className={`${styles.formatBtn} ${textLayer.fontWeight === 'bold' ? styles.formatBtnActive : ''}`}
                onClick={() => updateLayer(textLayer.id, { fontWeight: textLayer.fontWeight === 'bold' ? 'normal' : 'bold' })}
              >
                <Bold size={16} />
              </button>
              <button
                className={`${styles.formatBtn} ${textLayer.fontStyle === 'italic' ? styles.formatBtnActive : ''}`}
                onClick={() => updateLayer(textLayer.id, { fontStyle: textLayer.fontStyle === 'italic' ? 'normal' : 'italic' })}
              >
                <Italic size={16} />
              </button>
              <button
                className={`${styles.formatBtn} ${textLayer.isUppercase ? styles.formatBtnActive : ''}`}
                onClick={() => updateLayer(textLayer.id, { isUppercase: !textLayer.isUppercase })}
              >
                <CaseSensitive size={16} />
              </button>
            </div>
          </div>

          {/* Color & Outline */}
          <div className={styles.propertySection}>
            <div className={styles.propertySectionTitle}>Colors & Outline</div>
            
            {/* Font Color */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fill Color</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{textLayer.color}</span>
                <input
                  type="color"
                  value={textLayer.color}
                  onChange={(e) => updateLayer(textLayer.id, { color: e.target.value })}
                  style={{ border: 'none', background: 'transparent', width: '32px', height: '32px', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Stroke Color */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Outline Color</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{textLayer.strokeColor}</span>
                <input
                  type="color"
                  value={textLayer.strokeColor}
                  onChange={(e) => updateLayer(textLayer.id, { strokeColor: e.target.value })}
                  style={{ border: 'none', background: 'transparent', width: '32px', height: '32px', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <div className={styles.controlLabel}>
                <span>Outline Width</span>
                <span>{textLayer.strokeWidth}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                className={styles.rangeInput}
                value={textLayer.strokeWidth}
                onChange={(e) => updateLayer(textLayer.id, { strokeWidth: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </>
      )}

      {/* Sticker Settings */}
      {!isText && activeLayer.type === 'sticker' && (
        <div className={styles.propertySection}>
          <div className={styles.propertySectionTitle}>Sticker Properties</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            This sticker is ID: {stickerLayer.stickerId}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '10px' }}>
            Use the canvas bounding box handles to scale and rotate this sticker.
          </span>
        </div>
      )}
    </div>
  );
}
