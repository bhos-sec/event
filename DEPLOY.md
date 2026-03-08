# Deploy NeuroQuac to Firebase (Hosting + Firestore)

This app is ready for **Firebase Hosting** (web app) and **Firestore** (cloud database) with pay-as-you-go (Blaze) pricing.

---

## 1. Prerequisites

- Node.js 18+
- A Google account
- Firebase CLI: `npm install -g firebase-tools` then `firebase login`

---

## 2. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or use an existing one).
3. Enable **Google Analytics** if you want (optional).
4. Finish creation.

---

## 3. Enable Blaze (pay-as-you-go)

1. In the project, go to **Project settings** (gear) → **Usage and billing**.
2. Click **Modify plan** and switch to **Blaze**.
3. Add a billing account. You only pay for what you use; Hosting and Firestore have generous free tiers.

---

## 4. Enable Speech-to-Text API (for voice check-in)

1. In Google Cloud Console (same project as Firebase), go to **APIs & Services** → **Library**.
2. Search for **Cloud Speech-to-Text API**.
3. Click **Enable**. The `transcribeAudio` Cloud Function uses this.

---

## 5. Enable Firestore

1. In the left sidebar, go to **Build** → **Firestore Database**.
2. Click **Create database**.
3. Choose **Start in production mode** (we use security rules from the repo).
4. Pick a region (e.g. `us-central1`) and confirm.

---

## 6. SMTP for email verification (optional)

Registration uses a 6-digit code sent by email. Configure SMTP in `functions/.env`:

1. Copy the example:
   ```bash
   copy functions\.env.example functions\.env
   ```

2. Edit `functions/.env` with your SMTP credentials:
   ```env
   SMTP_USER=emin_root
   SMTP_PASS=your_actual_password
   SMTP_FROM=NeuroQuac <support@neuroquac.com>
   SMTP_HOST=smtp.neuroquac.com
   SMTP_PORT=587
   ```

3. Firebase loads `functions/.env` when you deploy functions. Do not commit `.env`.

4. If you use Gmail instead of custom SMTP, omit `SMTP_HOST` and `SMTP_PORT`; use an [App Password](https://support.google.com/accounts/answer/185833).

---

## 7. Deploy Firestore rules

1. Copy the example project config:
   ```bash
   copy .firebaserc.example .firebaserc
   ```
   (On macOS/Linux: `cp .firebaserc.example .firebaserc`.)

2. Edit `.firebaserc` and set `YOUR_FIREBASE_PROJECT_ID` to your actual project ID (from Project settings).

3. Deploy only rules (optional; you can do it with full deploy later):
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 8. Enable Authentication (Email/Password + Google)

1. In the left sidebar, go to **Build** → **Authentication**.
2. Click **Get started**.
3. Open the **Sign-in method** tab.
4. Enable **Email/Password** (and optionally **Email link** for OTP/passwordless) and Save.
5. Enable **Google** and Save (configure OAuth consent screen if prompted).
6. **For Google sign-in on the deployed web app:** Open the **Settings** tab → **Authorized domains**. Add your Hosting domain (e.g. `your-project-id.web.app` and `your-project-id.firebaseapp.com`). Without this, "Sign in with Google" will fail on the live site.

The app has Login and Register screens; history is stored in Firestore per signed-in user.

**For OTP, Google OAuth troubleshooting, and Phone auth:** see [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md).

---

## 9. Get Firebase config for the app

1. Go to **Project settings** (gear) → **Your apps**.
2. Click the **</>** (Web) icon to add a web app.
3. Register the app (e.g. name "NeuroQuac Web").
4. Copy the `firebaseConfig` object. You need:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## 10. Set environment variables

1. Copy the example env file:
   ```bash
   copy .env.example .env.local
   ```
   (Or create `.env.local` manually.)

2. Fill in your values (from step 7):

   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc...
   # EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY not needed - voice uses Cloud Function (transcribeAudio)
   ```

3. **Do not commit** `.env` or `.env.local` if they contain real keys. Add to `.gitignore`:
   ```
   .env
   .env.local
   .env*.local
   ```

---

## 11. Enable Hosting

1. In Firebase Console: **Build** → **Hosting**.
2. Click **Get started** (if you haven’t used Hosting yet).

No need to create a site manually if you deploy with the CLI; the first `firebase deploy --only hosting` will use your `firebase.json`.

---

## 12. Install dependencies and build

```bash
npm install
npm run build:web
```

This runs `expo export --platform web` and writes the static site into the **dist** folder (used by `firebase.json` as `public`).

---

## 13. Deploy

1. Ensure `.firebaserc` has the correct `default` project ID.
2. Deploy hosting (and optionally rules):

   ```bash
   firebase deploy --only hosting
   ```

   Or deploy both hosting and Firestore rules:

   ```bash
   npm run deploy
   ```

3. After deploy, the CLI prints your Hosting URL, e.g.:
   `https://your-project-id.web.app`

---

## 14. Verify

- Open the Hosting URL. Use the app (e.g. play a game, add history).
- In Firebase Console → **Firestore**, you should see data under `users/{uid}/history`.
- If you don’t set any `EXPO_PUBLIC_FIREBASE_*` env vars, the app still runs and uses **local storage only** (no Firestore).

---

## Summary checklist

| Step | What to do |
|------|------------|
| 1 | Install Firebase CLI, log in |
| 2 | Create (or select) Firebase project |
| 3 | Upgrade to Blaze plan |
| 4 | Enable **Cloud Speech-to-Text API** in Google Cloud Console |
| 5 | Create Firestore DB (production mode) |
| 6 | Configure SMTP in `functions/.env` (see step 6) |
| 7 | Deploy `firestore.rules` and **functions** (`firebase deploy`) |
| 8 | Enable Authentication (Email/Password, Google); add web app in Project settings, copy config |
| 9 | Put config in `.env.local` (Firebase only; voice uses Cloud Function) |
| 10 | Enable Hosting in console (Get started) |
| 11 | `npm run deploy` (builds web + deploys hosting, Firestore rules, **and functions**) |

---

## Scripts reference

- **`npm run build:web`** – Export the Expo app for web into `dist/`.
- **`npm run deploy:web`** – Build web then deploy only Hosting.
- **`npm run deploy`** – Build web then deploy Hosting + Firestore rules.

---

## Cost (Blaze, pay-as-you-go)

- **Hosting**: Free tier is large; you pay only if you exceed it.
- **Firestore**: Free tier (e.g. 50K reads, 20K writes, 20K deletes per day); then pay per operation.
- **Authentication**: Anonymous auth is free.

For a small or medium app, usage often stays within free tiers. Monitor in the Firebase Console **Usage** tab.
