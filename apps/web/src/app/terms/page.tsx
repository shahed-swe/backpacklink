import Link from 'next/link';
import { Legal, Section, List } from '@/components/Legal';

export const metadata = {
  title: 'Terms & Conditions — BackpackLink',
  description: 'The terms that govern your use of BackpackLink and the eSIM data plans you buy from us.',
};

export default function TermsPage() {
  return (
    <Legal
      title="Terms & Conditions"
      updated="July 2026"
      intro={
        <>
          These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of
          BackpackLink and the eSIM data plans you purchase through it. By creating an account or
          placing an order, you agree to these Terms. Please read them carefully.
        </>
      }
    >
      <Section title="1. About the service">
        <p>
          BackpackLink sells prepaid eSIM data plans that let you get online in 200+ countries. We
          act as a reseller of connectivity provided by our upstream mobile network partners. We are
          not a mobile network operator ourselves, and coverage, speeds, and availability depend on
          those partners and the local networks in your destination.
        </p>
      </Section>

      <Section title="2. Eligibility & your account">
        <List
          items={[
            'You must be at least 18 years old (or have the consent of a parent or guardian) to buy a plan.',
            'You are responsible for keeping your account details and password confidential and for all activity under your account.',
            'You agree to provide accurate information and to keep your email address up to date so we can deliver your eSIM and receipts.',
            'Your device must be eSIM-capable and carrier-unlocked. It is your responsibility to confirm this before purchasing.',
          ]}
        />
      </Section>

      <Section title="3. Orders, pricing & payment">
        <p>
          Prices are shown at checkout and are charged in the currency displayed. Payment is
          processed securely by our payment provider; we do not store your full card details. An
          order is confirmed once payment is authorised, at which point your eSIM is issued.
        </p>
        <p>
          Any coupon or discount code is subject to its own conditions (validity window, minimum
          spend, and usage limits) and may be withdrawn at any time.
        </p>
      </Section>

      <Section title="4. eSIM delivery & activation">
        <List
          items={[
            'Your eSIM QR code is delivered to your account and by email, usually within seconds of a successful payment.',
            'A plan’s validity period starts according to the terms of that specific plan — often on first network connection in the destination. Check the plan details before you travel.',
            'Each eSIM QR code is intended for a single installation. Deleting the eSIM from your device may prevent reinstallation.',
          ]}
        />
      </Section>

      <Section title="5. Cancellations & refunds">
        <p>
          Because eSIM plans are digital goods delivered instantly, an eSIM is generally
          non-refundable once its QR code has been issued or installed. If a plan cannot be
          activated due to a technical fault on our side, contact us and we will investigate and,
          where appropriate, issue a replacement or refund. Nothing here limits rights you may have
          under applicable consumer law.
        </p>
      </Section>

      <Section title="6. Acceptable use">
        <p>You agree not to use the service or any eSIM to:</p>
        <List
          items={[
            'break any law, or send spam, malware, or other harmful content;',
            'resell, sublicense, or commercially redistribute a plan unless you have a written reseller agreement with us;',
            'interfere with, overload, or attempt to gain unauthorised access to our systems or networks.',
          ]}
        />
      </Section>

      <Section title="7. Coverage & network availability">
        <p>
          Coverage maps, speeds (including references to 4G/5G), and data allowances are indicative
          and provided by our network partners. Actual performance varies by location, device,
          congestion, and local operator policy. We cannot guarantee uninterrupted service in every
          area of a country or region.
        </p>
      </Section>

      <Section title="8. Disclaimers & liability">
        <p>
          The service is provided &ldquo;as is.&rdquo; To the fullest extent permitted by law, we
          are not liable for indirect or consequential losses, or for loss of data, profit, or
          opportunity arising from network unavailability. Our total liability for any claim
          relating to an order is limited to the amount you paid for that order.
        </p>
      </Section>

      <Section title="9. Changes to these Terms">
        <p>
          We may update these Terms from time to time. The &ldquo;last updated&rdquo; date above
          reflects the current version. Continued use of the service after changes take effect means
          you accept the revised Terms.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          Questions about these Terms? Reach us through the{' '}
          <Link href="/support" className="font-semibold text-brand-700 hover:underline">
            support page
          </Link>
          . See also our{' '}
          <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/password-policy" className="font-semibold text-brand-700 hover:underline">
            Password Policy
          </Link>
          .
        </p>
      </Section>
    </Legal>
  );
}
