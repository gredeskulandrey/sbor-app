import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function EmailInput({ value, onChange, onBack, onSent }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const v = value.trim();
    const formatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (!formatValid) {
      setError('Введи корректный email (например, name@mail.ru)');
      return;
    }
    const domain = (v.split('@')[1] || '').split('.')[0] || '';
    if (/sbor$/i.test(domain)) {
      setError('Такой email-домен недоступен для регистрации');
      return;
    }
    setError('');
    setLoading(true);
    // Настоящая отправка одноразового кода на почту через Supabase
    const { error: sendError } = await supabase.auth.signInWithOtp({ email: v });
    setLoading(false);
    if (sendError) {
      setError('Не получилось отправить код: ' + sendError.message);
      return;
    }
    onSent();
  }

  return (
    <div className="screen">
      <div className="auth-wrap">
        <div className="backbtn" onClick={onBack}>←</div>
        <div className="auth-hero">
          <h1>Вход по email</h1>
          <p>Введи email — пришлём одноразовый код подтверждения</p>
        </div>
        <div className={'field' + (error ? ' invalid' : '')}>
          <label>Email</label>
          <input
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="you@mail.com"
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
