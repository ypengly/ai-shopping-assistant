# Aisle: AI Shopping Assistant

A modern e-commerce site where customers describe what they need in plain language and an AI assistant finds matching products in the store's real catalog. The database is the source of truth for names, prices, stock and specifications; the AI extracts requirements, explains recommendations, answers product questions, and generates admin copy — but never invents product data.

**Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui-style components, Prisma, SQLite (PostgreSQL-ready), jose + bcryptjs for authentication, Lucide icons, Anthropic API (server-side only).

To run it on Windows, follow [RUN.md](./RUN.md).

## What's built

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Setup, database schema, authentication, dark mode | Done |
| 2 | Product catalog, categories, search, filters, seed data (~39 products) | Done |
| 3 | Product details, wishlist, comparison, contact-seller | Done |
| 4 | AI shopping assistant chat + AI Product Finder form | Done |
| 5 | AI recommendations, similar/cheaper/upgrade products, "Ask AI about this product" | Done |
| 6 | Admin dashboard, product/category/brand management, settings | Done |
| 7 | AI product description & tag generation (admin) | Done |
| 8 | Analytics (views/recommendations/searches), personalization via saved preferences | Done |

This was built and syntax-checked in an offline environment (no `npm install`, no dev
server, no `npx prisma migrate`). Every file passed a TypeScript parse check, an `@/`
import-resolution check, and an export-existence check — but none of that replaces
actually running it. **Please work through the checklist in RUN.md and report anything
that breaks.**

## Key features

- **Real database as source of truth.** Every AI function (`lib/ai.ts`) is given exact rows from Prisma and is instructed never to state a price, spec, or stock level that isn't in them. Search and filtering (`lib/search.ts`) build a typed Prisma query — the AI never generates SQL.
- **AI shopping assistant** (`/ai-assistant`): extracts structured requirements from a conversation, asks a clarifying question when something's missing, searches the catalog, and explains each recommended product. Conversations and recommendations are saved (`/history`).
- **AI Product Finder** (`/ai-assistant/finder`): the same search, as a form, for people who don't want to chat.
- **Ask AI about this product**, **AI comparison** (`/compare`), and **similar / cheaper / upgrade** product suggestions, all grounded in real catalog data.
- **Admin AI tools**: generate a description, SEO summary, and tags from a feature list — admin reviews and edits before saving; nothing publishes automatically.
- **Full storefront**: search, filters (category, price, brand, rating, stock, discount), wishlist, product comparison, light/dark/system theme, responsive layout.
- **Admin panel**: dashboard with live stats (most-viewed, most-recommended, top searches), product/category/brand CRUD, and a configurable contact channel (Telegram, phone, Messenger, or contact form) — there's no payment/checkout flow, by design.
- **Security**: bcrypt-hashed passwords, signed session cookies, two-layer route protection (middleware + a fresh database check), rate-limited auth and AI endpoints, timing-safe login, zod validation on every write.

## Project structure

```text
app/
  (auth)/login, (auth)/register        Auth pages
  shop, categories, categories/[slug]  Catalog browsing
  products/[slug]                      Product detail
  wishlist, compare, history           Customer features
  ai-assistant, ai-assistant/finder    AI shopping
  admin/*                              Admin panel
  api/*                                Route handlers (auth, products, ai, admin, ...)
components/
  ui/          Buttons, inputs, cards, badges — shared primitives
  auth/        Login/register form, logout button
  layout/      Header, theme provider/toggle
  products/    Product card/grid, filters, search bar, ask-AI panel, contact-seller
  wishlist/    Wishlist button
  compare/     Compare button (localStorage-backed)
  ai/          Chat window
  admin/       Product form, category/brand managers, nav, delete button
lib/
  db, auth, session, validation, admin-validation   Core plumbing
  search.ts        Filter → Prisma query, structured-requirements → filters
  recommendations.ts  Cheapest / best-value / similar / cheaper / upgrade, preference blending
  ai.ts            All calls to the Anthropic API (server-only)
  settings.ts       Site settings (contact channel) stored in the Setting table
prisma/
  schema.prisma, seed.ts, seed-data.json, gen_seed.py (data generator, not run at build time)
middleware.ts   Route protection
```

## Notes

- **Rate limiting** is in memory — fine for one server process. For several instances or serverless, back `lib/rate-limit.ts` with Redis.
- **Prices** are stored as floats for simplicity. If you add tax, currency conversion, or payments later, move to integer cents.
- **Moving to PostgreSQL:** change `provider` to `"postgresql"` in `prisma/schema.prisma`, set `DATABASE_URL`, delete `prisma/migrations`, and run `npx prisma migrate dev --name init`. Enum-like fields are plain strings, so no schema changes are needed.
- **Seed images** are `picsum.photos` placeholders (need internet to load) — replace with real product photo URLs via `/admin/products` or by editing `prisma/gen_seed.py` and reseeding.
- **AI model:** `lib/ai.ts` uses `claude-sonnet-5` for shopping/recommendation/comparison and `claude-haiku-4-5-20251001` for the lighter admin description/tag generation. Change `MODEL` / `FAST_MODEL` in that file if you'd rather use different models.
- **No checkout.** By design — contact channel is configured in `/admin/settings` and shown on every product page.
- **shadcn/ui:** `components.json` is included, so `npx shadcn@latest add <component>` works for anything not yet in `components/ui`.
