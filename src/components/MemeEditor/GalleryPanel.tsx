import React, { useState, useEffect } from 'react';
import { Trash2, Download, ExternalLink } from 'lucide-react';
import styles from './MemeEditor.module.css';

interface GalleryItem {
  id: string;
  dataUrl: string;
  timestamp: number;
}

interface GalleryPanelProps {
  onSelectSaved: (dataUrl: string) => void;
}

export default function GalleryPanel({ onSelectSaved }: GalleryPanelProps) {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('meme-maker-gallery');
    if (saved) {
      try {
        setGallery(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing gallery from local storage', e);
      }
    }
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = gallery.filter((item) => item.id !== id);
    setGallery(updated);
    localStorage.setItem('meme-maker-gallery', JSON.stringify(updated));
  };

  const handleDownload = (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.download = `meme-${item.timestamp}.png`;
    link.href = item.dataUrl;
    link.click();
  };

  return (
    <>
      <h3 className={styles.panelTitle}>My Created Memes</h3>
      {gallery.length > 0 ? (
        <div className={styles.galleryGrid}>
          {gallery.map((item) => (
            <div
              key={item.id}
              className={styles.galleryItem}
              onClick={() => onSelectSaved(item.dataUrl)}
              title="Click to view image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.dataUrl} alt="Saved Meme" />
              <div className={styles.galleryActions}>
                <button
                  className={styles.galleryDeleteBtn}
                  style={{ background: 'var(--accent-purple)' }}
                  onClick={(e) => handleDownload(item, e)}
                  title="Download Image"
                >
                  <Download size={12} />
                </button>
                <button
                  className={styles.galleryDeleteBtn}
                  onClick={(e) => handleDelete(item.id, e)}
                  title="Delete from Gallery"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: '500', marginBottom: '8px' }}>No saved memes yet.</p>
          <span style={{ fontSize: '0.75rem' }}>
            Create a meme and click the "Save to Gallery" button in the header!
          </span>
        </div>
      )}
    </>
  );
}
