import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { TOPICS } from '../constants.js';
import { geocodeAddress } from '../geocode.js';

export default function GatherForm({ city, onBack, onCreated }) {
  const [topic, setTopic] = useState('bars');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [limit, setLimit] = useState(4);
  const [ageLimit, setAgeLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().slice(0, 10);

  async function handleSubmit() {
    if (!venue.trim() || !address.trim() || !date || !time) {
      setError('Заполни название места, адрес, дату и время');
      return;
    }

    // Встреча должна быть не раньше, чем через час от текущего момента
    const chosenDateTime = new Date(`${date}T${time}`);
    const minAllowed = new Date(Date.now() + 60 * 60 * 1000);
    if (chosenDateTime.getTime() < minAllowed.getTime()) {
      setError('Встречу можно назначить не раньше, чем через час от текущего времени');
      return;
    }

    setSaving(true);
    setError('');

    // Превращаем адрес в точку на карте
    const fullAddress = `${city}, ${venue.trim()}, ${address.trim()}`;
    const coords = await geocodeAddress(fullAddress);
    if (!coords) {
      setError('Не получилось найти этот адрес на карте — проверь, что он указан верно');
      setSaving(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const { error: insertError } = await supabase.from('events').insert({
      organizer_id: session.user.id,
      title: `${TOPICS.find((t) => t.id === topic)?.label}: встреча`,
      category: topic,
      is_online: false,
      city,
      venue_name: venue.trim(),
      address: address.trim(),
      event_date: date,
      event_time: time,
      description: description.trim(),
      participant_limit: limit,
      age_restriction: ageLimit || null,
      lat: coords.lat,
      lon: coords.lon,
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

        <label>Тема встречи</label>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          {TOPICS.map((t) => (
            <div
              key={t.id}
              className={'chip' + (topic === t.id ? ' active' : '')}
              onClick={() => setTopic(t.id)}
            >
              {t.ic} {t.label}
            </div>
          ))}
        </div>

        <div className="field">
          <label>Название места</label>
          <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Например: Клуб «Кубик»" />
        </div>
        <div className="field">
          <label>Адрес</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом" />
        </div>
        <div className="field">
          <label>Дата</label>
          <input
            type="date"
            min={today}
            max={maxDateStr}
            value={date}
            onChange={(e) => {
              const v = e.target.value;
              // Подстраховка: даже если браузер позволил вписать дату руками,
              // не даём ей оказаться раньше сегодняшней или позже +30 дней
              if (v && v < today) { setDate(today); return; }
              if (v && v > maxDateStr) { setDate(maxDateStr); return; }
              setDate(v);
            }}
          />
        </div>
        <div className="field">
          <label>Время</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="field">
          <label>О встрече</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="О чём встреча?" />
        </div>
        <div className="field">
          <label>Лимит участников</label>
          <input type="number" min={1} max={50} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
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
