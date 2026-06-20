import { Layer, TextLayer, StickerLayer, DoodleLayer } from '../hooks/useMemeCanvas';

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(' ');
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine !== undefined) {
      lines.push(currentLine);
    }
  });

  return lines;
}

export function renderMemeToCanvas(
  layers: Layer[],
  imageSrc: string,
  onComplete: (dataUrl: string) => void,
  onError: (error: any) => void
) {
  const baseImg = new Image();
  baseImg.crossOrigin = 'anonymous';
  baseImg.src = imageSrc;

  baseImg.onload = () => {
    // We normalize export width to 1000px for high definition
    const exportWidth = 1000;
    const aspectRatio = baseImg.naturalHeight / baseImg.naturalWidth;
    const exportHeight = exportWidth * aspectRatio;

    const canvas = document.createElement('canvas');
    canvas.width = exportWidth;
    canvas.height = exportHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onError(new Error('Could not create 2D context'));
      return;
    }

    // 1. Draw base image
    ctx.drawImage(baseImg, 0, 0, exportWidth, exportHeight);

    // Track active image loads for stickers
    const imageLoadPromises: Promise<void>[] = [];

    // Helper to draw a specific layer
    const drawLayer = (layer: Layer) => {
      ctx.save();

      // Convert percentages to pixel values
      const x = (layer.x / 100) * exportWidth;
      const y = (layer.y / 100) * exportHeight;
      const w = (layer.width / 100) * exportWidth;
      const h = (layer.height / 100) * exportHeight;

      // Apply opacity
      ctx.globalAlpha = layer.opacity;

      // Apply rotation (translate to center of element, rotate, translate back)
      if (layer.rotation !== 0) {
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.translate(-(x + w / 2), -(y + h / 2));
      }

      if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        const fontName = textLayer.fontFamily === 'Impact' ? 'Impact, sans-serif' : textLayer.fontFamily;
        const style = textLayer.fontStyle;
        const weight = textLayer.fontWeight;
        
        // Font size is relative to canvas height (scaled)
        const fontSizePx = (textLayer.fontSize / 100) * exportHeight;
        
        ctx.font = `${style} ${weight} ${fontSizePx}px ${fontName}`;
        ctx.textBaseline = 'middle';

        const textContent = textLayer.isUppercase ? textLayer.text.toUpperCase() : textLayer.text;
        const lines = wrapText(ctx, textContent, w);
        const totalHeight = lines.length * fontSizePx * 1.15;
        
        // Starting y coordinate to vertically center the lines in the bounding box
        let startY = y + (h - totalHeight) / 2 + fontSizePx / 2;

        lines.forEach((line) => {
          let lineX = x;
          if (textLayer.textAlign === 'center') {
            lineX = x + w / 2;
            ctx.textAlign = 'center';
          } else if (textLayer.textAlign === 'right') {
            lineX = x + w;
            ctx.textAlign = 'right';
          } else {
            ctx.textAlign = 'left';
          }

          // Draw outline stroke
          if (textLayer.strokeWidth > 0) {
            ctx.strokeStyle = textLayer.strokeColor;
            // Scale stroke relative to export resolution
            const scaledStroke = (textLayer.strokeWidth / 400) * exportWidth;
            ctx.lineWidth = Math.max(1, scaledStroke);
            ctx.lineJoin = 'round';
            ctx.strokeText(line, lineX, startY);
          }

          // Draw fill
          ctx.fillStyle = textLayer.color;
          ctx.fillText(line, lineX, startY);

          startY += fontSizePx * 1.15;
        });
      } else if (layer.type === 'sticker') {
        const stickerLayer = layer as StickerLayer;

        if (stickerLayer.emoji) {
          // Draw Emoji sticker
          const fontSizePx = w * 0.8;
          ctx.font = `${fontSizePx}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(stickerLayer.emoji, x + w / 2, y + h / 2);
        } else if (stickerLayer.src) {
          // Draw SVG/Image sticker
          const stickerImg = new Image();
          stickerImg.crossOrigin = 'anonymous';
          stickerImg.src = stickerLayer.src;

          const promise = new Promise<void>((resolve, reject) => {
            stickerImg.onload = () => {
              ctx.drawImage(stickerImg, x, y, w, h);
              resolve();
            };
            stickerImg.onerror = () => {
              console.error('Failed to load sticker image:', stickerLayer.stickerId);
              resolve(); // Resolve anyway to not block the whole export
            };
          });
          imageLoadPromises.push(promise);
        }
      }

      ctx.restore();
    };

    // 2. Separate rendering layers: non-doodle first, doodle next
    const nonDoodles = layers.filter((l) => l.type !== 'doodle');
    const doodleLayer = layers.find((l) => l.type === 'doodle') as DoodleLayer | undefined;

    // Draw all standard layers
    nonDoodles.forEach(drawLayer);

    // Wait for all stickers/images to load and draw, then draw doodles and export
    Promise.all(imageLoadPromises).then(() => {
      // Draw doodles on top of stickers/texts
      if (doodleLayer && doodleLayer.paths) {
        ctx.save();
        ctx.globalAlpha = doodleLayer.opacity;

        doodleLayer.paths.forEach((path) => {
          if (path.points.length < 2) return;
          
          ctx.strokeStyle = path.color;
          // Scale brush width to export resolution
          const scaledBrushWidth = (path.width / 500) * exportWidth;
          ctx.lineWidth = scaledBrushWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(
            (path.points[0].x / 100) * exportWidth,
            (path.points[0].y / 100) * exportHeight
          );
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(
              (path.points[i].x / 100) * exportWidth,
              (path.points[i].y / 100) * exportHeight
            );
          }
          ctx.stroke();
        });
        ctx.restore();
      }

      // Convert to data URL
      try {
        const dataUrl = canvas.toDataURL('image/png');
        onComplete(dataUrl);
      } catch (err) {
        onError(err);
      }
    });
  };

  baseImg.onerror = (err) => {
    onError(new Error('Failed to load base meme template image. Check CORS settings.'));
  };
}
