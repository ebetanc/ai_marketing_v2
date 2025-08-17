# AI Marketing v2

## Supabase Auth — Local and Prod

This app supports local Supabase (via Docker) and production/hosted projects.

### 1) Local setup (recommended for development)

Prereqs: Docker Desktop, Supabase CLI installed.

1. Copy env file and set values

```
cp .env.example .env.local
# On Windows PowerShell:
Copy-Item .env.example .env.local
```

Edit `.env.local`:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<find in Studio http://127.0.0.1:54323 > Project Settings > API>
VITE_SITE_URL=http://127.0.0.1:5173
VITE_GOOGLE_OAUTH_ENABLED=false
```

2. Start local Supabase and seed DB

```
npm run dev:db     # starts local stack (first run downloads images)
npm run db:local:reset  # runs migrations + seed
```

3. Run the app

```
npm install
npm run dev
```

4. Sign-in flow (local and production)

- Go to `/login`, enter your email and password.
- Click “Sign up” to create a new account, then you’ll be signed in immediately.
- Later, use “Sign in” with the same credentials.

If you enable Google OAuth locally, add your local URLs to `supabase/config.toml` under `[auth]` `site_url` and `additional_redirect_urls` (already pre-filled for 127.0.0.1 and localhost) and configure the provider in Studio.

### 2) Production/Hosted Supabase

Set environment variables in `.env` or your hosting provider:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.ref.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
VITE_SITE_URL=https://your-domain.com
VITE_GOOGLE_OAUTH_ENABLED=true   # if you enable Google in Supabase
```

In your Supabase Dashboard (hosted project):

- Authentication → URL Configuration: set Site URL and Additional Redirect URLs to include your domain(s) and any preview URLs.
- Authentication → Providers → Google: enable and set client ID/secret. Add redirect URIs that match your Site URL.

Notes:

- For production, review and tighten RLS policies. The migration `20250815190000_lockdown_auth.sql` applies authenticated-only policies.
- The app protects all routes except `/login`; use the sign out control in the UI to end your session.

### Database: migrations and seed

- Ensure you have the Supabase CLI installed and Docker running.
- This project includes SQL migrations and a comprehensive seed covering companies, strategies, ideas, and content tables.

Local reset + seed:

```
supabase db reset --linked
```

If not linked to a remote project, you can still run locally within the repo folder:

```
supabase start
supabase db reset
```

This loads migrations under `supabase/migrations` and then executes `supabase/seed.sql` specified in `supabase/config.toml`.

### Providers

This app uses email + password only. OAuth/magic-link are not used.

---

## RLS: Fix for Infinite Recursion (company_users)

If you use a `company_users` join table with a policy like “Company admins can manage memberships,” avoid querying the same table in its USING expression to prevent recursion.

Steps to fix in the Dashboard:

1. Go to Supabase → Authentication → Policies
2. Find `company_users`
3. Edit policy “Company admins can manage memberships”
4. Replace the USING expression with:

```sql
(company_id IN (
   SELECT companies.id
   FROM companies
   WHERE companies.owner_id = auth.uid()
))
```

What this does:

- Removes the circular reference to `company_users`
- Allows only company owners (not admins from company_users) to manage memberships
- Breaks the infinite recursion

Alternative: If you need admin-level access via `company_users.role = 'admin'`, consider a separate, non-recursive policy or a secure function that checks roles without scanning the same table in USING.

---

## UI conventions and dev tips

- Toasts: use short titles with concise messages. Variants map to severity: success (3s), warning (5s), error (6s), info (3.5s).
- Modals: use the shared `Modal` with labelled headers (`labelledById`), ESC/overlay close, and scroll lock.
- Inputs: `Input`, `Select`, and `Textarea` wire labels to controls via `htmlFor` and `id`, and add `aria-invalid`/`aria-describedby` when errors are present.
- Buttons: prefer `variant="destructive"` for irreversible actions; pair with `ConfirmDialog`.
- Skeletons: use `rounded-xl` for consistent surface rounding.

Helpful scripts:

```
npm run lint       # check
npm run lint:fix   # auto-fix
npm run preview    # serve production build
npm run preview:https # HTTPS preview (with vite self-signed cert)
```

---

## Webhook payload contract (FE → n8n)

- Common fields for all webhook posts: `identifier`, `operation`, `user_id` (top-level), `meta.user_id` (must match), and relevant CRUD IDs (e.g., `company_id`, `strategy_id`, `idea_id`, etc.).
- Platforms field for idea/content generation uses a fixed 8-slot string array with reserved indices:
   - Index map: [0]=twitter, [1]=linkedin, [2]=newsletter, [3]=facebook, [4]=instagram, [5]=youtube, [6]=tiktok, [7]=blog
   - Rules: each position is either an empty string or exactly the platform for that slot. Example: `['twitter', '', '', 'facebook', '', '', '', 'blog']`.
- Identifiers:
   - Generate Strategy Angles: `identifier: 'generateAngles'`
   - Generate Ideas: `identifier: 'generateIdeas'`
   - Generate Content: `identifier: 'generateContent'`
   - Real Estate ingest: `identifier: 'content_saas'`, `operation: 'real_estate_ingest'`

The E2E suite enforces these constraints, including platform index mapping.
