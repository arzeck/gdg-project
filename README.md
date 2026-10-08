# CampusExchange

A marketplace for students to buy and sell used stuff on campus: textbooks, electronics, cycles, hostel furniture. Built for the GDG Campus Marketplace challenge.

**Live:** https://gdg-project-theta.vercel.app/

## Try it

The seed script creates three demo accounts (password for all: `password123`). The login page has quick-fill buttons for them.

| Name | Email | Listings |
| :--- | :--- | :--- |
| Aarav Sharma | `aarav@campus.edu` | Hero Sprint cycle, Casio fx-991EX (sold), Sony WH-1000XM4 (sold), electric kettle |
| Priya Patel | `priya@campus.edu` | CLRS 4th Ed, mesh study chair, Techfest hoodie |
| Rohan Verma | `rohan@campus.edu` | Logitech MX Master 3S, Yonex racket set, foldable bed table |

That's 10 listings, 2 of them sold, so you can see the sold state straight away.

## Stack

- **SvelteKit 5** with TypeScript. Pages, form actions and API routes all live in one app.
- **Tailwind CSS 4**, Lucide icons, dark theme.
- **Postgres on Neon** via **Drizzle ORM**.
- **Zod** for validation, shared by forms and API routes.
- **Cloudinary** for images, uploaded server-side only.
- **Bun** to run the dev/build scripts, **Vercel** for hosting.

## Setup

You need [Bun](https://bun.sh), a free [Neon](https://neon.tech) database and a free [Cloudinary](https://cloudinary.com) account. The npm scripts call `bun --bun vite`, so Bun is required as the scripts stand.

```bash
git clone https://github.com/arzeck/gdg-project.git
cd gdg-project
bun install
cp .env.example .env     # fill in the values below
bun run db:push          # create tables
bun run db:seed          # demo users + listings
bun run dev              # http://localhost:5173
```

`.env`:

```env
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ORIGIN=http://localhost:5173
```

Other scripts: `bun run check` (svelte-check), `bun run build`, `bun run db:generate`, `bun run db:migrate`.

### Deploying to Vercel

Push to GitHub, import the repo in Vercel, add the environment variables above. `@sveltejs/adapter-vercel` handles the rest. `.npmrc` sets `legacy-peer-deps=true` because the npm install on Vercel hit peer dependency conflicts.

## What it does

**Accounts**
- Register, log in, log out. Passwords are hashed with bcrypt.
- Sessions are stored in the database. The cookie holds a random token; only its SHA-256 hash is saved. Cookies are `httpOnly`, `sameSite=lax`, and `secure` in production. Sessions last 30 days and renew when less than 15 days remain.
- Login errors are generic ("Invalid email or password") so you can't probe which emails exist.
- Login and register are rate limited per IP (10 and 8 attempts a minute).
- `hooks.server.ts` redirects logged-out users away from `/listings/new`, edit pages, `/my-listings` and `/favourites`, and returns 401 for write requests to `/api/*` without a session.

**Browsing**
- Home page grid, 12 per page.
- Search (title and description), category, price range, campus location, sort (newest / price), and a "show sold" toggle. All of it lives in the URL, so a search link can be shared.
- Search input is debounced by 300ms.

**Listings**
- Create and edit with title, description, price (whole rupees), category, location and one photo (JPG/PNG/WebP, max 5MB, checked in the browser and again on the server).
- Replacing a photo or deleting a listing also deletes the old image from Cloudinary.
- Only the owner can edit, delete or mark sold. This is checked on the server in every route, not just hidden in the UI. Others get 403.
- Sold listings are dimmed with a SOLD badge, and the contact button is disabled.
- Contact is a `mailto:` link with a prefilled message.
- `/my-listings` is the seller dashboard: tabs for all / available / sold, with edit, toggle sold and delete.

**Extras**
- **Favourites:** heart button on cards and the detail page (optimistic update), plus a `/favourites` page.
- **Location autocomplete:** the location field has quick-pick campus spots and suggestions from OpenStreetMap Nominatim, proxied through `/api/locations` (responses cached for an hour).
- **Live updates:** see below.

## Live updates (and where it falls short)

When a listing is created, edited, sold or deleted, the server emits an event. `/api/events` streams these over Server-Sent Events and the client shows a toast and refreshes its data.

The catch: the event bus is an in-memory object. That works on one long-running server, but Vercel runs separate short-lived function instances, so one user's event often never reaches another user's stream. When the SSE connection drops, `src/lib/realtime.ts` switches to polling `/api/listings/latest` every 5 seconds. That endpoint returns an ETag built from the listing count and latest update time, so unchanged checks come back as `304`. In practice, on Vercel the polling is what makes it work.

## Database

Tables: `users`, `sessions`, `listings`, `favourites` (see `src/lib/server/schema.ts`). Deleting a user removes their sessions, listings and favourites; deleting a listing removes its favourites.

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ LISTINGS : owns
    USERS ||--o{ FAVOURITES : saves
    LISTINGS ||--o{ FAVOURITES : "saved in"

    USERS {
        uuid id PK
        text name
        text email UK
        text password_hash
        timestamptz created_at
    }
    SESSIONS {
        text id PK "SHA-256 of token"
        uuid user_id FK
        timestamptz expires_at
    }
    LISTINGS {
        uuid id PK
        uuid user_id FK
        text title
        text description
        int price "whole INR"
        enum category
        text image_url
        text image_public_id
        text location
        enum status "available | sold"
        timestamptz created_at
        timestamptz updated_at
    }
    FAVOURITES {
        uuid user_id PK, FK
        uuid listing_id PK, FK
        timestamptz created_at
    }
```

Indexes on `listings`: `status`, `category`, `created_at`, `user_id`, and a composite `(status, category, created_at)` for the browse query. On `favourites`: `user_id` and `listing_id`. Search uses `ILIKE '%term%'`, which can't use these indexes. It's fine at this scale but would need full-text search or trigram indexes for a big dataset.

## API

Page actions (`/login`, `/register`, `/logout`) are SvelteKit form actions, not JSON endpoints.

| Method | Endpoint | Auth | Notes |
| :--- | :--- | :---: | :--- |
| GET | `/api/listings` | no | Filters: `q`, `category`, `minPrice`, `maxPrice`, `location`, `showSold`, `sort`, `page`, `limit` |
| POST | `/api/listings` | yes | Multipart (with image) or JSON (with `imageUrl`). `201`, `401`, `422` |
| GET | `/api/listings/:id` | no | `200`, `404` |
| PATCH | `/api/listings/:id` | owner | `200`, `401`, `403`, `404`, `422` |
| DELETE | `/api/listings/:id` | owner | Also deletes the Cloudinary image |
| PATCH | `/api/listings/:id/sold` | owner | Toggles, or sets status if the body has `{ "status": "sold" \| "available" }` |
| POST | `/api/favourites/:id` | yes | `404` if the listing doesn't exist |
| DELETE | `/api/favourites/:id` | yes | |
| GET | `/api/locations?q=` | no | Nominatim suggestions |
| GET | `/api/events` | no | SSE stream |
| GET | `/api/listings/latest` | no | ETag check, `200` or `304` |

## Project layout

```
src/
  hooks.server.ts        session loading + route guards
  lib/
    validation.ts        Zod schemas, price formatting
    realtime.ts          SSE client with polling fallback
    toast.ts             toast store
    components/          FilterBar, ListingCard, ImageUpload, LocationInput, ...
    server/              db, schema, auth, cloudinary, listings queries, events, seed
  routes/
    +page.svelte         browse feed
    listings/            new, [id], [id]/edit
    my-listings/ favourites/ login/ register/ logout/
    api/                 listings, favourites, locations, events
drizzle/                 generated SQL migration
```

## Things I ran into

- **Slow database connections on Windows.** Under plain Node, connecting to Neon kept timing out (`ETIMEDOUT`) on my machine. Running Vite through Bun (`bun --bun vite`) fixed it, which is why the scripts use Bun.
- **Vercel adapter on Windows.** The adapter makes symlinks during the build, which fails with `EPERM` without Developer Mode. `vite.config.ts` has a small Windows-only workaround that falls back to junctions or copying. It does nothing on Linux or macOS.
- **Runes in plain `.ts` files.** I first wrote the toast and realtime state with `$state`, which threw a `ReferenceError` during SSR. Those two files use Svelte stores instead; components still use runes.

## Known limitations

- Emails aren't verified and there's no check for a campus domain. The "verified" shield on a seller is decoration only.
- Seller emails are included in the public listing API responses, because contact is via `mailto:`. A real version would hide them behind a message system.
- The rate limiter and event bus are in-memory, so they reset on cold starts and aren't shared across instances. Redis (e.g. Upstash) would fix both.
- Re-running `bun run db:seed` adds the demo listings again.
- No automated tests. I tested by hand.
- Nominatim allows about 1 request per second; heavy use would need a proper geocoding service.
- Single campus only. Multiple campuses would need a `campus_id` on users and listings.

## AI assistance
I wrote the user authentication, external api connection, database interaction (fetch and push) myself and tested everything manually (basically the core backend is mine, refined by AI).
I used Claude for basic project structure (to make things faster for me), project UI structure, and the real-time updates part (because it was taking too much time to figure out myself).

## License

MIT
