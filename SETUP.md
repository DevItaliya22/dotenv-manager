# Dotenv Manager Setup

## 1) Environment variables (.env)

Create `.env` at the repo root:

```
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...generate_a_random_32+_char_secret...

# GitHub OAuth App
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

# Database (Neon Postgres)
DATABASE_URL=postgres://<user>:<password>@<host>/<database>?sslmode=require
```

Tip: Generate `NEXTAUTH_SECRET` with:

```
openssl rand -base64 32
```

## 2) Create a GitHub OAuth App

1. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Application name: Dotenv Manager
3. Homepage URL: `http://localhost:3000`
4. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
5. After creating, copy Client ID and generate a new Client Secret → paste into `.env` as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
6. Scopes used: `read:user` and `repo` (to list private repos). Our app requests these via NextAuth.

## 3) Install deps and generate Prisma Client

```
pnpm install
pnpm dlx prisma generate
```

## 4) Initialize and migrate the database (Neon)

Ensure `DATABASE_URL` is set in `.env`, then:

```
pnpm dlx prisma migrate dev --name init
```

This creates the tables for users, accounts, sessions, repos, env vars, and share links.

If you change the schema later:

```
pnpm dlx prisma migrate dev --name <change-name>
```

## 5) Run the app

```
pnpm dev
```

Visit `http://localhost:3000`. You can:

- Sign in with GitHub or use the email/password flow (POST `/api/register` to create a local account).
- Navigate to `/repos` to see your GitHub repos with search and add env button.
- Navigate to `/envs` to see all envs (global and repo-scoped), search, copy values, and create 10‑min share links.

## 6) Notes

- Share links live at `/share/<token>` and auto-expire based on the creation time + duration.
- To expose more repo info or pagination, adjust `src/app/api/github/repos/route.ts`.
- If using Vercel or another host, set `NEXTAUTH_URL` to the deployed URL and update GitHub OAuth callback to `<your-domain>/api/auth/callback/github`.
