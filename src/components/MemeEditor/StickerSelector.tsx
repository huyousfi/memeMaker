import React from 'react';
import styles from './MemeEditor.module.css';

interface StickerSelectorProps {
  onSelect: (stickerId: string, emoji?: string, src?: string) => void;
}

const MEME_STICKERS = [
  {
    id: 'thug_glasses',
    name: 'Thug Life Glasses',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 25" width="100" height="25"><path d="M0,5 h25 v12 h-10 v4 h-5 v-4 h-10 z M30,12 h15 v4 h-15 z M50,5 h25 v12 h-10 v4 h-5 v-4 h-10 z" fill="black"/><path d="M5,7 h5 v2 h-5 z M55,7 h5 v2 h-5 z" fill="white"/></svg>`
  },
  {
    id: 'crown',
    name: 'Golden Crown',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100" height="80"><path d="M10,70 L90,70 L80,30 L60,55 L50,15 L40,55 L20,30 Z" fill="%23eab308" stroke="%23ca8a04" stroke-width="3"/><circle cx="10" cy="70" r="4" fill="%23ef4444"/><circle cx="90" cy="70" r="4" fill="%23ef4444"/><circle cx="20" cy="30" r="5" fill="%233b82f6"/><circle cx="50" cy="15" r="6" fill="%23ef4444"/><circle cx="80" cy="30" r="5" fill="%233b82f6"/></svg>`
  },
  {
    id: 'santa_hat',
    name: 'Santa Hat',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100" height="80"><path d="M20,60 Q50,10 80,60 Z" fill="%23ef4444"/><ellipse cx="50" cy="60" rx="35" ry="10" fill="white"/><circle cx="80" cy="55" r="12" fill="white"/></svg>`
  },
  {
    id: 'speech_bubble',
    name: 'Speech Bubble',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100" height="80"><rect x="5" y="5" width="90" height="55" rx="15" fill="white" stroke="black" stroke-width="3"/><path d="M25,60 L15,78 L38,60 Z" fill="white" stroke="black" stroke-width="3"/><path d="M24,59 L20,74 L35,59 Z" fill="white"/></svg>`
  },
  {
    id: 'trollface',
    name: 'Trollface Simple',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="white" stroke="black" stroke-width="4"/><path d="M20,40 Q35,30 50,45 Q65,30 80,40" fill="none" stroke="black" stroke-width="4"/><ellipse cx="33" cy="48" rx="8" ry="4" fill="none" stroke="black" stroke-width="3"/><ellipse cx="67" cy="48" rx="8" ry="4" fill="none" stroke="black" stroke-width="3"/><path d="M25,65 Q50,90 75,65 Q50,70 25,65" fill="%23f3f4f6" stroke="black" stroke-width="4"/></svg>`
  }
];

const POPULAR_EMOJIS = [
  '😂', '😭', '🥺', '🤣', '🔥', '💀', '💯', '🤔',
  '👀', '🤡', '🤷', '🤦', '😱', '😍', '😎', '🎉',
  '👍', '💩', '🤑', '🤬', '🙄', '😈', '👽', '👑',
  '💥', '💔', '❤️', '💵', '🍕', '🍺', '🐱', '🐶'
];

export default function StickerSelector({ onSelect }: StickerSelectorProps) {
  return (
    <>
      <h3 className={styles.panelTitle} style={{ marginTop: '0' }}>Custom Stickers</h3>
      <div className={styles.stickerGrid} style={{ marginBottom: '24px' }}>
        {MEME_STICKERS.map((sticker) => (
          <div
            key={sticker.id}
            className={styles.stickerItem}
            onClick={() => onSelect(sticker.id, undefined, sticker.svg)}
            title={sticker.name}
            style={{ padding: '6px' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={sticker.svg} 
              alt={sticker.name} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
        ))}
      </div>

      <h3 className={styles.panelTitle}>Popular Emojis</h3>
      <div className={styles.stickerGrid}>
        {POPULAR_EMOJIS.map((emoji, index) => (
          <div
            key={index}
            className={styles.stickerItem}
            onClick={() => onSelect(`emoji_${index}`, emoji)}
          >
            {emoji}
          </div>
        ))}
      </div>
    </>
  );
}
