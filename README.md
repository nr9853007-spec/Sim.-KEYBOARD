# N1kmeL site: account system and support panel

The site now includes a Node.js backend for registration, login, reviews, moderation, player bans, and support requests. It is no longer a static-only site.

## Deploy

1. In Render, create a new **Blueprint** and connect this repository. Render reads `render.yaml`.
2. When prompted, set `ADMIN_PASSWORD` to the admin password. The reserved admin username is `N1kmeL`.
3. Keep the generated `SESSION_SECRET`. Do not publish either secret or put them in frontend JavaScript.
4. Deploy and open the Render service URL. The SQLite database and sessions are stored on the mounted persistent disk.

The Render service uses a paid Starter instance because SQLite needs persistent disk storage. A static GitHub Pages deployment cannot run this backend; use the Render service URL for the live site.

## Features

- Username/password registration and login; no Gmail or email address required.
- Passwords are stored as bcrypt hashes.
- Authenticated users can submit reviews and support requests.
- Reviews are hidden until an admin approves them.
- The admin/support account can approve/reject/delete reviews, ban/unban players, and update request status and reply.
- Players can view their request statuses and support replies in their account.
- Rate limits are applied to authentication and user submissions.

## Admin

- Username: `N1kmeL`
- Password: configure `ADMIN_PASSWORD` in the Render environment settings.

Do not put the admin password in source files or commit it to GitHub. The password shared in a public chat should be replaced with a strong unique password before launch.

## Local development

```bash
npm install
ADMIN_USERNAME=N1kmeL ADMIN_PASSWORD='use-a-strong-local-password' SESSION_SECRET='local-random-secret' npm start
```

Open `http://localhost:3000`.
