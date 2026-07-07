import Link from 'next/link';
import { Legal, Section, List } from '@/components/Legal';

export const metadata = {
  title: 'Password Policy — BackpackLink',
  description: 'The password requirements and account-security practices for your BackpackLink account.',
};

export default function PasswordPolicyPage() {
  return (
    <Legal
      title="Password Policy"
      updated="July 2026"
      intro={
        <>
          Your BackpackLink account holds your eSIMs, order history, and receipts, so keeping it
          secure matters. This policy explains the password rules we enforce, how we store your
          password, and how you can protect your account.
        </>
      }
    >
      <Section title="1. Password requirements">
        <p>When you create or change a password, it must:</p>
        <List
          items={[
            'be at least 6 characters long (we recommend 12 or more);',
            'be unique to BackpackLink — don’t reuse a password from another site;',
            'avoid obvious choices such as your email, name, or “password123”.',
          ]}
        />
        <p>
          For a stronger password, mix upper- and lower-case letters, numbers, and symbols, or use a
          passphrase of several random words.
        </p>
      </Section>

      <Section title="2. How we store your password">
        <p>
          We never store your password in plain text. Passwords are hashed with the industry-standard{' '}
          <span className="font-semibold">bcrypt</span> algorithm (with a per-password salt) before
          being saved, so even we cannot read your original password. When you sign in, we compare
          hashes — the raw password is never kept.
        </p>
      </Section>

      <Section title="3. Your responsibilities">
        <List
          items={[
            'Keep your password confidential and don’t share your account.',
            'Use a different password here than on your email or bank accounts.',
            'Sign out on shared or public devices.',
            'Tell us right away if you think someone else has accessed your account.',
          ]}
        />
      </Section>

      <Section title="4. Resetting or changing your password">
        <p>
          You can change your password at any time from your account settings. If you’ve forgotten
          it, use the sign-in page to request a reset. For your security, reset links are
          time-limited, and we’ll never ask for your password by email or chat.
        </p>
      </Section>

      <Section title="5. Extra account security tips">
        <List
          items={[
            'Prefer a reputable password manager to generate and store unique passwords.',
            'Watch out for phishing — always check you’re on the real BackpackLink site before entering credentials.',
            'Keep your device and email account secure, since they can be used to reset your password.',
          ]}
        />
      </Section>

      <Section title="6. Reporting a security concern">
        <p>
          If you notice suspicious activity or a possible vulnerability, please contact us through
          the{' '}
          <Link href="/support" className="font-semibold text-brand-700 hover:underline">
            support page
          </Link>{' '}
          so we can act quickly. See also our{' '}
          <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="font-semibold text-brand-700 hover:underline">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </Section>
    </Legal>
  );
}
