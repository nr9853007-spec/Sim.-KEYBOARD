# N1kmeL site — Supabase account system

The account, review, and support-request backend uses Supabase Auth + Supabase Postgres. The browser talks to the Express API; the Supabase secret key stays on the server.

## 1. Create the database tables

1. Open the Supabase project: https://supabase.com/dashboard/project/zarbytwwafejzhahooth
2. Open **SQL Editor** and create a new query.
3. Copy and run the complete contents of [supabase/schema.sql](./supabase/schema.sql).

The tables have Row Level Security enabled and no public policies. The server uses the secret key only after checking the signed-in account and admin role.

## 2. Configure Supabase Auth

In **Authentication → Sign In / Providers → Email**:
- Keep email sign-ups enabled.
- Turn **Confirm email** off. This site uses internal non-deliverable account aliases so players can register with a nickname and password, without entering a real email address.
- This means accounts do not have verified email addresses and password recovery by email is unavailable. Users must keep their passwords safe.

Supabase hosted projects normally have email confirmation enabled. With confirmation on, the site cannot complete this no-email registration flow. See the [Supabase Auth configuration guide](https://supabase.com/docs/guides/auth/general-configuration).

## 3. Configure Render

Create/update the Render Blueprint from this repository. Add these environment variables in the Render service settings:

- `SUPABASE_URL`: `https://zarbytwwafejzhahooth.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY`: the project's publishable key (safe for browser use, but keep it in Render here for configuration)
- `SUPABASE_SECRET_KEY`: create a new secret key in Supabase API Keys and paste it directly into Render. **Never commit it to GitHub or send it in chat.**
- `ADMIN_USERNAME`: `N1kmeL`
- `ADMIN_PASSWORD`: choose a new, unique admin password and enter it only in Render
- `SESSION_SECRET`: keep Render's generated value

Deploy, then open the **Render service URL**, not the GitHub Pages URL. GitHub Pages only serves static files and cannot run the Express API.

## 4. Admin account

On first successful startup, the server creates the reserved `N1kmeL` Supabase Auth user and grants the admin role in `profiles`. The password comes from Render's `ADMIN_PASSWORD` setting. If that Auth user already exists with a different password, update the password in Supabase Auth or use a new dedicated project, then redeploy.

## Features

- Nickname + password registration/login; no real email required.
- Password authentication is handled by Supabase Auth.
- Account profile, reviews, and support tickets are stored in Supabase Postgres.
- Reviews require admin approval.
- Admin can moderate reviews, ban/unban players, and answer support requests.
- Server-side rate limits and HTTP-only session cookies.

## Important

Because there is no real email address, users cannot receive password-reset emails. Do not use a password that is used on any other service. Do not share account passwords, Supabase secret keys, or Render environment values.

## Local development

Set the same environment variables in your local shell, then run:

```bash
npm install
npm start
```
