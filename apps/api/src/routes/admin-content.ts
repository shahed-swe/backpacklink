import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { HttpError } from '../lib/errors.js';
import { prisma } from '../lib/db.js';

// Admin CRUD for FAQ, blog articles and testimonials. Mounted under /api/admin.
export const adminContentRouter = Router();
adminContentRouter.use(requireAuth, requireAdmin);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------- FAQ ----------------
const faqSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(3000),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

adminContentRouter.get(
  '/faqs',
  asyncHandler(async (_req, res) => {
    const data = await prisma.faq.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ ok: true, data });
  }),
);
adminContentRouter.post(
  '/faqs',
  asyncHandler(async (req, res) => {
    const data = await prisma.faq.create({ data: faqSchema.parse(req.body) });
    res.status(201).json({ ok: true, data });
  }),
);
adminContentRouter.patch(
  '/faqs/:id',
  asyncHandler(async (req, res) => {
    const data = await prisma.faq.update({
      where: { id: req.params.id },
      data: faqSchema.partial().parse(req.body),
    });
    res.json({ ok: true, data });
  }),
);
adminContentRouter.delete(
  '/faqs/:id',
  asyncHandler(async (req, res) => {
    await prisma.faq.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);

// ---------------- Articles (blog) ----------------
const articleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  excerpt: z.string().min(1).max(500),
  emoji: z.string().max(8).optional(),
  coverImageUrl: z.string().url().max(500).nullable().optional(),
  body: z.string().min(1),
  readMins: z.number().int().min(1).max(60).optional(),
  published: z.boolean().optional(),
});

adminContentRouter.get(
  '/articles',
  asyncHandler(async (_req, res) => {
    const data = await prisma.article.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ ok: true, data });
  }),
);
adminContentRouter.post(
  '/articles',
  asyncHandler(async (req, res) => {
    const input = articleSchema.parse(req.body);
    const slug = slugify(input.slug?.trim() ? input.slug : input.title);
    if (!slug) throw new HttpError(400, 'Could not create a slug from the title.');
    const clash = await prisma.article.findUnique({ where: { slug } });
    if (clash) throw new HttpError(409, 'An article with this slug already exists.');
    const data = await prisma.article.create({ data: { ...input, slug } });
    res.status(201).json({ ok: true, data });
  }),
);
adminContentRouter.patch(
  '/articles/:id',
  asyncHandler(async (req, res) => {
    const { slug: rawSlug, ...rest } = articleSchema.partial().parse(req.body);
    const data = await prisma.article.update({
      where: { id: req.params.id },
      data: { ...rest, ...(rawSlug !== undefined ? { slug: slugify(rawSlug) } : {}) },
    });
    res.json({ ok: true, data });
  }),
);
adminContentRouter.delete(
  '/articles/:id',
  asyncHandler(async (req, res) => {
    await prisma.article.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);

// ---------------- Testimonials ----------------
const testimonialSchema = z.object({
  name: z.string().min(1).max(120),
  location: z.string().max(120).nullable().optional(),
  quote: z.string().min(1).max(1000),
  rating: z.number().int().min(1).max(5).optional(),
  imageUrl: z.string().url().max(500).nullable().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

adminContentRouter.get(
  '/testimonials',
  asyncHandler(async (_req, res) => {
    const data = await prisma.testimonial.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ ok: true, data });
  }),
);
adminContentRouter.post(
  '/testimonials',
  asyncHandler(async (req, res) => {
    const data = await prisma.testimonial.create({ data: testimonialSchema.parse(req.body) });
    res.status(201).json({ ok: true, data });
  }),
);
adminContentRouter.patch(
  '/testimonials/:id',
  asyncHandler(async (req, res) => {
    const data = await prisma.testimonial.update({
      where: { id: req.params.id },
      data: testimonialSchema.partial().parse(req.body),
    });
    res.json({ ok: true, data });
  }),
);
adminContentRouter.delete(
  '/testimonials/:id',
  asyncHandler(async (req, res) => {
    await prisma.testimonial.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);
