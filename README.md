# BHOS Event Manager

A production-ready web app for managing club events with participant registration, QR check-in, and attendance analytics.

## Features

- **Create & manage events** – Name, description, location, dates, capacity
- **Participant registration** – Register with name, email, phone
- **QR check-in** – Each participant gets a unique QR code; staff can scan or participants can open the link
- **Attendance analytics** – Real-time stats, attendance rate, check-ins by hour

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **QR**: html5-qrcode (scanning), qrcode (generation)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or use [Neon](https://neon.tech), [Supabase](https://supabase.com), or run `npx prisma dev` for local Postgres)

### Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Configure database**

   Copy `.env.example` to `.env` and set `DATABASE_URL`:

   ```bash
   cp .env.example .env
   ```

   For local development with Prisma Postgres:

   ```bash
   npx prisma dev
   ```

   This starts a local Postgres and prints a `DATABASE_URL`. Add it to `.env`.

3. **Run migrations**

   ```bash
   npm run db:push
   # or for migrations: npm run db:migrate
   ```

4. **Start the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Deployment

### Vercel + Neon/Supabase

1. Create a PostgreSQL database on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Add `DATABASE_URL` to your Vercel project environment variables.
3. Deploy:

   ```bash
   vercel
   ```

4. Run migrations (one-time):

   ```bash
   npx prisma db push
   # or: npx prisma migrate deploy
   ```

### Railway / Render / Fly.io

Same steps: set `DATABASE_URL`, deploy, then run `prisma db push` or `prisma migrate deploy` against your production database.

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
