# Project: LINE QR Code Check-in System

## Overview

A check-in system where attendees scan a QR code at an event or location, authenticate with their Google account via LINE's LIFF browser, and their attendance is recorded. The system ties a LINE identity (`line_id`) to a verified Google email, stamped with the event/location serial number (`sn`) and timestamp.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (requires `--experimental-sqlite` flag) |
| Web Framework | Express.js v4 |
| Database | SQLite via `better-sqlite3` (sync API) |
| LINE Integration | `@line/bot-sdk` v9, LIFF (LINE Front-end Framework) |
| Google Auth | `google-auth-library`, `googleapis` |
| Utility | `uuid`, `dotenv` |
| Dev tooling | `nodemon` |

## Architecture

```
src/
  index.js          — Express app entry, middleware wiring
  routes/
    webhook.js      — POST /webhook (LINE Bot events, raw body)
    liff.js         — POST /liff/start (returns Google OAuth URL)
    oauth.js        — GET /auth/google/callback (saves check-in)
    admin.js        — GET /admin/* (query check-in records)
  services/
    db.js           — SQLite read/write helpers
    google.js       — Google OAuth URL generation + token exchange
    line.js         — LINE Bot messaging helpers
  db/
    schema.sql      — DB schema (checkins table)
    db.js           — DB init / connection singleton
public/             — Static LIFF frontend (HTML/JS served to LINE browser)
qrcodes/            — Generated QR code images
data/               — SQLite database file (runtime)
```

## Database Schema

```sql
CREATE TABLE checkins (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  line_id      TEXT NOT NULL UNIQUE,   -- one check-in per LINE user
  display_name TEXT,
  email        TEXT NOT NULL,          -- verified Google email
  sn           TEXT NOT NULL,          -- event/location serial number
  checked_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Key constraint: `line_id UNIQUE` — a LINE user can only check in once (the latest check-in wins or the insert is rejected, depending on implementation).

## Check-in Flow

1. Organizer generates a QR code pointing to: `https://liff.line.me/<LIFF_ID>?sn=<serial>`
2. Attendee scans QR in LINE → LIFF page opens in LINE's in-app browser
3. LIFF page reads LINE profile (`lineId`, `displayName`) and the `?sn` param, then calls `POST /liff/start`
4. Server generates a Google OAuth URL (with `lineId` + `sn` encoded in state/session)
5. User completes Google sign-in → redirected to `GET /auth/google/callback`
6. Server exchanges code for tokens, extracts `email`, writes to `checkins` table
7. Optionally sends confirmation message via LINE Bot

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/liff/start` | Body: `{lineId, displayName, sn}` → returns `{authUrl}` |
| `GET` | `/auth/google/callback` | Google OAuth callback; saves check-in record |
| `POST` | `/webhook` | LINE Bot webhook (raw body, signature-verified) |
| `GET` | `/admin/all` | All check-in records |
| `GET` | `/admin/sn/:sn` | Records filtered by serial number |
| `GET` | `/admin/user/:lineId` | Records filtered by LINE user ID |
| `GET` | `/health` | Health check |

## Environment Variables

```
PORT=3100
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://<ngrok-host>/auth/google/callback
LIFF_ID=
```

## Development Setup

- Uses **ngrok** to expose localhost for LINE webhook and Google OAuth redirect URI
- Run: `npm run dev` (nodemon) or `npm start`
- The `--experimental-sqlite` flag is required for Node's built-in SQLite (though `better-sqlite3` is the actual dep — this flag may be a carry-over or for future migration)

## Known Gaps / Technical Debt

- Admin endpoints have no authentication
- `line_id UNIQUE` means re-attendance at a different event overwrites or errors; no multi-event support
- README uses `?loc=` param name but code uses `?sn=`; README endpoint `/admin/location/:loc` differs from actual `/admin/sn/:sn`
- No input sanitization or rate limiting on `/liff/start`
