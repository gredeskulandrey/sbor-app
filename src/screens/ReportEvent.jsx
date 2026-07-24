import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';

const REASONS = [
  'Мошенничество или подозрительные условия (просят деньги и т.д.)',
  'Оскорбительное или дискриминационное содержание',
  'Похоже на спам или рекламу',
  'Организатор не выходит на связь',
  'Встреча кажется небезопасной',
  'Недостоверная информация о встрече',
];

export default function ReportEvent({ eventId, onBack }) {
  const [reason, setReason] = useState(null);
  const [otherText, setOtherText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = reason && (reason !== 'other' || otherText.trim().length > 0);

  async function handleSubmit() {
    if (!canSubmit) {
      setError('Выбери причину жалобы' + (reason === 'other' ? ' и опиши её' : ''));
      return;
    }
    setSubmitting(true);
    setError('');
    const { data: { session } } = await supabase.auth.getSession();

    const { data: existing } = await supabase
      .from('event_reports')
      .select('id')
      .eq('reporter_id', session.user.id)
      .eq('event_id', eventId)
      .maybeSingle();
    if (existing) {
      setSubmitting(false);
      setError('Ты уже отправлял(а) жалобу на эту встречу — повторно отправить нельзя.');
      return;
    }

    const { error: insertError } = await supabase.from('event_reports').insert({
      reporter_id: session.user.id,
      event_id: eventId,
      reason: reason === 'other' ? 'Другое' : reason,
      other_text: reason === 'other' ? otherText.trim() : null,
    });

    setSubmitting(false);
    if (insertError) {
      setError('Не получилось отправить жалобу: ' + insertError.message);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="center-msg">
        <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Жалоба отправлена</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 20 }}>Ваша жалоба отправлена, рассмотрим её в ближайшее время.</p>
        <button className="btn btn-primary" onClick={onBack}>Готово</button>
      </div>
    );
  }

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div className="auth-wrap" style={{ padding: '16px 20px' }}>
        <div className="backbtn" onClick={onBack}>←</div>
        <h2 style={{ fontSize: 18, marginBottom: 6 }}>Пожаловаться на встречу</h2>
        <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 16 }}>Выбери, что не так — это поможет нам разобраться быстрее.</p>

        {REASONS.map((r) => (
          <div key={r} className={'chip' + (reason === r ? ' active' : '')} style={{ display: 'block', marginBottom: 8 }} onClick={() => setReason(r)}>
            {r}
          </div>
        ))}
        <div className={'chip' + (reason === 'other' ? ' active' : '')} style={{ display: 'block', marginBottom: 8 }} onClick={() => setReason('other')}>
          Другое
        </div>

        {reason === 'other' && (
          <div className="field" style={{ marginTop: 10 }}>
            <label>Опиши, что не так</label>
            <textarea value={otherText} onChange={(e) => setOtherText(e.target.value)} placeholder="Расскажи подробнее" />
          </div>
        )}

        {error && <div className="field-error" style={{ marginTop: 10, marginBottom: 4 }}>{error}</div>}

        <button className="btn btn-primary" style={{ marginTop: 16 }} disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Отправляем...' : 'Отправить жалобу'}
        </button>
      </div>
    </div>
  );
}
