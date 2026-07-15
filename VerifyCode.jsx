import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function VerifyCode({ authMethod, email, phone, requestId, onBack, onVerified }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (code.length !== 6) {
      setError('Введи все 6 цифр кода');
      return;
    }
    setError('');
    setLoading(true);

    if (authMethod === 'email') {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });
      setLoading(false);
      if (verifyError || !data.session) {
        setError('Неверный код, попробуй ещё раз');
        return;
      }
      const hasProfile = await checkProfileExists(data.session.user.id);
      onVerified(hasProfile);
    } else {
      // Телефон: проверяем код через Telegram Gateway, а затем переходим по
      // ссылке, которую нам вернула наша функция — она и оформит настоящий вход.
      const { data, error: fnError } = await supabase.functions.invoke('verify-phone-code', {
        body: { request_id: requestId, code, phone_number: phone },
      });
      setLoading(false);
      if (fnError || !data?.action_link) {
        setError('Неверный код, попробуй ещё раз');
        return;
      }
      window.location.href = data.action_link;
    }
  }

  async function checkProfileExists(userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    return !!profile;
  }

  return (
    <div className="screen">
      <div className="auth-wrap">
        <div className="backbtn" onClick={onBack}>←</div>
        <div className="auth-hero">
          <h1>Введи код</h1>
          <p>Мы отправили 6-значный код {authMethod === 'email' ? 'на почту' : 'в Telegram'}</p>
        </div>
        <div className={'field' + (error ? ' invalid' : '')}>
          <label>Код подтверждения</label>
          <input
            type="text"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            style={{ letterSpacing: 5, fontSize: 19, textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace" }}
          />
          {error && <div className="field-error">{error}</div>}
        </div>
        <button className="btn btn-primary" disabled={loading} onClick={handleSubmit}>
          {loading ? 'Проверяем...' : 'Подтвердить'}
        </button>
      </div>
    </div>
  );
}
