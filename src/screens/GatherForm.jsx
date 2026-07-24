import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { TOPICS, ONLINE_TAGS, CITY_COORDS } from '../constants.js';
import { geocodeAddress } from '../geocode.js';
import { suggestAddress } from '../suggestAddress.js';

export default function GatherForm({ city, onBack, onCreated }) {
  const [isOnline, setIsOnline] = useState(false); // офлайн по умолчанию
  const [topic, setTopic] = useState('bars');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimer = React.useRef(null);
  const [venueLink, setVenueLink] = useState('');
  const [onlineLink, setOnlineLink] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [limit, setLimit] = useState(4);
  const [ageLimit, setAgeLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 30);
  const maxDateStr = maxDateObj.toISOString().slice(0, 10);

  const currentTopics = isOnline ? ONLINE_TAGS : TOPICS;

  function handleToggle(next) {
    setIsOnline(next);
    setTopic(next ? ONLINE_TAGS[0].id : TOPICS[0].id);
  }

  function handleAddressChange(value) {
    setAddress(value);
    setShowSuggestions(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      const results = await suggestAddress(value, city, CITY_COORDS[city]);
      setAddressSuggestions(results);
    }, 300);
  }

  function pickSuggestion(s) {
    setAddress(s.subtitle ? `${s.text}, ${s.subtitle}` : s.text);
    setAddressSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleSubmit() {
    if (isOnline) {
      if (!onlineLink.trim() || !date || !time) {
        setError('Заполни ссылку, дату и время');
        return;
      }
    } else {
      if (!venue.trim() || !address.trim() || !date || !time) {
        setError('Заполни название локации, адрес, дату и время');
        return;
      }
    }

    if (!date) {
      setError('Выбери дату встречи');
      return;
    }

    const chosenDateTime = new Date(`${date}T${time}`);
    if (isNaN(chosenDateTime.getTime())) {
      setError('Такой даты не существует — проверь, что ввёл(а) верно');
      return;
    }
    const minAllowed = new Date(Date.now() + 60 * 60 * 1000);
    const maxAllowed = new Date();
    maxAllowed.setDate(maxAllowed.getDate() + 30);
    if (chosenDateTime.getTime() < minAllowed.getTime()) {
      setError('Встречу можно назначить не раньше, чем через час от текущего времени');
      return;
    }
    if (chosenDateTime.getTime() > maxAllowed.getTime()) {
      setError('Встречу можно назначить не позже, чем через 30 дней');
      return;
    }

    setSaving(true);
    setError('');

    let coords = { lat: null, lon: null };
    if (!isOnline) {
      const fullAddress = `${city}, ${address.trim()}`;
      coords = await geocodeAddress(fullAddress);
      if (!coords) {
        setError('Не получилось найти этот адрес на карте — проверь, что он указан верно');
        setSaving(false);
        return;
      }
    }

    const { data: { session } } = await supabase.auth.getSession();

    // Название карточки: для офлайн — это сама введённая локация ("Ресторан «Пушкин»"),
    // для онлайн (там нет физического места) — берём тему
    const title = isOnline
      ? `${currentTopics.find((t) => t.id === topic)?.label}: встреча`
      : venue.trim();

    const { error: insertError } = await supabase.from('events').insert({
      organizer_id: session.user.id,
      title,
      category: topic,
      is_online: isOnline,
      city: isOnline ? null : city,
      venue_name: isOnline ? null : venue.trim(),
      address: isOnline ? null : address.trim(),
      venue_link: isOnline ? null : (venueLink.trim() || null),
      online_link: isOnline ? onlineLink.trim() : null,
      event_date: date,
      event_time: time,
      description: description.trim(),
      rules: rules.trim() || null,
      participant_limit: Math.min(30, Math.max(1, parseInt(limit, 10) || 1)),
      age_restriction: ageLimit || null,
      lat: isOnline ? null : coords.lat,
      lon: isOnline ? null : coords.lon,
    });

    setSaving(false);
    if (insertError) {
      setError('Не получилось создать встречу: ' + insertError.message);
      return;
    }
    onCreated();
  }

  return (
    <div className="screen">
      <div className="auth-wrap" style={{ padding: '16px 20px' }}>
        <div className="backbtn" onClick={onBack}>←</div>
        <h2 style={{ fontSize: 17, marginBottom: 16 }}>Собрать встречу</h2>

        <label>Формат встречи</label>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          <div className={'chip' + (!isOnline ? ' active' : '')} onClick={() => handleToggle(false)}>Офлайн</div>
          <div className={'chip' + (isOnline ? ' active' : '')} onClick={() => handleToggle(true)}>Онлайн</div>
        </div>

        <label>Тема встречи</label>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          {currentTopics.map((t) => (
            <div
              key={t.id}
              className={'chip' + (topic === t.id ? ' active' : '')}
              onClick={() => setTopic(t.id)}
            >
              {t.ic} {t.label}
            </div>
          ))}
        </div>

        {isOnline ? (
          <div className="field">
            <label>Ссылка на встречу</label>
            <input value={onlineLink} onChange={(e) => setOnlineLink(e.target.value)} placeholder="Zoom, Discord и т.д." />
          </div>
        ) : (
          <>
            <div className="field">
              <label>Название локации</label>
              <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder='Например, ресторан «Пушкин»' />
            </div>
            <div className="field" style={{ position: 'relative' }}>
              <label>Адрес</label>
              <input
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Начни вводить улицу — покажем подсказки"
                autoComplete="off"
              />
              {showSuggestions && addressSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                  background: 'var(--card-2)', border: '1px solid var(--stroke)', borderRadius: 12,
                  marginTop: 4, overflow: 'hidden',
                }}>
                  {addressSuggestions.map((s, i) => (
                    <div
                      key={i}
                      onMouseDown={() => pickSuggestion(s)}
                      style={{ padding: '10px 12px', fontSize: 13, cursor: 'pointer', borderBottom: i < addressSuggestions.length - 1 ? '1px solid var(--stroke)' : 'none' }}
                    >
                      <div>{s.text}</div>
                      {s.subtitle && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.subtitle}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="field">
              <label>Ссылка на заведение (необязательно)</label>
              <input value={venueLink} onChange={(e) => setVenueLink(e.target.value)} placeholder="Сайт, ссылка на картах и т.д." />
            </div>
          </>
        )}

        <div className="field">
          <label>Дата</label>
          <input
            type="date"
            min={today}
            max={maxDateStr}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ color: date ? 'var(--text)' : 'var(--text-dim)' }}
          />
        </div>
        <div className="field">
          <label>Время</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{ color: time ? 'var(--text)' : 'var(--text-dim)' }}
          />
        </div>
        <div className="field">
          <label>О встрече (необязательно)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="О чём встреча?" />
        </div>
        <div className="field">
          <label>Правила встречи (необязательно)</label>
          <textarea value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Дресс-код, что взять с собой и т.д." />
        </div>
        <div className="field">
          <label>Лимит участников</label>
          <input
            type="number"
            min={1}
            max={30}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            onBlur={() => {
              let n = parseInt(limit, 10);
              if (isNaN(n) || n < 1) n = 1;
              if (n > 30) n = 30;
              setLimit(n);
            }}
          />
        </div>
        <div className="field">
          <label>Возрастной ценз (если нужен)</label>
          <select value={ageLimit} onChange={(e) => setAgeLimit(e.target.value)}>
            <option value="">Нет</option>
            <option value="18+">18+</option>
            <option value="21+">21+</option>
          </select>
        </div>

        {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}

        <button className="btn btn-primary" disabled={saving} onClick={handleSubmit}>
          {saving ? 'Публикуем...' : 'Опубликовать встречу'}
        </button>
      </div>
    </div>
  );
}
