'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useApi } from '@/lib/use-api';
import { apiFetch } from '@/lib/client-api';
import { getSocket } from '@/lib/socket';

interface Thread {
  id: string;
  user: { email: string; name: string | null } | null;
  status: string;
  unreadByAdmin: number;
  lastMessageAt: string;
  lastMessage: string | null;
}
interface Msg {
  id: string;
  senderRole: string;
  body: string;
  createdAt: string;
}

export default function SupportInbox() {
  const { data, reload } = useApi<{ data: Thread[] }>('/api/admin/support/threads');
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected;

  useEffect(() => {
    const s = getSocket();
    const onUpdate = () => reload();
    const onMsg = (m: Msg) => setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    s.on('support:thread-updated', onUpdate);
    s.on('support:message', onMsg);
    return () => {
      s.off('support:thread-updated', onUpdate);
      s.off('support:message', onMsg);
    };
  }, [reload]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const open = useCallback(
    async (id: string) => {
      setSelected(id);
      const res = await apiFetch<{ messages: Msg[] }>(`/api/admin/support/threads/${id}`);
      setMessages(res.messages);
      getSocket().emit('admin:join', { threadId: id });
      reload();
    },
    [reload],
  );

  function send() {
    const body = text.trim();
    if (!body || !selected) return;
    getSocket().emit('admin:send', { threadId: selected, body });
    setText('');
  }

  const threads = data?.data ?? [];
  const current = threads.find((t) => t.id === selected);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Support inbox</h1>
      <p className="mt-1 text-sm text-ink/50">Live chat with customers — replies are instant.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* thread list */}
        <div className="card max-h-[70vh] overflow-y-auto">
          {threads.length === 0 ? (
            <p className="p-5 text-sm text-ink/50">No conversations yet.</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => open(t.id)}
                className={`flex w-full flex-col items-start gap-1 border-b border-brand-100 p-4 text-left transition ${
                  selected === t.id ? 'bg-brand-50' : 'hover:bg-sand-50'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-ink">{t.user?.name ?? t.user?.email ?? 'Customer'}</span>
                  {t.unreadByAdmin > 0 && (
                    <span className="rounded-full bg-coral-500 px-2 py-0.5 text-xs font-bold text-white">
                      {t.unreadByAdmin}
                    </span>
                  )}
                </div>
                <span className="line-clamp-1 text-xs text-ink/50">{t.lastMessage ?? '—'}</span>
              </button>
            ))
          )}
        </div>

        {/* conversation */}
        <div className="card flex h-[70vh] flex-col">
          {!current ? (
            <div className="grid flex-1 place-items-center text-ink/40">Select a conversation</div>
          ) : (
            <>
              <div className="border-b border-brand-100 p-4">
                <p className="font-bold text-ink">{current.user?.name ?? current.user?.email}</p>
                <p className="text-xs text-ink/40">{current.user?.email}</p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        m.senderRole === 'admin' ? 'bg-lagoon text-white' : 'bg-sand-100 text-ink'
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="flex gap-2 border-t border-brand-100 p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Type a reply…"
                  className="flex-1 rounded-full border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <button onClick={send} className="btn-primary px-5">
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
