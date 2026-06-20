'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Upload,
  Type,
  Smile,
  Edit3,
  FolderHeart,
  RotateCcw,
  Download,
  Save,
  Undo2,
  Redo2,
  Flame,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useMemeCanvas, MemeTemplate } from '../../hooks/useMemeCanvas';
import { renderMemeToCanvas } from '../../utils/canvasHelper';

// Subcomponents
import TemplateSelector from './TemplateSelector';
import CanvasWorkspace from './CanvasWorkspace';
import PropertiesPanel from './PropertiesPanel';
import StickerSelector from './StickerSelector';
import DrawingControls from './DrawingControls';
import GalleryPanel from './GalleryPanel';

import styles from './MemeEditor.module.css';

type TabType = 'templates' | 'upload' | 'text' | 'stickers' | 'draw' | 'gallery';

export default function MemeEditor() {
  const {
    template,
    customImage,
    layers,
    selectedLayerId,
    isDrawingMode,
    brushColor,
    brushWidth,
    hasUndo,
    hasRedo,
    setSelectedLayerId,
    setIsDrawingMode,
    setBrushColor,
    setBrushWidth,
    undo,
    redo,
    addTextLayer,
    addStickerLayer,
    updateLayer,
    deleteLayer,
    bringToFront,
    sendToBack,
    selectTemplate,
    selectCustomImage,
    startDrawingPath,
    addDrawingPoint,
    finishDrawingPath,
    clearDrawing,
    resetAll,
  } = useMemeCanvas();

  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [exporting, setExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const baseImageSrc = customImage || (template ? template.url : null);

  // Auto-load a popular template on first load so the editor is instantly interactive
  useEffect(() => {
    async function loadInitialTemplate() {
      try {
        const res = await fetch('https://api.imgflip.com/get_memes');
        const data = await res.json();
        if (data.success && data.data.memes.length > 0) {
          // Find a classic template (e.g. Drake Hotline Bling - ID 181913649, or Distracted Boyfriend - ID 112126428, or just the first one)
          const first = data.data.memes[0];
          selectTemplate({
            id: first.id,
            name: first.name,
            url: first.url,
            width: first.width,
            height: first.height,
          });
        }
      } catch (e) {
        console.error('Failed to load initial template', e);
      }
    }
    loadInitialTemplate();
  }, [selectTemplate]);

  // Bind keyboard shortcuts (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Handle Custom Uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      selectCustomImage(dataUrl);
      setActiveTab('text');
    };
    reader.readAsDataURL(file);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#06b6d4', '#ec4899', '#ffffff'],
    });
  };

  // Export and Download
  const handleDownload = () => {
    if (!baseImageSrc) return;
    setExporting(true);

    renderMemeToCanvas(
      layers,
      baseImageSrc,
      (dataUrl) => {
        setExporting(false);
        const link = document.createElement('a');
        link.download = `meme-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        triggerConfetti();
      },
      (err) => {
        setExporting(false);
        console.error('Export error:', err);
        alert('Failed to export meme. Please ensure all template images load correctly.');
      }
    );
  };

  // Save creation to Local Gallery
  const handleSaveToGallery = () => {
    if (!baseImageSrc) return;
    setSaveStatus('saving');

    renderMemeToCanvas(
      layers,
      baseImageSrc,
      (dataUrl) => {
        const savedMemes = localStorage.getItem('meme-maker-gallery');
        let galleryArray = [];
        if (savedMemes) {
          try {
            galleryArray = JSON.parse(savedMemes);
          } catch (e) {
            console.error(e);
          }
        }
        
        const newItem = {
          id: `saved_${Date.now()}`,
          dataUrl,
          timestamp: Date.now(),
        };

        localStorage.setItem(
          'meme-maker-gallery',
          JSON.stringify([newItem, ...galleryArray])
        );

        setSaveStatus('success');
        triggerConfetti();

        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      },
      (err) => {
        setSaveStatus('idle');
        console.error('Save error:', err);
        alert('Failed to save meme to local gallery.');
      }
    );
  };

  // Add Text from custom sidebar preset styles
  const addStyledText = (font: string, color: string, stroke: string, size: number) => {
    addTextLayer();
    // We update the newly added layer properties
    // In our state hook, addTextLayer sets the selectedLayerId to the new layer's ID.
    // However, since state update is asynchronous, we can find the newly added layer in the next render cycle,
    // or just let the user modify it. To be clean, we can customize inside useMemeCanvas.
    // Let's modify the new layer in the state by waiting for the layer array size to change
  };

  // We can just trigger addTextLayer which defaults to Impact, and user can change it instantly.
  const handleAddText = () => {
    addTextLayer('DOUBLE CLICK TO EDIT');
  };

  return (
    <div className={styles.editorWrapper}>
      {/* Top Navbar Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <Flame className={styles.brandIcon} size={28} />
          <span className={styles.brandText}>MEMEIFY</span>
        </div>

        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={resetAll} title="Reset Canvas">
            <RotateCcw size={16} /> Reset
          </button>
          
          <button
            className={styles.btn}
            onClick={handleSaveToGallery}
            disabled={!baseImageSrc || saveStatus === 'saving'}
            title="Save to My Gallery"
          >
            <Save size={16} />
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'success'
              ? 'Saved!'
              : 'Save Gallery'}
          </button>

          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleDownload}
            disabled={!baseImageSrc || exporting}
            title="Download PNG"
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Download'}
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className={styles.mainContainer}>
        {/* Left Toolbox Sidebar */}
        <aside className={styles.sidebar}>
          {/* Vertical Icon Tabs */}
          <div className={styles.tabList}>
            <button
              className={`${styles.tabButton} ${activeTab === 'templates' ? styles.activeTabButton : ''}`}
              onClick={() => setActiveTab('templates')}
              title="Templates"
            >
              <LayoutGrid size={22} />
              Templates
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'upload' ? styles.activeTabButton : ''}`}
              onClick={() => setActiveTab('upload')}
              title="Upload"
            >
              <Upload size={22} />
              Upload
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'text' ? styles.activeTabButton : ''}`}
              onClick={() => {
                setActiveTab('text');
                if (layers.length === 0 && baseImageSrc) {
                  handleAddText();
                }
              }}
              title="Text Overlay"
            >
              <Type size={22} />
              Text
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'stickers' ? styles.activeTabButton : ''}`}
              onClick={() => setActiveTab('stickers')}
              title="Stickers"
            >
              <Smile size={22} />
              Stickers
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'draw' ? styles.activeTabButton : ''}`}
              onClick={() => {
                setActiveTab('draw');
                setIsDrawingMode(true);
              }}
              title="Draw Brush"
            >
              <Edit3 size={22} />
              Brush
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'gallery' ? styles.activeTabButton : ''}`}
              onClick={() => setActiveTab('gallery')}
              title="My Created Memes"
            >
              <FolderHeart size={22} />
              Gallery
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div className={styles.tabPanel}>
            {activeTab === 'templates' && (
              <TemplateSelector onSelect={selectTemplate} />
            )}

            {activeTab === 'upload' && (
              <>
                <h3 className={styles.panelTitle}>Custom Image</h3>
                <label className={styles.uploadZone}>
                  <Upload className={styles.uploadIcon} size={32} />
                  <span className={styles.uploadTitle}>Choose or drop an image</span>
                  <span className={styles.uploadSub}>Supports PNG, JPEG, SVG up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </>
            )}

            {activeTab === 'text' && (
              <>
                <h3 className={styles.panelTitle}>Add Text</h3>
                <div className={styles.textPresetList}>
                  <button className={styles.btn} onClick={handleAddText} style={{ width: '100%', marginBottom: '20px' }}>
                    + Add New Text Box
                  </button>
                  
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                    Quick presets
                  </span>
                  <button
                    className={`${styles.textPresetItem} ${styles.presetImpact}`}
                    onClick={() => addTextLayer('MEME IMPACT')}
                  >
                    MEME IMPACT
                  </button>
                  <button
                    className={`${styles.textPresetItem} ${styles.presetModern}`}
                    onClick={() => {
                      addTextLayer('Clean Modern');
                      // Quick override
                      setTimeout(() => {
                        const last = layers[layers.length - 1];
                        if (last) {
                          updateLayer(last.id, { fontFamily: 'Outfit', fontWeight: '800', isUppercase: false, strokeWidth: 0 });
                        }
                      }, 50);
                    }}
                  >
                    Clean Modern
                  </button>
                  <button
                    className={`${styles.textPresetItem} ${styles.presetCurly}`}
                    onClick={() => {
                      addTextLayer('Cursive text');
                      setTimeout(() => {
                        const last = layers[layers.length - 1];
                        if (last) {
                          updateLayer(last.id, { fontFamily: 'Pacifico', isUppercase: false, strokeWidth: 1, color: '#ec4899' });
                        }
                      }, 50);
                    }}
                  >
                    Cursive Style
                  </button>
                </div>
              </>
            )}

            {activeTab === 'stickers' && (
              <StickerSelector onSelect={addStickerLayer} />
            )}

            {activeTab === 'draw' && (
              <DrawingControls
                isDrawingMode={isDrawingMode}
                brushColor={brushColor}
                brushWidth={brushWidth}
                setIsDrawingMode={setIsDrawingMode}
                setBrushColor={setBrushColor}
                setBrushWidth={setBrushWidth}
                clearDrawing={clearDrawing}
              />
            )}

            {activeTab === 'gallery' && (
              <GalleryPanel
                onSelectSaved={(url) => {
                  selectCustomImage(url);
                  // Quick toast
                  alert('Loaded saved creation as background template!');
                }}
              />
            )}
          </div>
        </aside>

        {/* Center Canvas Viewport */}
        <main style={{ flex: 1, display: 'flex', height: '100%', position: 'relative' }}>
          <CanvasWorkspace
            template={template}
            customImage={customImage}
            layers={layers}
            selectedLayerId={selectedLayerId}
            isDrawingMode={isDrawingMode}
            brushColor={brushColor}
            brushWidth={brushWidth}
            setSelectedLayerId={setSelectedLayerId}
            updateLayer={updateLayer}
            deleteLayer={deleteLayer}
            startDrawingPath={startDrawingPath}
            addDrawingPoint={addDrawingPoint}
            finishDrawingPath={finishDrawingPath}
          />

          {/* History HUD Overlay */}
          <div className={styles.historyIndicator}>
            <button
              className={styles.histBtn}
              onClick={undo}
              disabled={!hasUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              className={styles.histBtn}
              onClick={redo}
              disabled={!hasRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </button>
          </div>
        </main>

        {/* Right Properties Adjustment Panel */}
        {!isDrawingMode && (
          <PropertiesPanel
            selectedLayerId={selectedLayerId}
            layers={layers}
            updateLayer={updateLayer}
            deleteLayer={deleteLayer}
            bringToFront={bringToFront}
            sendToBack={sendToBack}
          />
        )}
      </div>
    </div>
  );
}
