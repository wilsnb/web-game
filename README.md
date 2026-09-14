# Ranked — Pass-and-Play Party Quiz

A local, pass-and-play party trivia game built with Next.js (App Router) + TypeScript + Tailwind CSS. Players take turns guessing entries on a ranked list; the closer a correct guess is to #1, the more points it scores. 1–7 players/teams share one device.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run dev
```

Open http://localhost:3000.

## Environment variables

See `.env.example`. Both values are safe to expose to the browser (Supabase publishable / anon key):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never commit your Supabase **secret / service_role** key.

## Authentication (Google OAuth via Supabase)

Auth uses `@supabase/ssr`. Sign-in is optional — the game is fully playable as a guest.

To make Google sign-in work, in the Supabase dashboard:

1. **Authentication → Providers → Google**: enable it and paste in a Google OAuth client ID + secret (created in Google Cloud Console).
2. **Authentication → URL Configuration**: add the redirect URLs:
   - `http://localhost:3000/auth/callback` (local)
   - `https://<your-domain>/auth/callback` (production)
3. In **Google Cloud Console**, add the same callback URLs to the OAuth client's Authorized redirect URIs, plus Supabase's own callback:
   - `https://<project-ref>.supabase.co/auth/v1/callback`

### Auth flow

- `app/login/page.tsx` — sign-in page with "Continue with Google".
- `app/auth/callback/route.ts` — exchanges the OAuth code for a session.
- `app/auth/signout/route.ts` — POST endpoint to sign out.
- `middleware.ts` — refreshes the session cookie on each request (runs on the Node.js runtime).
- `lib/supabase/{client,server,middleware}.ts` — Supabase client factories.

## Project structure

- `app/` — routes: homepage, `play/[category]`, `login`, `auth/*`.
- `components/` — UI (navbar, quiz cards, game board, scoreboard, etc.).
- `lib/` — game logic (`scoring`, `matching`, `gameState`), data loaders, auth helpers.
- `data/quizzes/*.json` — bundled quiz content (static).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint

## License

Private / unpublished.
