import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';

import Splash from './screens/Splash.jsx';
import AuthChoice from './screens/AuthChoice.jsx';
import EmailInput from './screens/EmailInput.jsx';
import PhoneInput from './screens/PhoneInput.jsx';
import VerifyCode from './screens/VerifyCode.jsx';
import ProfileForm from './screens/ProfileForm.jsx';
import AppShell from './screens/AppShell.jsx';

export default function App() {
  // screen — какой экран сейчас показываем. Это ровно та же идея,
  // что и в первом HTML-макете (state.screen), просто теперь на React.
  const [screen, setScreen] = useState('loading');

  // Общие данные, которые нужны сразу нескольким экранам входа
  const [authMethod, setAuthMethod] = useState(null);   // 'email' | 'phone'
  const [emailValue, setEmailValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('+');
  const [phoneRequestId, setPhoneRequestId] = useState(null);

  // При запуске приложения проверяем: пользователь уже вошёл раньше?
  useEffect(() => {
    checkExistingSession();

    // Если пользователь перешёл по ссылке подтверждения телефона (magic link),
    // Supabase сам разберёт токен из адресной строки — просто ждём и перепроверяем.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkExistingSession();
      }
    });
    return () => authListener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkExistingSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setScreen((s) => (s === 'loading' ? 'splash' : s));
      return;
    }
    // Сессия есть — проверяем, заполнена ли анкета (таблица profiles)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profile) {
      setScreen('welcome');
    } else {
      setScreen('profileForm');
    }
  }

  function renderScreen() {
    switch (screen) {
      case 'loading':
        return <div className="center-msg">Загрузка...</div>;
      case 'splash':
        return <Splash onNext={() => setScreen('authChoice')} />;
      case 'authChoice':
        return (
          <AuthChoice
            onEmail={() => { setAuthMethod('email'); setScreen('emailInput'); }}
            onPhone={() => { setAuthMethod('phone'); setScreen('phoneInput'); }}
          />
        );
      case 'emailInput':
        return (
          <EmailInput
            value={emailValue}
            onChange={setEmailValue}
            onBack={() => setScreen('authChoice')}
            onSent={() => setScreen('verifyCode')}
          />
        );
      case 'phoneInput':
        return (
          <PhoneInput
            value={phoneValue}
            onChange={setPhoneValue}
            onBack={() => setScreen('authChoice')}
            onSent={(requestId) => { setPhoneRequestId(requestId); setScreen('verifyCode'); }}
          />
        );
      case 'verifyCode':
        return (
          <VerifyCode
            authMethod={authMethod}
            email={emailValue}
            phone={phoneValue}
            requestId={phoneRequestId}
            onBack={() => setScreen(authMethod === 'email' ? 'emailInput' : 'phoneInput')}
            onVerified={(hasProfile) => setScreen(hasProfile ? 'welcome' : 'profileForm')}
          />
        );
      case 'profileForm':
        return <ProfileForm onSaved={() => setScreen('welcome')} />;
      case 'welcome':
        return <AppShell onSignOut={() => setScreen('splash')} />;
      default:
        return null;
    }
  }

  return <div className="phone">{renderScreen()}</div>;
}
