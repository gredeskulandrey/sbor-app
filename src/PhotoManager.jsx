import React, { useRef, useState } from 'react';
import { supabase } from './supabaseClient.js';

// Управляет списком фото профиля: реальная загрузка (камера/галерея), порядок, удаление.
// photos: [{ photo_url, sort_order, id? }] — id есть только у уже сохранённых в базе фото.
export default function PhotoManager({ userId, photos, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // чтобы можно было выбрать тот же файл повторно
    if (!file) return;
    if (photos.length >= 5) return;

    setUploading(true);
    setError('');

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('profile-photos').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadError) {
      setUploading(false);
      setError('Не получилось загрузить фото: ' + uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('profile-photos').getPublicUrl(path);
    const newPhoto = { photo_url: publicUrlData.publicUrl, storage_path: path, sort_order: photos.length };
    onChange([...photos, newPhoto]);
    setUploading(false);
  }

  function movePhoto(index, direction) {
    const next = [...photos];
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= next.length) return;
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    onChange(next.map((p, i) => ({ ...p, sort_order: i })));
  }

  async function removePhoto(index) {
    const target = photos[index];
    if (photos.length <= 1) {
      setError('Нужно оставить хотя бы одно фото');
      return;
    }
    if (target.storage_path) {
      await supabase.storage.from('profile-photos').remove([target.storage_path]);
    }
    const next = photos.filter((_, i) => i !== index).map((p, i) => ({ ...p, sort_order: i }));
    onChange(next);
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {photos.map((p, i) => (
          <div key={p.id || p.photo_url} style={{ position: 'relative', width: 72 }}>
            <img
              src={p.photo_url}
              alt=""
              style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, border: i === 0 ? '2px solid var(--coral)' : '1px solid var(--stroke)' }}
            />
            {i === 0 && (
              <div style={{ position: 'absolute', top: 2, left: 2, background: 'var(--coral)', color: '#1a0d09', fontSize: 9, fontWeight: 700, borderRadius: 6, padding: '1px 5px' }}>
                Главное
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0} style={{ fontSize: 11, padding: '2px 6px', background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 6, color: 'var(--text)' }}>◀</button>
              <button type="button" onClick={() => removePhoto(i)} style={{ fontSize: 11, padding: '2px 6px', background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 6, color: '#ff8b7d' }}>✕</button>
              <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === photos.length - 1} style={{ fontSize: 11, padding: '2px 6px', background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 6, color: 'var(--text)' }}>▶</button>
            </div>
          </div>
        ))}

        {photos.length < 5 && (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="photo-slot"
            style={{ width: 72, height: 72, cursor: uploading ? 'default' : 'pointer' }}
          >
            {uploading ? '...' : '+'}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChosen}
        style={{ display: 'none' }}
      />

      <div className="field-note" style={{ marginTop: 8 }}>
        Первое фото по порядку — главное, оно показывается как аватарка. Стрелками можно поменять порядок.
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
