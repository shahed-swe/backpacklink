// Types + rendering helpers for admin-managed content (blog, FAQ, testimonials).
// The data itself comes from the API (see lib/api.ts) — nothing is hardcoded.

export type ArticleSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  emoji: string;
  coverImageUrl: string | null;
  readMins: number;
  createdAt: string;
};

export type Article = ArticleSummary & { body: string };

export type Faq = { id: string; question: string; answer: string };

export type Testimonial = {
  id: string;
  name: string;
  location: string | null;
  quote: string;
  rating: number;
  imageUrl: string | null;
};

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export type Block = { type: 'h' | 'p'; text: string };

// Parse a stored article body into blocks: blank line = new paragraph, a line
// starting with "## " = a section heading.
export function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      blocks.push({ type: 'p', text: para.join(' ') });
      para = [];
    }
  };
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith('## ')) {
      flush();
      blocks.push({ type: 'h', text: line.slice(3).trim() });
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}
