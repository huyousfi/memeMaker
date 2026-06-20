import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCw, Move } from 'lucide-react';
import { Layer, TextLayer, StickerLayer, DoodleLayer, DrawingPoint } from '../../hooks/useMemeCanvas';
import styles from './MemeEditor.module.css';

interface CanvasWorkspaceProps {
  template: { url: string; name: string } | null;
  customImage: string | null;
  layers: Layer[];
  selectedLayerId: string | null;
  isDrawingMode: boolean;
  brushColor: string;
  brushWidth: number;
  setSelectedLayerId: (id: string | null) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  startDrawingPath: (pt: DrawingPoint) => void;
  addDrawingPoint: (pt: DrawingPoint) => void;
  finishDrawingPath: () => void;
}

export default function CanvasWorkspace({
  template,
  customImage,
  layers,
  selectedLayerId,
  isDrawingMode,
  brushColor,
  brushWidth,
  setSelectedLayerId,
  updateLayer,
  deleteLayer,
  startDrawingPath,
  addDrawingPoint,
  finishDrawingPath,
}: CanvasWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [dragState, setDragState] = useState<{
    type: 'drag' | 'resize' | 'rotate' | null;
    layerId: string;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
    startRotation: number;
  } | null>(null);

  const imageSrc = customImage || (template ? template.url : null);

  // Helper to get normalized mouse/touch coordinates relative to the workspace container
  const getEventCoords = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0, pixelX: 0, pixelY: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Return relative coordinates in percentage (0 to 100)
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
      pixelX: clientX,
      pixelY: clientY
    };
  }, []);

  // Freehand Drawing Event Handlers
  const [isDrawing, setIsDrawing] = useState(false);

  const drawLocal = useCallback((p1: DrawingPoint, p2: DrawingPoint) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo((p1.x / 100) * canvas.width, (p1.y / 100) * canvas.height);
    ctx.lineTo((p2.x / 100) * canvas.width, (p2.y / 100) * canvas.height);
    ctx.stroke();
  }, [brushColor, brushWidth]);

  const handleDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode) return;
    setIsDrawing(true);
    const coords = getEventCoords(e);
    const pt = { x: coords.x, y: coords.y };
    startDrawingPath(pt);
  };

  const handleDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode || !isDrawing) return;
    const coords = getEventCoords(e);
    const pt = { x: coords.x, y: coords.y };
    
    // Draw on local canvas for instant feedback
    const canvas = drawingCanvasRef.current;
    if (canvas && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // We need to keep a buffer of points or just draw the segment
      // For simplicity, we trigger the path updates
    }

    addDrawingPoint(pt);
  };

  const handleDrawEnd = () => {
    if (!isDrawingMode || !isDrawing) return;
    setIsDrawing(false);
    finishDrawingPath();
  };

  const [resizeCount, setResizeCount] = useState(0);

  // Redraw all doodle layers onto the drawing canvas
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render doodles
    const doodleLayer = layers.find((l) => l.type === 'doodle') as DoodleLayer | undefined;
    if (doodleLayer && doodleLayer.paths) {
      doodleLayer.paths.forEach((path) => {
        if (path.points.length < 2) return;
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(
          (path.points[0].x / 100) * canvas.width,
          (path.points[0].y / 100) * canvas.height
        );
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(
            (path.points[i].x / 100) * canvas.width,
            (path.points[i].y / 100) * canvas.height
          );
        }
        ctx.stroke();
      });
    }
  }, [layers, resizeCount]);

  // Adjust drawing canvas internal resolution to match container visual size
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas || !containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
        
        // Trigger redraw
        setResizeCount((prev) => prev + 1);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Drag, Resize & Rotate Event Loop
  const handleInteractionStart = (
    e: React.MouseEvent | React.TouchEvent,
    layerId: string,
    type: 'drag' | 'resize' | 'rotate'
  ) => {
    e.stopPropagation();
    if (isDrawingMode) return;

    setSelectedLayerId(layerId);
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const coords = getEventCoords(e);

    setDragState({
      type,
      layerId,
      startX: coords.pixelX,
      startY: coords.pixelY,
      startLeft: layer.x,
      startTop: layer.y,
      startWidth: layer.width,
      startHeight: layer.height,
      startRotation: layer.rotation,
    });
  };

  const handleGlobalMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState || !containerRef.current) return;

    const layer = layers.find((l) => l.id === dragState.layerId);
    if (!layer) return;

    const rect = containerRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const deltaX = clientX - dragState.startX;
    const deltaY = clientY - dragState.startY;

    // Convert pixel delta to percentage of container size
    const deltaPercentX = (deltaX / rect.width) * 100;
    const deltaPercentY = (deltaY / rect.height) * 100;

    if (dragState.type === 'drag') {
      updateLayer(dragState.layerId, {
        x: Math.max(0, Math.min(100 - layer.width, dragState.startLeft + deltaPercentX)),
        y: Math.max(0, Math.min(100 - layer.height, dragState.startTop + deltaPercentY)),
      });
    } else if (dragState.type === 'resize') {
      updateLayer(dragState.layerId, {
        width: Math.max(5, Math.min(100 - layer.x, dragState.startWidth + deltaPercentX)),
        height: Math.max(2, Math.min(100 - layer.y, dragState.startHeight + deltaPercentY)),
      });
    } else if (dragState.type === 'rotate') {
      // Calculate center of element
      const elementCenterPixelX = rect.left + ((layer.x + layer.width / 2) / 100) * rect.width;
      const elementCenterPixelY = rect.top + ((layer.y + layer.height / 2) / 100) * rect.height;

      // Compute angle
      const radians = Math.atan2(clientY - elementCenterPixelY, clientX - elementCenterPixelX);
      let degrees = radians * (180 / Math.PI) - 90; // offset rotate handle facing up
      if (degrees < 0) degrees += 360;

      updateLayer(dragState.layerId, {
        rotation: degrees,
      });
    }
  }, [dragState, layers, updateLayer]);

  const handleGlobalEnd = useCallback(() => {
    if (dragState) {
      setDragState(null);
    }
  }, [dragState]);

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalEnd);
      window.addEventListener('touchmove', handleGlobalMove, { passive: false });
      window.addEventListener('touchend', handleGlobalEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [dragState, handleGlobalMove, handleGlobalEnd]);

  // Click outside to deselect
  const handleWorkspaceClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || e.target === drawingCanvasRef.current) {
      setSelectedLayerId(null);
    }
  };

  return (
    <div className={styles.workspace} onClick={handleWorkspaceClick}>
      {imageSrc ? (
        <div 
          ref={containerRef} 
          className={styles.canvasContainer}
          style={{ position: 'relative' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt="Meme template"
            className={styles.canvasBgImage}
            draggable={false}
            crossOrigin="anonymous"
          />

          {/* Doodle Layer Canvas */}
          <canvas
            ref={drawingCanvasRef}
            className={styles.mainCanvas}
            onMouseDown={handleDrawStart}
            onMouseMove={handleDrawMove}
            onMouseUp={handleDrawEnd}
            onMouseLeave={handleDrawEnd}
            onTouchStart={handleDrawStart}
            onTouchMove={handleDrawMove}
            onTouchEnd={handleDrawEnd}
            style={{ pointerEvents: isDrawingMode ? 'auto' : 'none' }}
          />

          {/* Interactive HTML Overlays */}
          {!isDrawingMode &&
            layers
              .filter((l) => l.type !== 'doodle')
              .map((layer) => {
                const isSelected = selectedLayerId === layer.id;
                
                return (
                  <div
                    key={layer.id}
                    style={{
                      position: 'absolute',
                      left: `${layer.x}%`,
                      top: `${layer.y}%`,
                      width: `${layer.width}%`,
                      height: `${layer.height}%`,
                      transform: `rotate(${layer.rotation}deg)`,
                      opacity: layer.opacity,
                      border: isSelected ? '1px dashed var(--accent-purple)' : '1px solid transparent',
                      cursor: 'move',
                      zIndex: isSelected ? 10 : 5,
                      boxSizing: 'border-box',
                      userSelect: 'none',
                    }}
                    onMouseDown={(e) => handleInteractionStart(e, layer.id, 'drag')}
                    onTouchStart={(e) => handleInteractionStart(e, layer.id, 'drag')}
                  >
                    {/* Bounding Box Action buttons */}
                    {isSelected && (
                      <>
                        {/* Delete Button */}
                        <button
                          className={styles.galleryDeleteBtn}
                          style={{
                            position: 'absolute',
                            top: -12,
                            right: -12,
                            width: 22,
                            height: 22,
                            cursor: 'pointer',
                            zIndex: 11,
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={() => deleteLayer(layer.id)}
                        >
                          <Trash2 size={12} />
                        </button>

                        {/* Rotate Handle */}
                        <div
                          style={{
                            position: 'absolute',
                            top: -30,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'var(--accent-purple)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'grab',
                            zIndex: 11,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                          }}
                          onMouseDown={(e) => handleInteractionStart(e, layer.id, 'rotate')}
                          onTouchStart={(e) => handleInteractionStart(e, layer.id, 'rotate')}
                        >
                          <RotateCw size={10} />
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            top: -15,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 1,
                            height: 15,
                            background: 'var(--accent-purple)',
                            zIndex: 10,
                          }}
                        />

                        {/* Resize Handle */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: -6,
                            right: -6,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: 'var(--accent-purple)',
                            cursor: 'se-resize',
                            zIndex: 11,
                            border: '1px solid white',
                          }}
                          onMouseDown={(e) => handleInteractionStart(e, layer.id, 'resize')}
                          onTouchStart={(e) => handleInteractionStart(e, layer.id, 'resize')}
                        />
                      </>
                    )}

                    {/* Rendering Content */}
                    {layer.type === 'text' ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent:
                            (layer as TextLayer).textAlign === 'center'
                              ? 'center'
                              : (layer as TextLayer).textAlign === 'right'
                              ? 'flex-end'
                              : 'flex-start',
                          color: (layer as TextLayer).color,
                          fontFamily: (layer as TextLayer).fontFamily === 'Impact' ? 'Impact, sans-serif' : (layer as TextLayer).fontFamily,
                          fontWeight: (layer as TextLayer).fontWeight,
                          fontStyle: (layer as TextLayer).fontStyle,
                          textAlign: (layer as TextLayer).textAlign,
                          fontSize: `${((layer as TextLayer).fontSize)}cqw`, // Container query width based sizing makes it fully scaleable!
                          textTransform: (layer as TextLayer).isUppercase ? 'uppercase' : 'none',
                          wordBreak: 'break-word',
                          lineHeight: 1.1,
                          // SVG outline simulator
                          WebkitTextStroke: `${((layer as TextLayer).strokeWidth)}px ${(layer as TextLayer).strokeColor}`,
                          paintOrder: 'stroke fill',
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}
                      >
                        {(layer as TextLayer).text}
                      </div>
                    ) : layer.type === 'sticker' ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: `${(layer as StickerLayer).emoji ? '100%' : 'auto'}`,
                        }}
                      >
                        {(layer as StickerLayer).emoji ? (
                          <span style={{ fontSize: '7cqw' }}>{(layer as StickerLayer).emoji}</span>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={(layer as StickerLayer).src}
                            alt="Sticker"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                            }}
                            draggable={false}
                          />
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Move size={48} className="float-anim" />
          <h2>Canvas is Empty</h2>
          <p>Select a template from the left or upload your own image to get started.</p>
        </div>
      )}
    </div>
  );
}
