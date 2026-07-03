'use client';

import { useEffect, useRef, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { apiFetch } from '@/lib/client-api';
import { getSocket } from '@/lib/socket';

interface Msg {
  id: string;
  senderRole: string;
  body: string;
  createdAt: string;
}

export default function SupportPage() {
  return (
    <AuthGate>
      <Chat />
    </AuthGate>
  );
}

function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<{ messages: Msg[] }>('/api/support/thread')
      .then((r) => setMessages(r.messages))
      .catch(() => {})
      .finally(() => setLoading(false));
    const s = getSocket();
    const onMsg = (m: Msg) => setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    s.on('support:message', onMsg);
    return () => {
      s.off('support:message', onMsg);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send() {
    const body = text.trim();
    if (!body) return;
    getSocket().emit('support:send', { body });
    setText('');
  }

  return (
    <div className="container-bp py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-extrabold text-ink">Support</h1>
        <p className="mt-1 text-ink/60">Chat with a real human — we usually reply fast. 💬</p>

        <div className="mt-6 card flex h-[65vh] flex-col">
          <div className="flex-1 space-y-2 overflow-y-auto p-5">
            {loading ? (
              <p className="text-ink/40">Loading…</p>
            ) : messages.length === 0 ? (
              <div className="grid h-full place-items-center text-center text-ink/50">
                <div>
                  <p className="text-4xl">👋</p>
                  <p className="mt-2">Ask us anything about your eSIM — activation, coverage, billing.</p>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderRole === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${
                      m.senderRole === 'customer' ? 'bg-sunset text-white' : 'bg-sand-100 text-ink'
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
          <div className="flex gap-2 border-t border-brand-100 p-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type your message…"
              className="flex-1 rounded-full border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
            <button onClick={send} className="btn-primary px-5">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
