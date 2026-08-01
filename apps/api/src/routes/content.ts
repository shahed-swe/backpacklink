import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { asyncHandler } from '../middleware/error.js';

// Public, read-only content for the storefront. Everything here is admin-managed
// (see admin-content.ts) — content is data, not code.
export const contentRouter = Router();

// GET /api/faqs — active FAQs, in display order.
contentRouter.get(
  '/faqs',
  asyncHandler(async (_req, res) => {
    const faqs = await prisma.faq.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, question: true, answer: true },
    });
    res.json({ ok: true, data: faqs });
  }),
);

// GET /api/articles — published articles, newest first (no body — list view).
contentRouter.get(
  '/articles',
  asyncHandler(async (_req, res) => {
    const articles = await prisma.article.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        emoji: true,
        coverImageUrl: true,
        readMins: true,
        createdAt: true,
      },
    });
    res.json({ ok: true, data: articles });
  }),
);

// GET /api/articles/:slug — one published article (with body).
contentRouter.get(
  '/articles/:slug',
  asyncHandler(async (req, res) => {
    const article = await prisma.article.findFirst({
      where: { slug: req.params.slug, published: true },
    });
    if (!article) return res.status(404).json({ ok: false, error: 'Article not found' });
    res.json({ ok: true, data: article });
  }),
);

// GET /api/testimonials — active testimonials, in display order.
contentRouter.get(
  '/testimonials',
  asyncHandler(async (_req, res) => {
    const testimonials = await prisma.testimonial.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: { id: true, name: true, location: true, quote: true, rating: true, imageUrl: true },
    });
    res.json({ ok: true, data: testimonials });
  }),
);
