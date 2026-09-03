# CyberShield — SQLite + Admin Console

## Run
Requires **Node.js 22.5+** (the server uses the built-in `node:sqlite` API).

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The admin console is at `/admin`.

## Admin login
Default credentials:
- Email: `admin@gmail.com`
- Password: `Admin@12345`

For deployment, set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally `PORT` as environment variables.

## Database
The SQLite database is stored at `data/cybershield.sqlite` and is created/seeded automatically by `server.mjs`.

The following application data is stored in SQLite:
- URL scan history
- Threat reports and their review status
- Awareness articles
- Admin accounts

The existing Supabase integration remains for normal user authentication/sign-up. Application content and activity data now use the local SQLite API.

## Production
```bash
npm run build
npm start
```

The production server serves the built Vite app and the SQLite API from the same Node process.
