'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useApi } from '@/lib/use-api';
import { apiFetch } from '@/lib/client-api';
import { getSocket } from '@/lib/socket';

interface Thread {
  id: string;
  user: { email: string; name: string | null } | null;
  status: string;
  starred: boolean;
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

type Filter = 'all' | 'open' | 'resolved' | 'starred';

export default function SupportInbox() {
  const { data, reload } = useApi<{ data: Thread[] }>('/api/admin/support/threads');
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
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

  const patchThread = useCallback(
    async (id: string, patch: { status?: string; starred?: boolean }) => {
      await apiFetch(`/api/admin/support/threads/${id}`, { method: 'PATCH', body: patch });
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
  const openCount = threads.filter((t) => t.status !== 'resolved').length;
  const starredCount = threads.filter((t) => t.starred).length;
  const filtered = threads.filter((t) =>
    filter === 'all'
      ? true
      : filter === 'open'
        ? t.status !== 'resolved'
        : filter === 'resolved'
          ? t.status === 'resolved'
          : t.starred,
  );
  const current = threads.find((t) => t.id === selected);

  const TABS: [Filter, string][] = [
    ['all', 'All'],
    ['open', openCount ? `Open (${openCount})` : 'Open'],
    ['resolved', 'Completed'],
    ['starred', starredCount ? `Starred (${starredCount})` : 'Starred'],
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Support inbox</h1>
      <p className="mt-1 text-sm text-ink/50">Live chat with customers — replies are instant.</p>

      <div className="mt-4 flex flex-wrap gap-1">
        {TABS.map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              filter === f ? 'bg-lagoon text-white' : 'text-ink/50 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* thread list */}
        <div className="card max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-5 text-sm text-ink/50">No conversations here.</p>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => open(t.id)}
                className={`flex w-full cursor-pointer flex-col items-start gap-1 border-b border-brand-100 p-4 text-left transition ${
                  selected === t.id ? 'bg-brand-50' : 'hover:bg-sand-50'
                } ${t.status === 'resolved' ? 'opacity-70' : ''}`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        patchThread(t.id, { starred: !t.starred });
                      }}
                      className="shrink-0 text-base leading-none"
                      title={t.starred ? 'Unstar' : 'Star'}
                    >
                      {t.starred ? '⭐' : '☆'}
                    </button>
                    <span className="truncate font-semibold text-ink">
                      {t.user?.name ?? t.user?.email ?? 'Customer'}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {t.status === 'resolved' && (
                      <span className="chip bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700">Done</span>
                    )}
                    {t.unreadByAdmin > 0 && (
                      <span className="rounded-full bg-coral-500 px-2 py-0.5 text-xs font-bold text-white">
                        {t.unreadByAdmin}
                      </span>
                    )}
                  </div>
                </div>
                <span className="line-clamp-1 text-xs text-ink/50">{t.lastMessage ?? '—'}</span>
              </div>
            ))
          )}
        </div>

        {/* conversation */}
        <div className="card flex h-[70vh] flex-col">
          {!current ? (
            <div className="grid flex-1 place-items-center text-ink/40">Select a conversation</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-brand-100 p-4">
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{current.user?.name ?? current.user?.email}</p>
                  <p className="truncate text-xs text-ink/40">{current.user?.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => patchThread(current.id, { starred: !current.starred })}
                    className="text-xl leading-none"
                    title={current.starred ? 'Unstar' : 'Star'}
                  >
                    {current.starred ? '⭐' : '☆'}
                  </button>
                  {current.status === 'resolved' ? (
                    <button onClick={() => patchThread(current.id, { status: 'open' })} className="btn-ghost px-4 py-2 text-sm">
                      Reopen
                    </button>
                  ) : (
                    <button onClick={() => patchThread(current.id, { status: 'resolved' })} className="btn-primary px-4 py-2 text-sm">
                      Mark completed
                    </button>
                  )}
                </div>
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
