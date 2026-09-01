# ROLL CREDITS 🎬

> things i swear i'll watch eventually

A personal cinema archive for movies and TV shows. Every title is a ticket, every watch is a screening.

## Setup

```bash
npm install
cp .env.example .env
```

Get a free TMDB API key at [themoviedb.org → Settings → API](https://www.themoviedb.org/settings/api) (request a "Developer" v3 key), then paste it into `.env`:

```
VITE_TMDB_API_KEY=your_key_here
```

## Importing your existing list

Your watchlist lives in `scripts/seed-raw.txt` as a raw `- [x]/[ ] title` checklist. To resolve it against TMDB (only needs to run once, or whenever you edit the raw list):

```bash
node scripts/resolve-seed.mjs
```

This writes `src/data/seed-resolved.json` (confident matches, auto-imported into the app on first run) and `src/data/seed-review.json` (ambiguous or unmatched titles — review and fix these from the **Review Imports** screen in-app, at `/review`).

## Run

```bash
npm run dev
```

## Architecture

- **TMDB** is the source of truth for movie/show metadata (title, cast, genres, runtime, posters…).
- **localStorage** holds everything personal: watchlist status, watched status, ratings, notes, watch dates, favorites, and the ticket-review queue. It survives independently of the seed import — add anything new through search at any time.
