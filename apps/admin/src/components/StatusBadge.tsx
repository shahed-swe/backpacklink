export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-brand-50 text-brand-700',
    paid: 'bg-brand-50 text-brand-700',
    fulfilling: 'bg-sand-100 text-ink/60',
    pending: 'bg-sand-100 text-ink/60',
    failed: 'bg-coral-100 text-coral-700',
    refunded: 'bg-coral-100 text-coral-700',
    abandoned: 'bg-sand-100 text-ink/40',
    approved: 'bg-brand-50 text-brand-700',
    rejected: 'bg-coral-100 text-coral-700',
    void: 'bg-sand-100 text-ink/40',
    payable: 'bg-coral-100 text-coral-700',
  };
  return <span className={`chip ${map[status] ?? 'bg-sand-100 text-ink/60'}`}>{status}</span>;
}
