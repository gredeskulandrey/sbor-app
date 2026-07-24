import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';

const TIERS = {
  base: { name: 'Base', price: null, priceLabel: 'бесплатно' },
  pro: { name: 'Pro', price: 299, suffix: '₽/мес' },
  proyear: { name: 'Ultimate', price: 2500, suffix: '₽/год' },
};

const FEATURE_MATRIX = [
  {
    labelPerTier: {
      base: '2 встречи как гость и 2 как организатор в месяц',
      pro: 'Безлимитные встречи как гость и как организатор',
      proyear: 'Безлимитные встречи как гость и как организатор',
    },
    base: '✓', pro: '✓', proyear: '✓',
  },
  { label: 'Фильтры тем на карте', base: '✕', pro: '✓', proyear: '✓' },
  { label: 'Без рекламы', base: '✕', pro: '✓', proyear: '✓' },
  { label: 'Приоритет в поиске', base: '✕', pro: '✓', proyear: '✓' },
  { label: 'Доп. фильтры участников при создании встречи', base: '✕', pro: '✕', proyear: '✓' },
];

function discountPercent(planId, promoApplied) {
  if (!promoApplied) return 0;
  if (planId === 'pro') return 10;
  if (planId === 'proyear') return 5;
  return 0;
}

export default function SubscriptionFlow({ profile, onBack, onSubscriptionUpdated }) {
  const [step, setStep] = useState('paywall'); // paywall | paymentMethod | processing | success
  const [selectedPlan, setSelectedPlan] = useState(profile.subscription_tier === 'base' ? 'pro' : profile.subscription_tier);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null); // card | sbp
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holder, setHolder] = useState('');
  const [formError, setFormError] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState(null);

  function applyPromo() {
    if (promoCode.trim().toLowerCase() === 'firstpromo') {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoApplied(false);
      setPromoError('Неверный промокод');
    }
  }

  function formatCardNumber(raw) {
    return (raw || '').replace(/(.{4})/g, '$1 ').trim();
  }

  function handleCardNumberChange(v) {
    const digits = v.replace(/[^0-9]/g, '').slice(0, 16);
    setCardNumber(digits);
  }

  function handleExpiryChange(v) {
    const digits = v.replace(/[^0-9]/g, '').slice(0, 4);
    let out = digits.slice(0, 2);
    if (digits.length > 2) out += '/' + digits.slice(2, 4);
    setExpiry(out);
  }

  async function handlePay() {
    if (selectedPlan !== 'base') {
      if (!paymentMethod) { setFormError('Выбери способ оплаты'); return; }
      if (paymentMethod === 'card') {
        if (cardNumber.length !== 16) { setFormError('Номер карты должен быть из 16 цифр'); return; }
        if (expiry.length !== 5) { setFormError('Укажи срок действия карты'); return; }
        if (cvv.length !== 3) { setFormError('CVV — 3 цифры'); return; }
        if (!/^[A-Za-z\s]+$/.test(holder.trim()) || !holder.trim()) { setFormError('Имя держателя — латиницей'); return; }
      }
    }
    setFormError('');
    setStep('processing');

    const expiresAt = new Date();
    if (selectedPlan === 'pro') expiresAt.setDate(expiresAt.getDate() + 30);
    if (selectedPlan === 'proyear') expiresAt.setDate(expiresAt.getDate() + 365);

    setTimeout(async () => {
      await supabase.from('profiles').update({
        subscription_tier: selectedPlan,
        subscription_expires_at: selectedPlan === 'base' ? null : expiresAt.toISOString(),
      }).eq('id', profile.id);
      setNewExpiryDate(expiresAt);
      onSubscriptionUpdated(selectedPlan, selectedPlan === 'base' ? null : expiresAt.toISOString());
      setStep('success');
    }, 2000);
  }

  if (step === 'processing') {
    return (
      <div className="center-msg">
        <div className="loading-gear" style={{ fontSize: 30 }}>⚙️</div>
        <p>Обрабатываем платёж...</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="center-msg">
        <div style={{ fontSize: 40, marginBottom: 14 }}>🎉</div>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Подписка «{TIERS[selectedPlan].name}» подключена</h2>
        {newExpiryDate && (
          <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 20 }}>
            Действует до {newExpiryDate.toLocaleDateString('ru-RU')}
          </p>
        )}
        <button className="btn btn-primary" onClick={onBack}>Готово</button>
      </div>
    );
  }

  if (step === 'paymentMethod') {
    return (
      <div className="screen">
        <div className="auth-wrap" style={{ padding: '16px 20px' }}>
          <div className="backbtn" onClick={() => setStep('paywall')}>←</div>
          <h2 style={{ fontSize: 17, marginBottom: 16 }}>Способ оплаты</h2>

          <div className="chip-row" style={{ marginBottom: 16 }}>
            <div className={'chip' + (paymentMethod === 'card' ? ' active' : '')} onClick={() => setPaymentMethod('card')}>💳 Банковская карта</div>
            <div className={'chip' + (paymentMethod === 'sbp' ? ' active' : '')} onClick={() => setPaymentMethod('sbp')}>📱 СБП</div>
          </div>

          {paymentMethod === 'card' && (
            <>
              <div className="field">
                <label>Номер карты (16 цифр)</label>
                <input
                  value={formatCardNumber(cardNumber)}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Срок действия</label>
                  <input value={expiry} onChange={(e) => handleExpiryChange(e.target.value)} inputMode="numeric" placeholder="ММ/ГГ" />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>CVV</label>
                  <input
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                    inputMode="numeric"
                    placeholder="000"
                  />
                </div>
              </div>
              <div className="field">
                <label>Держатель карты</label>
                <input
                  value={holder}
                  onChange={(e) => setHolder(e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase())}
                  placeholder="IVAN IVANOV"
                />
              </div>
            </>
          )}

          {paymentMethod === 'sbp' && (
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
              После нажатия «Оплатить» откроется приложение твоего банка для подтверждения перевода.
            </p>
          )}

          <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 14, lineHeight: 1.5 }}>
            Платёж защищён — данные карты не сохраняются на наших серверах.
          </p>

          {formError && <div className="field-error" style={{ marginBottom: 12 }}>{formError}</div>}

          <button className="btn btn-primary" onClick={handlePay}>Оплатить</button>
        </div>
      </div>
    );
  }

  // step === 'paywall'
  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px' }}>
        <div className="backbtn" onClick={onBack}>←</div>
        <h2 style={{ fontSize: 19, marginBottom: 6 }}>Ещё больше событий с подпиской</h2>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20, lineHeight: 1.5 }}>
          Управляй своей подпиской: оформи <b style={{ color: 'var(--text)' }}>Pro</b> или <b style={{ color: 'var(--text)' }}>Ultimate</b> — больше возможностей и никакой рекламы.
        </p>

        {Object.entries(TIERS).map(([id, t]) => {
          const isCurrent = profile.subscription_tier === id;
          const discount = discountPercent(id, promoApplied);
          return (
            <div
              key={id}
              onClick={() => setSelectedPlan(id)}
              style={{
                background: 'var(--card)', border: selectedPlan === id ? '2px solid var(--coral)' : '1px solid var(--stroke)',
                borderRadius: 16, padding: 16, marginBottom: 12, cursor: 'pointer', position: 'relative',
              }}
            >
              {id === 'pro' && <div style={{ position: 'absolute', top: -10, right: 16, background: 'var(--coral)', color: '#1a0d09', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8 }}>Популярно</div>}
              {id === 'proyear' && <div style={{ position: 'absolute', top: -10, right: 16, background: 'var(--gold)', color: '#1a0d09', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8 }}>Выгодно</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</span>
                <span style={{ fontFamily: "'Unbounded'", fontSize: 15 }}>
                  {t.priceLabel || (
                    discount > 0 ? (
                      <>
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-faint)', fontSize: 12, marginRight: 6 }}>{t.price} {t.suffix}</span>
                        {Math.round(t.price * (1 - discount / 100))} {t.suffix}
                      </>
                    ) : `${t.price} ${t.suffix}`
                  )}
                </span>
              </div>
              {isCurrent && <div style={{ color: 'var(--mint)', fontSize: 11, marginBottom: 8 }}>✓ Уже подключено у тебя</div>}
              <ul style={{ listStyle: 'none' }}>
                {FEATURE_MATRIX.map((f, i) => {
                  const val = f[id];
                  const label = f.labelPerTier ? f.labelPerTier[id] : f.label;
                  return (
                    <li key={i} style={{ fontSize: 12.5, color: val === '✕' ? 'var(--text-faint)' : 'var(--text-dim)', marginBottom: 4 }}>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", marginRight: 6 }}>{val}</span>{label}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        <div className="field" style={{ marginTop: 4 }}>
          <label>Промокод</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Есть промокод?" style={{ flex: 1 }} />
            <button className="btn btn-ghost" style={{ width: 'auto', padding: '0 16px' }} onClick={applyPromo}>Применить</button>
          </div>
          {promoApplied && <div style={{ color: 'var(--mint)', fontSize: 11, marginTop: 5 }}>Промокод применён</div>}
          {promoError && <div className="field-error">{promoError}</div>}
        </div>

        <button
          className="btn btn-primary"
          style={{ marginTop: 10 }}
          onClick={() => {
            if (selectedPlan === profile.subscription_tier) { onBack(); return; }
            if (selectedPlan === 'base') { handlePay(); return; }
            setStep('paymentMethod');
          }}
        >
          {selectedPlan === profile.subscription_tier ? 'Уже подключено' : selectedPlan === 'base' ? 'Перейти на Base' : 'Оформить подписку'}
        </button>
      </div>
    </div>
  );
}
