import { useState, useCallback, useRef, useEffect } from 'react';

export type LayerType = 'text' | 'sticker' | 'doodle';

export interface BaseLayer {
  id: string;
  type: LayerType;
  x: number;      // 0-100 percentage of canvas width
  y: number;      // 0-100 percentage of canvas height
  width: number;  // 0-100 percentage of canvas width
  height: number; // 0-100 percentage of canvas height
  rotation: number; // degrees
  opacity: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontSize: number; // Font size in canvas units
  color: string;
  strokeColor: string;
  strokeWidth: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: 'left' | 'center' | 'right';
  isUppercase: boolean;
}

export interface StickerLayer extends BaseLayer {
  type: 'sticker';
  stickerId: string;
  emoji?: string;
  src?: string;
}

export interface DrawingPoint {
  x: number; // 0-100 percentage of canvas width
  y: number; // 0-100 percentage of canvas height
}

export interface DrawingPath {
  color: string;
  width: number; // in pixels
  points: DrawingPoint[];
}

export interface DoodleLayer extends BaseLayer {
  type: 'doodle';
  paths: DrawingPath[];
}

export type Layer = TextLayer | StickerLayer | DoodleLayer;

export interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
}

export function useMemeCanvas() {
  const [template, setTemplate] = useState<MemeTemplate | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  
  // Drawing states
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#8b5cf6');
  const [brushWidth, setBrushWidth] = useState(8);
  const currentPathRef = useRef<DrawingPoint[]>([]);

  // Undo / Redo stacks
  const [history, setHistory] = useState<Layer[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushToHistory = useCallback((newLayers: Layer[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    setHistory([...nextHistory, newLayers]);
    setHistoryIndex(nextHistory.length);
  }, [history, historyIndex]);

  const updateLayers = useCallback((newLayers: Layer[] | ((prev: Layer[]) => Layer[])) => {
    setLayers((prev) => {
      const resolved = typeof newLayers === 'function' ? newLayers(prev) : newLayers;
      pushToHistory(resolved);
      return resolved;
    });
  }, [pushToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLayers(history[historyIndex - 1]);
      setSelectedLayerId(null);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLayers(history[historyIndex + 1]);
      setSelectedLayerId(null);
    }
  }, [history, historyIndex]);

  const addTextLayer = useCallback((initialText = 'EDIT TEXT') => {
    const newTextLayer: TextLayer = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      x: 10,
      y: 10,
      width: 80,
      height: 12,
      rotation: 0,
      opacity: 1,
      text: initialText,
      fontSize: 3, // percentage of canvas height
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 4,
      fontFamily: 'Impact',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      isUppercase: true,
    };
    updateLayers((prev) => [...prev, newTextLayer]);
    setSelectedLayerId(newTextLayer.id);
    setIsDrawingMode(false);
  }, [updateLayers]);

  const addStickerLayer = useCallback((stickerId: string, emoji?: string, src?: string) => {
    const newStickerLayer: StickerLayer = {
      id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'sticker',
      x: 35,
      y: 35,
      width: 30,
      height: 30,
      rotation: 0,
      opacity: 1,
      stickerId,
      emoji,
      src,
    };
    updateLayers((prev) => [...prev, newStickerLayer]);
    setSelectedLayerId(newStickerLayer.id);
    setIsDrawingMode(false);
  }, [updateLayers]);

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    updateLayers((prev) =>
      prev.map((layer) => (layer.id === id ? ({ ...layer, ...updates } as Layer) : layer))
    );
  }, [updateLayers]);

  const deleteLayer = useCallback((id: string) => {
    updateLayers((prev) => prev.filter((layer) => layer.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  }, [selectedLayerId, updateLayers]);

  const bringToFront = useCallback((id: string) => {
    updateLayers((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      if (index === -1 || index === prev.length - 1) return prev;
      const target = prev[index];
      const rest = prev.filter((l) => l.id !== id);
      return [...rest, target];
    });
  }, [updateLayers]);

  const sendToBack = useCallback((id: string) => {
    updateLayers((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      if (index === -1 || index === 0) return prev;
      const target = prev[index];
      const rest = prev.filter((l) => l.id !== id);
      return [target, ...rest];
    });
  }, [updateLayers]);

  const selectTemplate = useCallback((tpl: MemeTemplate | null) => {
    setTemplate(tpl);
    setCustomImage(null);
    // Add default top and bottom texts for classic templates
    const defaultTextLayers: Layer[] = [
      {
        id: `text_top`,
        type: 'text',
        x: 5,
        y: 4,
        width: 90,
        height: 12,
        rotation: 0,
        opacity: 1,
        text: 'TOP TEXT',
        fontSize: 4,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 4,
        fontFamily: 'Impact',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        isUppercase: true,
      },
      {
        id: `text_bottom`,
        type: 'text',
        x: 5,
        y: 84,
        width: 90,
        height: 12,
        rotation: 0,
        opacity: 1,
        text: 'BOTTOM TEXT',
        fontSize: 4,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 4,
        fontFamily: 'Impact',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        isUppercase: true,
      }
    ];
    setLayers(defaultTextLayers);
    setHistory([defaultTextLayers]);
    setHistoryIndex(0);
    setSelectedLayerId(null);
    setIsDrawingMode(false);
  }, []);

  const selectCustomImage = useCallback((dataUrl: string) => {
    setCustomImage(dataUrl);
    setTemplate(null);
    const defaultTextLayers: Layer[] = [
      {
        id: `text_top`,
        type: 'text',
        x: 5,
        y: 4,
        width: 90,
        height: 12,
        rotation: 0,
        opacity: 1,
        text: 'TOP TEXT',
        fontSize: 8,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 4,
        fontFamily: 'Impact',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        isUppercase: true,
      }
    ];
    setLayers(defaultTextLayers);
    setHistory([defaultTextLayers]);
    setHistoryIndex(0);
    setSelectedLayerId(null);
    setIsDrawingMode(false);
  }, []);

  // Drawing Path Actions
  const startDrawingPath = useCallback((pt: DrawingPoint) => {
    currentPathRef.current = [pt];
  }, []);

  const addDrawingPoint = useCallback((pt: DrawingPoint) => {
    currentPathRef.current.push(pt);
  }, []);

  const finishDrawingPath = useCallback(() => {
    if (currentPathRef.current.length < 2) return;
    
    // Check if there is already a doodle layer
    const doodleLayerIndex = layers.findIndex((l) => l.type === 'doodle');
    const newPath: DrawingPath = {
      color: brushColor,
      width: brushWidth,
      points: [...currentPathRef.current],
    };

    if (doodleLayerIndex !== -1) {
      // Add path to existing doodle layer
      const existingDoodle = layers[doodleLayerIndex] as DoodleLayer;
      const updatedDoodle: DoodleLayer = {
        ...existingDoodle,
        paths: [...existingDoodle.paths, newPath],
      };
      updateLayers((prev) =>
        prev.map((l) => (l.type === 'doodle' ? updatedDoodle : l))
      );
    } else {
      // Create new doodle layer
      const newDoodleLayer: DoodleLayer = {
        id: `doodle_${Date.now()}`,
        type: 'doodle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
        paths: [newPath],
      };
      updateLayers((prev) => [...prev, newDoodleLayer]);
    }
    currentPathRef.current = [];
  }, [layers, brushColor, brushWidth, updateLayers]);

  const clearDrawing = useCallback(() => {
    updateLayers((prev) => prev.filter((l) => l.type !== 'doodle'));
  }, [updateLayers]);

  const resetAll = useCallback(() => {
    setLayers([]);
    setSelectedLayerId(null);
    setIsDrawingMode(false);
    setHistory([[]]);
    setHistoryIndex(0);
  }, []);

  return {
    template,
    customImage,
    layers,
    selectedLayerId,
    isDrawingMode,
    brushColor,
    brushWidth,
    historyIndex,
    hasUndo: historyIndex > 0,
    hasRedo: historyIndex < history.length - 1,
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
  };
}
