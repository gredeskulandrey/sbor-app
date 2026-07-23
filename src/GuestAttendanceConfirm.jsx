import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { formatEventDate, formatEventTime } from '../formatDateTime.js';

export default function GuestAttendanceConfirm({ event, onDone }) {
  const [busy, setBusy] = useState(false);

  async function answer(attended) {
    setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session.user.id;

    await supabase
      .from('event_attendees')
      .update({ guest_confirmed_attended: attended })
      .eq('event_id', event.id)
      .eq('user_id', userId);

    // Если организатор уже подвёл итоги и оба сошлись во мнении, что гость пришёл —
    // сразу засчитываем это в личный журнал статистики (иначе — просто ждём, кто ответит вторым)
    if (event.attendance_confirmed && attended) {
      const { data: myRow } = await supabase
        .from('event_attendees')
        .select('attended')
        .eq('event_id', event.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (myRow?.attended === true) {
        const { data: existing } = await supabase
          .from('completed_meetings')
          .select('id')
          .eq('event_id', event.id)
          .eq('user_id', userId)
          .eq('role', 'guest')
          .maybeSingle();

        if (!existing) {
          const eventHour = event.event_time ? Number(event.event_time.split(':')[0]) : 0;
          await supabase.from('completed_meetings').insert({
            user_id: userId,
            event_id: event.id,
            category: event.category,
            city: event.city,
            role: 'guest',
            was_late: eventHour >= 21,
          });
        }
      }
    }

    setBusy(false);
    onDone();
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--ink)', border: '1px solid var(--stroke)', borderRadius: 18, padding: 20, maxWidth: 320 }}>
        <h3 style={{ fontSize: 17, marginBottom: 10 }}>Встреча состоялась?</h3>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 18 }}>
          «{event.title}» была назначена на {formatEventDate(event.event_date)}, {formatEventTime(event.event_time)} — эта дата уже прошла. Ты был(а) на этой встрече?
        </p>
        <button className="btn btn-primary" style={{ marginBottom: 10 }} disabled={busy} onClick={() => answer(true)}>Да, я был(а)</button>
        <button className="btn btn-ghost" disabled={busy} onClick={() => answer(false)}>Нет, я не пришёл(шла)</button>
      </div>
    </div>
  );
}
