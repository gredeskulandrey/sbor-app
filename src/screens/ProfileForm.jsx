import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { TOPICS } from '../constants.js';

const currentMaxDobYear = () => new Date().getFullYear() - 18;

export default function ProfileForm({ onSaved }) {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [gender, setGender] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [about, setAbout] = useState('');
  const [photos, setPhotos] = useState(0); // количество "загруженных" фото (0-5) — реальная загрузка файлов будет в следующем куске
  const [topics, setTopics] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleTopic(id) {
    setTopics((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const maxYear = currentMaxDobYear();
  const years = [];
  for (let y = maxYear; y >= maxYear - 80; y--) years.push(y);

  const firstInvalid = submitted && first.trim().length < 2;
  const genderInvalid = submitted && !gender;
  const dobInvalid = submitted && !(dobDay && dobMonth && dobYear);
  const aboutInvalid = submitted && !about.trim();
  const photosInvalid = submitted && photos < 1;
  const topicsInvalid = submitted && (topics.length < 1 || topics.length > 5);

  async function handleSubmit() {
    setSubmitted(true);
    const valid =
      first.trim().length >= 2 && gender && dobDay && dobMonth && dobYear &&
      about.trim() && photos >= 1 && topics.length >= 1 && topics.length <= 5;
    if (!valid) return;

    setSaving(true);
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Сессия потерялась, попробуй войти заново');
      setSaving(false);
      return;
    }

    const birthDate = `${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}`;

    const { error: insertError } = await supabase.from('profiles').insert({
      id: session.user.id,
      first_name: first.trim(),
      last_name: last.trim() || null,
      gender,
      birth_date: birthDate,
      about: about.trim(),
      topics,
    });

    setSaving(false);
    if (insertError) {
      setError('Не получилось сохранить анкету: ' + insertError.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="screen">
      <div className="auth-wrap" style={{ padding: '20px 22px' }}>
        <h1 style={{ fontSize: 22, marginBottom: 18 }}>Расскажи о себе</h1>

        <div className={'field' + (firstInvalid ? ' invalid' : '')}>
          <label>Имя</label>
          <input value={first} onChange={(e) => setFirst(e.target.value)} />
          {firstInvalid && <div className="field-error">Минимум 2 буквы</div>}
        </div>

        <div className="field">
          <label>Фамилия (необязательно)</label>
          <input value={last} onChange={(e) => setLast(e.target.value)} />
        </div>

        <div className={'field' + (genderInvalid ? ' invalid' : '')}>
          <label>Пол</label>
          <div className="chip-row">
            {[['male', 'Мужской'], ['female', 'Женский'], ['any', 'Не важно']].map(([val, lbl]) => (
              <div
                key={val}
                className={'chip' + (gender === val ? ' active' : '')}
                onClick={() => setGender(val)}
              >
                {lbl}
              </div>
            ))}
          </div>
          {genderInvalid && <div className="field-error">Выбери один из вариантов</div>}
        </div>

        <div className={'field' + (dobInvalid ? ' invalid' : '')}>
          <label>Дата рождения (не младше 18 лет)</label>
          <div className="dob-row">
            <select value={dobDay} onChange={(e) => setDobDay(e.target.value)}>
              <option value="">День</option>
              {days.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)}>
              <option value="">Месяц</option>
              {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={dobYear} onChange={(e) => setDobYear(e.target.value)}>
              <option value="">Год</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {dobInvalid && <div className="field-error">Укажи полную дату рождения</div>}
        </div>

        <div className={'field' + (aboutInvalid ? ' invalid' : '')}>
          <label>О себе</label>
          <textarea maxLength={500} value={about} onChange={(e) => setAbout(e.target.value)} />
          {aboutInvalid && <div className="field-error">Обязательное поле</div>}
        </div>

        <div className={'field' + (photosInvalid ? ' invalid' : '')}>
          <label>Фото профиля — минимум 1, максимум 5</label>
          <div className="photo-grid">
            {[0, 1, 2, 3, 4].map((i) => {
              const filled = i < photos;
              return (
                <div
                  key={i}
                  className={'photo-slot' + (filled ? ' filled' : '')}
                  onClick={() => setPhotos(filled ? photos - 1 : Math.min(5, photos + 1))}
                >
                  {filled ? '✓' : '+'}
                </div>
              );
            })}
          </div>
          {photosInvalid && <div className="field-error">Загрузи хотя бы одно фото</div>}
        </div>

        <div className={'field' + (topicsInvalid ? ' invalid' : '')}>
          <label>Какие тематики встреч тебе интересны? (от 1 до 5)</label>
          <div className="chip-row">
            {TOPICS.map((t) => (
              <div
                key={t.id}
                className={'chip' + (topics.includes(t.id) ? ' active' : '')}
                onClick={() => toggleTopic(t.id)}
              >
                {t.ic} {t.label}
              </div>
            ))}
          </div>
          {topicsInvalid && <div className="field-error">Выбери от 1 до 5 тем</div>}
        </div>

        {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}

        <button className="btn btn-primary" disabled={saving} onClick={handleSubmit}>
          {saving ? 'Сохраняем...' : 'Продолжить'}
        </button>
      </div>
    </div>
  );
}
