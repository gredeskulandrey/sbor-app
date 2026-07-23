import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { TOPICS, ONLINE_TAGS } from '../constants.js';
import { geocodeAddress } from '../geocode.js';

export default function GatherForm({ city, onBack, onCreated }) {
  const [isOnline, setIsOnline] = useState(false); // офлайн по умолчанию
  const [topic, setTopic] = useState('bars');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [venueLink, setVenueLink] = useState('');
  const [onlineLink, setOnlineLink] = useState('');
  const [dateDigits, setDateDigits] = useState(''); // сырые цифры даты (до 8), собираются в шаблон __.__.____
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [limit, setLimit] = useState(4);
  const [ageLimit, setAgeLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const DATE_TEMPLATE = '__.__.____';

  // Собирает шаблон "__.__.____" с уже введёнными цифрами вместо подчёркиваний —
  // видно сразу, сколько ещё осталось ввести и в каком формате
  function buildDateMask(digits) {
    let out = '';
    let di = 0;
    for (const ch of DATE_TEMPLATE) {
      if (ch === '_') { out += digits[di] !== undefined ? digits[di] : '_'; di++; }
      else out += ch;
    }
    return out;
  }

  function handleDateInput(raw) {
    const digits = raw.replace(/[^0-9]/g, '').slice(0, 8);
    setDateDigits(digits);
  }

  // Из введённых цифр (ДДММГГГГ) получаем ISO-дату (YYYY-MM-DD), только если введены все 8
  function parseDateDigits(digits) {
    if (digits.length !== 8) return null;
    const d = digits.slice(0, 2), mo = digits.slice(2, 4), y = digits.slice(4, 8);
    return `${y}-${mo}-${d}`;
  }

  const date = parseDateDigits(dateDigits);

  const currentTopics = isOnline ? ONLINE_TAGS : TOPICS;

  function handleToggle(next) {
    setIsOnline(next);
    setTopic(next ? ONLINE_TAGS[0].id : TOPICS[0].id);
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
      setError('Введи дату полностью в формате ДД.ММ.ГГГГ');
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
      participant_limit: limit,
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
            <div className="field">
              <label>Адрес</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом" />
            </div>
            <div className="field">
              <label>Ссылка на заведение (необязательно)</label>
              <input value={venueLink} onChange={(e) => setVenueLink(e.target.value)} placeholder="Сайт, страница в 2ГИС и т.д." />
            </div>
          </>
        )}

        <div className="field">
          <label>Дата</label>
          <input
            type="text"
            inputMode="numeric"
            value={buildDateMask(dateDigits)}
            onChange={(e) => handleDateInput(e.target.value)}
            onFocus={(e) => e.target.setSelectionRange(0, 0)}
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
          <label>Правила встречи (необязательно)</label>
          <textarea value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Дресс-код, что взять с собой и т.д." />
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
