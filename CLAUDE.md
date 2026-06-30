# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # node --experimental-sqlite src/index.js
npm run dev      # nodemon (watches for changes)

# Inspect the DB directly
node -e "const {DatabaseSync}=require('node:sqlite'); const db=new DatabaseSync('data/checkin.db'); console.log(db.prepare('SELECT * FROM checkins').all())"

# Test calendar fetch (requires ~/.hermes setup)
node src/scripts/get_calendar.js
```

## Architecture

This is a **機台綁定 (device binding)** system: a LINE user scans a QR code for a specific device SN, authenticates with Google, and the binding is recorded in SQLite.

### Request flow

```
QR Code (?sn=XXX)
  → LIFF page (public/index.html) reads LINE profile + sn
  → POST /liff/start → server returns Google OAuth URL
     (lineId + sn encoded as base64url JSON in OAuth state param)
  → User signs in with Google
  → GET /auth/google/callback
     → exchanges code, gets email
     → saves to DB (upsert on line_id)
     → fetches calendar via Hermes (best-effort, non-fatal)
     → pushes LINE Flex Message confirmation
     → redirects browser to line.me/R/
```

### Key architectural decisions

**No server-side session** — `lineId` and `sn` travel through the OAuth `state` parameter (base64url-encoded JSON with a nonce). The callback recovers them by decoding `state`.

**DB uses Node's built-in `node:sqlite`** (`DatabaseSync`) despite `better-sqlite3` being in `package.json`. The `--experimental-sqlite` flag in `npm start` is required for `node:sqlite`. The `checkins` table uses `ON CONFLICT(line_id) DO UPDATE` — re-binding a device overwrites the previous record rather than erroring.

**Hermes dependency** — `src/scripts/get_calendar.js` shells out to `~/.hermes/skills/productivity/google-workspace/scripts/google_api.py` via `arch -arm64 python3`. Calendar fetch failures are caught and silently ignored; the check-in still completes. After OAuth, Google tokens are also written to `~/.hermes/google_token.json` and `~/.hermes/google_token_<email>.json`.

**Webhook responds 200 immediately** then handles events async. Missing `x-line-signature` returns 200 (handles LINE's verify ping); invalid signature returns 403.

**LIFF ID is hardcoded** in two places: `public/index.html` (line 84) and `src/services/line.js` (pushLiffButton). If the LIFF app changes, update both.

### File map

| Path | Responsibility |
|---|---|
| `src/index.js` | Express app, middleware wiring |
| `src/routes/oauth.js` | Google OAuth callback — the core binding logic |
| `src/routes/liff.js` | LIFF entry point, generates OAuth URL |
| `src/routes/webhook.js` | LINE events (currently: `follow` → send LIFF button) |
| `src/routes/admin.js` | Unauthenticated query endpoints |
| `src/services/db.js` | SQLite singleton + CRUD helpers |
| `src/services/google.js` | OAuth URL generation, token exchange, Hermes token write |
| `src/services/line.js` | LINE push messages (Flex Message templates) |
| `src/scripts/get_calendar.js` | Shells out to Hermes Python script for calendar events |
| `public/index.html` | LIFF frontend — runs inside LINE's in-app browser |
| `src/db/schema.sql` | Single `checkins` table definition |

## Environment & Dev Setup

Requires ngrok (or equivalent) — both LINE webhook and Google OAuth redirect URI must be HTTPS public URLs. When the ngrok URL changes, update `GOOGLE_REDIRECT_URI` in `.env` and the Google Cloud Console authorized redirect URIs.

Google OAuth scopes in `src/services/google.js` include Calendar, Drive, Gmail, and Docs — broader than what check-in requires, inherited from the Hermes token-sharing design.

`formatDateTime` is duplicated in `src/routes/oauth.js` and `src/services/line.js` — they can diverge.
