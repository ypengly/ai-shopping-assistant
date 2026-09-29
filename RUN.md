# Running Aisle locally on Windows

These steps use **PowerShell**. Command Prompt equivalents are noted where they differ.

## 1. Prerequisites

Install **Node.js 20 LTS** (18.18 or newer works) from https://nodejs.org, then check:

```powershell
node -v
npm -v
```

## 2. Install dependencies

```powershell
cd C:\path\to\ai-shopping-assistant
npm install
```

## 3. Create your `.env` file

```powershell
Copy-Item .env.example .env
```

(Command Prompt: `copy .env.example .env`)

Generate a secret and paste it into `.env` as the value of `AUTH_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` to the admin login you want.

Set `AI_API_KEY` to an Anthropic API key (console.anthropic.com). Everything except the AI
shopping assistant, "Ask AI", comparisons, and admin AI generation works without it — those
specific features return a friendly error until the key is set.

## 4. Create the database and seed data

```powershell
npx prisma migrate dev --name init
npx prisma db seed
```

The first command creates `prisma\dev.db`. The second creates the admin account and, the
first time only, ~39 sample products across Electronics, Clothing, and Shoes (safe to
re-run — it skips reseeding if products already exist).

## 5. Start the app

```powershell
npm run dev
```

Open http://localhost:3000.

## 6. Things to try

1. **Shop**: browse `/shop`, filter by category/brand/price/rating, search "running shoes", sort by price.
2. **Product page**: open any product, add to wishlist, add 2+ products to compare from different pages, then visit `/compare`.
3. **Ask AI about a product**: on a product page, ask "Is this good for programming?" — it should answer only from that product's real specs (requires `AI_API_KEY`).
4. **AI Shopping Assistant**: sign in, open `/ai-assistant`, try "I need a laptop for programming under $800" and answer its follow-up questions. Products should come from the real catalog with an explanation for each.
5. **AI Product Finder**: `/ai-assistant/finder` — the form-based alternative to chat.
6. **Wishlist & history**: `/wishlist` and `/history` (history lists past AI conversations; click one to reopen it).
7. **Admin**: log in as the admin account. `/admin/dashboard` shows live stats; `/admin/products` lets you add/edit/delete products, including **Generate description** and **Generate tags** from a feature list; `/admin/categories`, `/admin/brands`, and `/admin/settings` (contact channel) round out catalog management.
8. **Contact seller**: configure a channel in `/admin/settings`, then check that the button on a product page links correctly.
9. Toggle the theme button in the header (System → Light → Dark); reload to confirm it persists.

## Useful commands

| Task | Command |
| --- | --- |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Browse the database | `npx prisma studio` |
| Wipe and recreate the database | `npx prisma migrate reset` |
| Production build | `npm run build` then `npm start` |

## Troubleshooting

- **`npx : File ... cannot be loaded because running scripts is disabled`**: run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then reopen PowerShell.
- **`EPERM: operation not permitted, rename ... query_engine-windows.dll.node`**: stop `npm run dev` (Ctrl+C), then rerun the Prisma command.
- **Port 3000 is in use**: run `npm run dev -- -p 3001`, or find the process with `netstat -ano | findstr :3000`.
- **`AUTH_SECRET is missing or shorter than 32 characters`**: complete step 3 and restart `npm run dev`.
- **`Environment variable not found: DATABASE_URL`**: `.env` must be in the project root, next to `package.json`.
- **AI features return "AI_API_KEY is not configured"**: set `AI_API_KEY` in `.env` and restart `npm run dev`.
- **Seed says "Catalog already has N products — skipping"**: that's expected on a second run. Use `npx prisma migrate reset` to start over, then reseed.
- **Product images don't load**: seed images are `picsum.photos` placeholders and need internet access; swap them for your own URLs in `prisma/gen_seed.py` / re-seed, or edit products in `/admin/products`.
