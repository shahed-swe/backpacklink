import Link from 'next/link';
import { Legal, Section, List } from '@/components/Legal';

export const metadata = {
  title: 'Privacy Policy — BackpackLink',
  description: 'How BackpackLink collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <Legal
      title="Privacy Policy"
      updated="July 2026"
      intro={
        <>
          This Privacy Policy explains what information BackpackLink collects, how we use it, and the
          choices you have. We keep data collection to what we need to sell you an eSIM and support
          your account.
        </>
      }
    >
      <Section title="1. Information we collect">
        <List
          items={[
            'Account information — your name and email address, and a securely hashed version of your password.',
            'Order information — the plans you buy, your order history, and delivery details for your eSIM.',
            'Payment information — handled by our payment provider. We receive confirmation of payment but do not store your full card number.',
            'Usage information — basic technical data such as your device type and interactions with the site or app, used to keep the service working and secure.',
          ]}
        />
      </Section>

      <Section title="2. How we use your information">
        <List
          items={[
            'to create and manage your account and deliver the eSIMs you purchase;',
            'to send order confirmations, QR codes, and important service messages;',
            'to provide customer support and respond to your enquiries;',
            'to prevent fraud and abuse and to keep the service secure;',
            'to improve our products and, where you have opted in, to send occasional offers.',
          ]}
        />
      </Section>

      <Section title="3. Who we share it with">
        <p>We share the minimum necessary with trusted providers who help us run the service:</p>
        <List
          items={[
            'our eSIM/connectivity partners, to provision and activate your plan;',
            'our payment processor, to take payment securely;',
            'infrastructure and email providers that host our systems and deliver your receipts.',
          ]}
        />
        <p>
          We do not sell your personal information. We may disclose data if required by law or to
          protect our rights and users.
        </p>
      </Section>

      <Section title="4. Cookies & local storage">
        <p>
          We use cookies and similar local storage to keep you signed in, remember your preferences,
          and understand how the service is used. You can control cookies through your browser
          settings, though some features may not work without them.
        </p>
      </Section>

      <Section title="5. How we protect your data">
        <p>
          We use encryption in transit (HTTPS), store passwords only as salted hashes (never in
          plain text), and restrict access to personal data to those who need it. See our{' '}
          <Link href="/password-policy" className="font-semibold text-brand-700 hover:underline">
            Password Policy
          </Link>{' '}
          for how account credentials are handled.
        </p>
      </Section>

      <Section title="6. Data retention">
        <p>
          We keep your account and order records for as long as your account is active and as needed
          to meet legal, tax, and accounting obligations. You can ask us to close your account and
          delete data we are not required to retain.
        </p>
      </Section>

      <Section title="7. Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, export, or delete
          your personal information, and to object to certain processing. To exercise these rights,
          contact us and we will respond within a reasonable time.
        </p>
      </Section>

      <Section title="8. Children">
        <p>
          BackpackLink is not directed to children under 18, and we do not knowingly collect their
          personal information.
        </p>
      </Section>

      <Section title="9. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. The &ldquo;last updated&rdquo; date
          above reflects the current version.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          To ask about your data or this policy, reach us through the{' '}
          <Link href="/support" className="font-semibold text-brand-700 hover:underline">
            support page
          </Link>
          .
        </p>
      </Section>
    </Legal>
  );
}
