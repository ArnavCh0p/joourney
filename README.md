# Joourney

A personal gaming journal. Connects to your Steam library to pull in games and playtime, then adds journaling, session logs, ratings, and custom lists on top. Think Letterboxd, but for games.

## Features

- **Steam library sync** — auto-imports owned games and detects new play sessions from playtime deltas
- **Session journal** — log individual play sessions with date, duration, freeform notes, and screenshot uploads
- **Playthroughs** — group sessions into named runs (first playthrough, NG+, etc.)
- **Status tracking** — Playing, Completed, Abandoned, Replaying, Want to Play, plus dedicated states for live-service/multiplayer games
- **Manual game entry** — add any game with IGDB search for cover art and metadata; not limited to Steam
- **Custom lists** — named collections, similar to Letterboxd lists
- **Tags** — user-defined tags per game, separate from Steam genres
- **Ratings and reviews** — per-game freeform notes and 1–5 star rating
- **Profile stats** — library breakdown, total hours, most-played games
- **Steam privacy aware** — degrades gracefully when a Steam library is private; all journaling features still work

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | NextAuth v4 with custom Steam OpenID 2.0 |
| Storage | Cloudflare R2 (S3-compatible) |
| Styling | Tailwind CSS v4 |
| Game metadata | IGDB API (via Twitch OAuth) |

## Notable Implementation Details

**Custom Steam OpenID 2.0 auth** — NextAuth v4 doesn't have a built-in Steam provider. The flow is implemented from scratch: a server-side route handles the OpenID redirect and return, extracts the SteamID64 from `openid.claimed_id`, then completes sign-in through a NextAuth `CredentialsProvider`. This avoids having to maintain a separate auth service.

**Server-side screenshot uploads** — Screenshots go browser → Next.js API route → Cloudflare R2, rather than using presigned PUT URLs. This keeps R2 credentials server-side only and avoids CORS configuration on the bucket.

**Session auto-detection** — When the Steam library syncs, playtime deltas are compared against the last sync timestamp. If the delta is within a plausible session window, a session record is created and surfaced as a draft for the user to annotate.

**Platform-agnostic data model** — `ShelfEntry.steamAppId` is nullable, so manually added games (with IGDB cover art and metadata) sit alongside Steam games in the same data model. Steam is an enhancement layer, not a requirement.

## Local Development

**Prerequisites:** Node.js 18+, a PostgreSQL database (Supabase free tier works), a Steam Web API key, and Twitch app credentials for IGDB.

```bash
git clone https://github.com/your-username/joourney
cd joourney
npm install
```

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Push the schema and generate the Prisma client:

```bash
npx prisma db push
npx prisma generate
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See `.env.example` for the full list with descriptions. Required variables:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — random secret, generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — base URL of the app (`http://localhost:3000` locally)
- `STEAM_API_KEY` — from [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)
- `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` — from [dev.twitch.tv](https://dev.twitch.tv) (used for IGDB game search)
- `R2_*` — Cloudflare R2 credentials for screenshot storage

## Project Structure

```
src/
  app/
    api/          # Route handlers (auth, games, sessions, lists, screenshots)
    games/[id]/   # Game detail and journal
    library/      # Main shelf view
    lists/        # Named game collections
    onboarding/   # First-run categorization flow
    profile/      # Stats and library breakdown
  components/     # UI components
  lib/
    auth.ts       # NextAuth config and Steam OpenID logic
    steam/api.ts  # Steam Web API client
    igdb.ts       # IGDB search client
    r2.ts         # Cloudflare R2 upload/delete helpers
prisma/
  schema.prisma   # Database schema
```
