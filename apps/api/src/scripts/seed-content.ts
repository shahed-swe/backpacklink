// Seed default FAQ, blog articles and testimonials on first boot — only when a
// table is empty, so admin edits are never overwritten. Runs from the Docker
// entrypoint after the admin seed.
import { prisma } from '../lib/db.js';

const FAQS = [
  {
    question: 'What is an eSIM?',
    answer:
      'An eSIM is a digital SIM built into your phone. Instead of a plastic card, you install a data plan by scanning a QR code — so you can get online abroad without swapping SIMs or visiting a store.',
  },
  {
    question: 'Will it work on my phone?',
    answer:
      'Most phones from 2018 onward support eSIM — iPhone XS and newer, Google Pixel 3 and newer, and Samsung Galaxy S20 and newer, among others. Your phone also needs to be carrier-unlocked.',
  },
  {
    question: 'How do I install my eSIM?',
    answer:
      'After you buy, your QR code appears instantly in your BackpackLink account. Open your phone’s settings, add a cellular/mobile plan, scan the code, and you’re set — usually in under two minutes.',
  },
  {
    question: 'When does my plan start?',
    answer:
      'Your plan’s validity typically starts when your eSIM first connects to a network in your destination — not when you buy it. So you can set everything up before you fly.',
  },
  {
    question: 'Can I keep my regular number?',
    answer:
      'Yes. Your eSIM runs alongside your normal SIM, so you can keep receiving calls and texts on your usual number while using BackpackLink for data.',
  },
  {
    question: 'What if it doesn’t connect?',
    answer:
      'If a plan can’t be activated due to a technical issue on our side, contact support and we’ll fix it or refund you — that’s our money-back guarantee.',
  },
  {
    question: 'Can I top up when I run low?',
    answer:
      'Yes. If you run low on data, you can add more to the same eSIM in a couple of taps from your account — no need to buy a new one.',
  },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', location: 'Japan trip', quote: 'Landed at Narita, scanned the QR, and had data before I got off the plane. No SIM swapping, no airport queue.' },
  { name: 'David R.', location: 'Europe, 3 countries', quote: 'One plan covered France, Italy and Spain. Cheaper than a single day of my carrier’s roaming. Never going back.' },
  { name: 'Aisha K.', location: 'Thailand', quote: 'Was nervous about eSIMs but the install guide made it dead simple. Speeds were great for maps and video calls home.' },
  { name: 'Marco P.', location: 'USA', quote: 'Bought it the night before my flight. Worked the moment I landed in New York. Support answered in minutes.' },
  { name: 'Lena T.', location: 'UAE', quote: 'Kept my normal number for calls while using BackpackLink for data. Best of both worlds on a two-week trip.' },
  { name: 'James O.', location: 'Indonesia', quote: 'Topped up right from the app when I ran low in Bali. Two taps. The easiest travel data I’ve used.' },
];

const ARTICLES = [
  {
    slug: 'what-is-an-esim',
    title: 'What is an eSIM, and how does it work?',
    excerpt:
      'An eSIM is a digital SIM built into your phone. Here’s what that means, why travelers love it, and how you get online abroad in minutes.',
    emoji: '📲',
    readMins: 4,
    body: `If you’ve ever landed in a new country and scrambled to find a shop selling local SIM cards, an eSIM will feel like magic. It does the same job — gives your phone mobile data — but entirely in software. No plastic card, no paperclip, no swapping.

## The short version

An eSIM (embedded SIM) is a small chip already inside modern phones. Instead of inserting a physical SIM, you install a data plan onto that chip by scanning a QR code. Once installed, your phone connects to a local network just like it would with a normal SIM.

Because it’s digital, you can buy and install a plan before you even leave home — then it activates when you arrive.

## Why travelers switch to eSIMs

No roaming bills: you pay a fixed, prepaid price instead of your home carrier’s per-day roaming rates.

Instant setup: your QR code arrives in seconds, and installation takes about two minutes.

Keep your number: your eSIM runs alongside your normal SIM, so calls and texts still reach you.

## How to get started

Check that your phone supports eSIM (most models from 2018 onward do) and that it’s carrier-unlocked. Then pick a plan for your destination, pay, and scan the QR code from your account.`,
  },
  {
    slug: 'install-your-esim-in-2-minutes',
    title: 'How to install your eSIM in 2 minutes',
    excerpt:
      'A step-by-step guide to installing and activating your travel eSIM on iPhone and Android — so you’re online the second you land.',
    emoji: '⚡',
    readMins: 3,
    body: `Installing an eSIM is quicker than making a coffee. Do it on your home Wi-Fi before you fly, and you’ll step off the plane already connected.

## On iPhone

Open Settings → Cellular (or Mobile Service) → Add eSIM.

Choose “Use QR Code,” then scan the QR code shown in your BackpackLink account.

Follow the prompts to add the plan, and label it “Travel” so it’s easy to find.

## On Android

Open Settings → Network & internet → SIMs → Add eSIM (wording varies by brand).

Tap “Download a SIM instead?” and scan your QR code, then confirm to activate.

## A couple of tips

Install on Wi-Fi before you travel — your plan usually only starts counting once it connects to a network abroad.

Turn on Data Roaming for the travel eSIM. This lets it use the local partner network; it does not mean you’ll be charged roaming fees.`,
  },
  {
    slug: 'esim-vs-roaming-which-is-cheaper',
    title: 'eSIM vs roaming: which is actually cheaper?',
    excerpt:
      'Carrier roaming can quietly cost $10–15 a day. Here’s how a travel eSIM compares, and when each one makes sense.',
    emoji: '💸',
    readMins: 5,
    body: `Your phone will happily roam the moment you land — but that convenience can be expensive. Let’s compare the real costs.

## The cost of roaming

Many carriers charge a flat daily fee to use your home plan abroad — often around $10 to $15 per day. On a two-week trip, that’s $140–$210 before you’ve done anything unusual.

## The cost of a travel eSIM

A travel eSIM is prepaid: you pick an amount of data for your destination and pay once, up front. There’s no daily fee and no bill shock.

## When roaming still makes sense

If you’re away for just a day or two, or your carrier includes free roaming, roaming can be fine. For anything longer — or anywhere you want predictable costs — an eSIM usually wins.`,
  },
];

const now = Date.now();

if ((await prisma.faq.count()) === 0) {
  await prisma.faq.createMany({
    data: FAQS.map((f, i) => ({ ...f, sortOrder: i })),
  });
  console.log(`✅ Seeded ${FAQS.length} FAQs`);
} else {
  console.log('FAQs already present — skipping.');
}

if ((await prisma.testimonial.count()) === 0) {
  await prisma.testimonial.createMany({
    data: TESTIMONIALS.map((t, i) => ({ ...t, sortOrder: i })),
  });
  console.log(`✅ Seeded ${TESTIMONIALS.length} testimonials`);
} else {
  console.log('Testimonials already present — skipping.');
}

if ((await prisma.article.count()) === 0) {
  // Stagger createdAt so newest-first ordering is deterministic.
  for (let i = 0; i < ARTICLES.length; i++) {
    await prisma.article.create({
      data: { ...ARTICLES[i], createdAt: new Date(now - i * 60_000) },
    });
  }
  console.log(`✅ Seeded ${ARTICLES.length} articles`);
} else {
  console.log('Articles already present — skipping.');
}

process.exit(0);
