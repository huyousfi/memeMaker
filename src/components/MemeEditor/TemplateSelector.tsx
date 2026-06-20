import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { MemeTemplate } from '../../hooks/useMemeCanvas';
import styles from './MemeEditor.module.css';

interface TemplateSelectorProps {
  onSelect: (template: MemeTemplate) => void;
}

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoading(true);
        const res = await fetch('https://api.imgflip.com/get_memes');
        const data = await res.json();
        if (data.success) {
          const formatted = data.data.memes.map((m: any) => ({
            id: m.id,
            name: m.name,
            url: m.url,
            width: m.width,
            height: m.height,
          }));
          setTemplates(formatted);
        }
      } catch (error) {
        console.error('Error fetching meme templates:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <h3 className={styles.panelTitle}>Meme Templates</h3>
      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} size={18} />
        <input
          type="search"
          placeholder="Search templates..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.templateGrid}>
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={styles.skeletonItem} />
          ))
        ) : filteredTemplates.length > 0 ? (
          filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className={styles.templateItem}
              onClick={() => onSelect(tpl)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tpl.url} alt={tpl.name} loading="lazy" crossOrigin="anonymous" />
              <div className={styles.templateName}>{tpl.name}</div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
            No templates found.
          </div>
        )}
      </div>
    </>
  );
}
