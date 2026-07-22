import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';

export default function PhotoViewer({ profileId, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profile_photos')
        .select('photo_url')
        .eq('profile_id', profileId)
        .order('sort_order', { ascending: true });
      setPhotos(data || []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  function next(e) {
    e.stopPropagation();
    setIndex((i) => (i + 1) % photos.length);
  }
  function prev(e) {
    e.stopPropagation();
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 999999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      }}
    >
      {loading && <div className="loading-gear" style={{ fontSize: 26 }}>⚙️</div>}

      {!loading && photos.length === 0 && <div style={{ color: 'var(--text-dim)' }}>Фото нет</div>}

      {!loading && photos.length > 0 && (
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
          {photos.length > 1 && (
            <div onClick={prev} style={{ position: 'absolute', left: 10, color: '#fff', fontSize: 28, cursor: 'pointer', padding: 10 }}>‹</div>
          )}
          <img
            src={photos[index].photo_url}
            alt=""
            style={{ maxWidth: '92vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8 }}
          />
          {photos.length > 1 && (
            <div onClick={next} style={{ position: 'absolute', right: 10, color: '#fff', fontSize: 28, cursor: 'pointer', padding: 10 }}>›</div>
          )}
          {/* Крестик рядом с самой фотографией, а не в дальнем углу экрана */}
          <div
            onClick={onClose}
            style={{
              position: 'absolute', top: -34, right: 0, color: '#fff', fontSize: 20, cursor: 'pointer',
              background: 'rgba(0,0,0,.5)', width: 30, height: 30, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </div>
        </div>
      )}

      {!loading && photos.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
          {photos.map((_, i) => (
            <div
              key={i}
              onClick={(e) => { e.stopPropagation(); setIndex(i); }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: i === index ? '#fff' : 'rgba(255,255,255,.35)', cursor: 'pointer' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
