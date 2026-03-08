# BHOS Event Manager

A production-ready web app for managing club events with participant registration, QR check-in, attendance analytics, and **authentication**. Built with **Firebase** (Auth, Firestore, Hosting).

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

2. **Configure Firebase**

   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a project (or use existing)
   - Enable **Authentication** → Sign-in method: **Google** and **Email/Password**
   - Create **Firestore Database**
   - Add a web app → Copy the config

3. **Environment variables**

   Copy `.env.example` to `.env` and fill in:

   - `NEXT_PUBLIC_FIREBASE_*` – Firebase web app config (Auth)
   - `ADMIN_SERVICE_ACCOUNT_KEY` – Full JSON from Project Settings → Service Accounts → Generate new private key (for Firestore in API routes)

4. **Start the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign in or create an account to manage events.

## Deploy to Firebase

1. Enable web frameworks and deploy:

   ```bash
   firebase experiments:enable webframeworks
   firebase deploy
   ```

2. **Production env vars**: Set `ADMIN_SERVICE_ACCOUNT_KEY` in Firebase Console → Functions → your function → Environment variables (or keep it in `.env` for local deploys).

3. **Blaze plan** required for Cloud Functions (SSR/API routes).

## Without Firebase Auth

If you don't set `NEXT_PUBLIC_FIREBASE_API_KEY`, the app runs without auth – all routes are accessible. Useful for local dev. Firestore still requires `ADMIN_SERVICE_ACCOUNT_KEY` for API routes.
