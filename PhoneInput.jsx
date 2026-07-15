import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function PhoneInput({ value, onChange, onBack, onSent }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(raw) {
    // Только цифры и "+", "+" всегда первый и его нельзя стереть
    let v = raw.replace(/[^0-9+]/g, '').replace(/(?!^)\+/g, '');
    if (!v.startsWith('+')) v = '+' + v;
    onChange(v);
  }

  async function handleSubmit() {
    const valid = /^\+[0-9]{7,15}$/.test(value);
    if (!valid) {
      setError('Только цифры после «+», код страны обязателен');
      return;
    }
    setError('');
    setLoading(true);
    // Настоящий вызов нашей функции, которая просит Telegram Gateway отправить код
    const { data, error: fnError } = await supabase.functions.invoke('send-phone-code', {
      body: { phone_number: value },
    });
    setLoading(false);
    if (fnError || !data?.request_id) {
      setError('Не получилось отправить код. Проверь номер и что у него есть Telegram.');
      return;
    }
    onSent(data.request_id);
  }

  return (
    <div className="screen">
      <div className="auth-wrap">
        <div className="backbtn" onClick={onBack}>←</div>
        <div className="auth-hero">
          <h1>Вход по телефону</h1>
          <p>Код придёт в Telegram, привязанный к этому номеру</p>
        </div>
        <div className={'field' + (error ? ' invalid' : '')}>
          <label>Телефон</label>
          <input
            type="tel"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="+7 999 888 77 66"
          />
          {error && <div className="field-error">{error}</div>}
        </div>
        <button className="btn btn-primary" disabled={loading} onClick={handleSubmit}>
          {loading ? 'Отправляем...' : 'Получить код'}
        </button>
      </div>
    </div>
  );
}
