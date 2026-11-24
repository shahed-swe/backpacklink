export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const cls = 'mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500';
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink/70">
        {label}
        {required && <span className="text-coral-600"> *</span>}
      </span>
      {textarea ? (
        <textarea rows={4} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cls} />
      ) : (
        <input type={type} value={value} placeholder={placeholder} required={required} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </label>
  );
}

export function PayoutSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink/70">Payout method</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 outline-none focus:border-brand-500"
      >
        <option value="paypal">PayPal</option>
        <option value="wise">Wise</option>
        <option value="bank">Bank transfer</option>
        <option value="other">Other</option>
      </select>
    </label>
  );
}
