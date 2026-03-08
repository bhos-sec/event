# BHOS Event Manager

A production-ready web app for managing club events with participant registration, QR check-in, attendance analytics, and **authentication**.

## Features

- **Authentication** – Sign in with Google or email/password; create an account
- **Create & manage events** – Name, description, location, dates, capacity
- **Participant registration** – Register with name, email, phone
- **QR check-in** – Unique QR codes; staff can scan or participants open the link
- **Attendance analytics** – Real-time stats, attendance rate
- **Participant feedback** – Ratings and comments from checked-in participants
- **Participant self-service** – View/edit registration, cancel, leave feedback at `/r/[token]`
- **Search participants** – Filter by name, email, or phone
- And more (waitlist, bulk import, add to calendar, etc.)

## Get started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` – PostgreSQL connection string
   - `NEXT_PUBLIC_FIREBASE_*` – Firebase config for auth (see below)

3. **Set up Firebase (for authentication)**

   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a project → Enable **Authentication** → **Google** and **Email/Password**
   - Add a web app → Copy the config into `.env`

4. **Database**

   ```bash
   npm run db:push
   ```

5. **Start the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign in or create an account to manage events.

## Without Firebase

If you don't set `NEXT_PUBLIC_FIREBASE_API_KEY`, the app runs without auth – all routes are accessible. Useful for local dev.
