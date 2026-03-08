# BHOS Event Manager

A production-ready web app for managing club events with participant registration, QR check-in, and attendance analytics.

## Features

- **Create & manage events** – Name, description, location, dates, capacity
- **Event status** – Draft, published, or cancelled; filter and search events
- **Participant registration** – Register with name, email, phone
- **QR check-in** – Each participant gets a unique QR code; staff can scan or participants can open the link
- **Manual check-in** – Staff can check in participants directly from the event page
- **Export to CSV** – Download participant list with attendance status
- **Duplicate event** – Clone an event (with participants) for recurring events
- **Search & filter** – Find events by name, description, location, or status
- **Attendance analytics** – Real-time stats, attendance rate, check-ins by hour
- **Waitlist** – When event is full, registrations go to waitlist
- **Event categories** – Workshop, meetup, hackathon, talk, social
- **Registration deadline** – Close registration after a set date
- **Participant notes** – Internal notes per participant (editable)
- **Bulk import** – Upload CSV (name, email, phone) to add participants
- **Bulk check-in** – Select multiple participants and check in at once
- **Add to calendar** – Download .ics file for Google Calendar, Outlook
- **Print participant list** – Print-friendly view
- **Dark/light theme** – Toggle stored in browser
- **Participant feedback** – Ratings (1–5) and comments from checked-in participants
- **Cancel registration** – Participants or organizers can remove a registration; waitlist auto-promotion when event was full
- **Participant self-service** – At `/r/[token]`, participants can view/edit details, download QR, leave feedback, or cancel
- **Search participants** – Filter by name, email, or phone within an event

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **QR**: html5-qrcode (scanning), qrcode (generation)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (Docker, [Neon](https://neon.tech), [Supabase](https://supabase.com), or local install)

### Setup

1. **Clone and install**

   ```bash
   npm install
   ```
   (Runs `prisma generate` automatically via postinstall)

2. **Configure database**

   Copy `.env.example` to `.env` and set `DATABASE_URL`:

   ```bash
   cp .env.example .env
   ```

   **Option A – Docker (recommended for local dev):**

   ```bash
   docker compose up -d
   ```

   Then set in `.env`:
   ```
   DATABASE_URL="postgresql://bhos:bhos_secret@localhost:5432/bhos_events?schema=public"
   ```

   **Option B – Neon / Supabase:** Create a free database and paste the connection string into `.env`.

3. **Apply schema**

   ```bash
   npm run db:push
   ```

4. **Start the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Deployment

This app can be deployed to any platform that supports Next.js and PostgreSQL. Below are step-by-step guides for the most common options.

### Which platform to choose?

| Platform | Best for | Database | Free tier |
|----------|----------|----------|-----------|
| **Vercel** | Next.js native, fastest setup | Bring your own (Neon, Supabase) | Yes |
| **Railway** | All-in-one (app + DB in one place) | Built-in Postgres | $5 credit/month |
| **Render** | Simple, predictable pricing | Built-in Postgres or external | Yes (with limits) |
| **Fly.io** | Global edge, low latency | Supabase/Neon or Fly Postgres | Yes |
| **Netlify** | Alternative to Vercel | Bring your own | Yes |

---

### 1. Vercel (recommended for Next.js)

Vercel is built by the Next.js team and offers the smoothest deployment experience.

**Database options:** [Neon](https://neon.tech) (serverless Postgres) or [Supabase](https://supabase.com) (Postgres + extras).

**Steps:**

1. **Create a database**
   - [Neon](https://neon.tech): Sign up → Create project → Copy connection string
   - [Supabase](https://supabase.com): New project → Settings → Database → Connection string (URI)

2. **Push your code to GitHub** (or GitLab/Bitbucket)

3. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Add environment variable: `DATABASE_URL` = your Postgres connection string
   - Deploy

4. **Run migrations** (one-time, from your machine):
   ```bash
   DATABASE_URL="your-production-url" npx prisma db push
   ```
   Or use Vercel’s env vars and run:
   ```bash
   vercel env pull .env.production
   npx prisma db push
   ```

5. **Optional:** Enable Vercel Analytics and set up a custom domain in Project Settings.

---

### 2. Railway

Railway provides app hosting and Postgres in one place.

**Steps:**

1. **Sign up** at [railway.app](https://railway.app)

2. **Create a new project** → Add PostgreSQL (one click)

3. **Add your app**
   - New → GitHub Repo → Select this project
   - Railway will detect Next.js and set build commands

4. **Configure environment**
   - In your Postgres service: Variables → Copy `DATABASE_URL`
   - In your app service: Variables → Add `DATABASE_URL` (paste the value)

5. **Deploy**
   - Railway builds and deploys automatically
   - Run migrations: App service → Settings → Deploy → add a one-off command:
     ```bash
     npx prisma db push
     ```
   - Or from your machine:
     ```bash
     railway run npx prisma db push
     ```

6. **Domain:** Railway assigns a URL; you can add a custom domain in Settings.

---

### 3. Render

Render offers static sites, web services, and Postgres.

**Steps:**

1. **Sign up** at [render.com](https://render.com)

2. **Create a PostgreSQL database**
   - Dashboard → New → PostgreSQL
   - Name it (e.g. `bhos-events-db`)
   - Copy the **Internal Database URL** (for use on Render) or **External URL** (for local access)

3. **Create a Web Service**
   - New → Web Service
   - Connect your GitHub repo
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Environment:** Add `DATABASE_URL` = your Render Postgres Internal URL

4. **Deploy**
   - Render builds and deploys on push
   - Run migrations once via Shell (Dashboard → Your service → Shell):
     ```bash
     npx prisma db push
     ```

5. **Custom domain:** Settings → Custom Domains

---

### 4. Fly.io

Fly.io runs apps close to users with edge regions.

**Steps:**

1. **Install Fly CLI:** [fly.io/docs/hands-on/install-flyctl](https://fly.io/docs/hands-on/install-flyctl/)

2. **Create a database**
   - Use [Neon](https://neon.tech) or [Supabase](https://supabase.com), or
   - Fly Postgres: `fly postgres create` (paid)

3. **Launch the app**
   ```bash
   fly launch
   ```
   - Choose app name, region, and Postgres if you created one on Fly

4. **Set secrets**
   ```bash
   fly secrets set DATABASE_URL="postgresql://..."
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

6. **Migrations**
   ```bash
   fly ssh console
   npx prisma db push
   exit
   ```

---

### 5. Netlify

Netlify supports Next.js via the Essential Next.js plugin.

**Steps:**

1. **Create a database** on [Neon](https://neon.tech) or [Supabase](https://supabase.com)

2. **Connect repo** at [app.netlify.com](https://app.netlify.com)
   - New site → Import from Git → Select repo

3. **Build settings**
   - Build command: `npm run build`
   - Publish directory: `.next` (or leave default; Netlify detects Next.js)
   - Add `DATABASE_URL` in Site settings → Environment variables

4. **Deploy**
   - Netlify builds and deploys on push
   - Run migrations from your machine:
     ```bash
     DATABASE_URL="your-url" npx prisma db push
     ```

---

### 6. Self-hosted (Docker / VPS)

For full control on a VPS (DigitalOcean, Linode, AWS EC2, etc.):

**Docker Compose (single server):**

1. Create `Dockerfile`:
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npx prisma generate
   RUN npm run build

   FROM node:20-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV=production
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   COPY --from=builder /app/public ./public
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

2. Add to `next.config.ts`:
   ```ts
   const nextConfig = { output: "standalone" };
   ```

3. Use `docker-compose.yml` to run app + Postgres, set `DATABASE_URL` to the Postgres service URL, then:
   ```bash
   docker compose up -d
   docker compose exec app npx prisma db push
   ```

---

### Database providers (for Vercel, Netlify, Fly.io)

| Provider | Free tier | Notes |
|----------|-----------|-------|
| [Neon](https://neon.tech) | 0.5 GB, 1 project | Serverless, good for Vercel |
| [Supabase](https://supabase.com) | 500 MB | Postgres + Auth, Storage |
| [PlanetScale](https://planetscale.com) | 5 GB | MySQL only – not compatible with this app |
| [Railway](https://railway.app) | $5 credit/month | Postgres add-on |
| [Render](https://render.com) | 90 days free | Postgres included |

---

### Post-deployment checklist

- [ ] `DATABASE_URL` set in production
- [ ] `npx prisma db push` or `prisma migrate deploy` run once
- [ ] App loads and can create an event
- [ ] QR check-in page works (camera may need HTTPS)
- [ ] Custom domain configured (optional)

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── events/    # CRUD, participants, check-in, analytics
│   │   └── participants/
│   ├── check-in/[id]  # QR check-in page
│   ├── events/        # Event list, create, edit, detail
│   └── participants/  # Participant QR code page
├── components/
│   ├── Nav.tsx
│   └── QRScanner.tsx
├── generated/prisma   # Prisma client
└── lib/db.ts          # Database client
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET, POST | List events, create event |
| `/api/events/[id]` | GET, PATCH, DELETE | Event CRUD |
| `/api/events/[id]/participants` | GET, POST | List/register participants |
| `/api/events/[id]/check-in` | POST | Check in (body: `{ qrToken }` or `{ participantId }`) |
| `/api/events/[id]/analytics` | GET | Attendance analytics |
| `/api/participants/[id]` | GET | Participant details |
| `/api/participants/[id]/qr` | GET | QR code image (PNG/SVG) |

## License

MIT
#   U p d a t e   c o n t r i b u t o r   e m a i l 
 
 