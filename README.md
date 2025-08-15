# AI Marketing v2

## Supabase Auth (minimal)

Set environment variables in a `.env` file:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SITE_URL=https://your-domain.com # used for magic link redirect
```

In your Supabase project settings:

- Set Site URL and additional redirect: your local dev URL (e.g., http://localhost:5173)
- Enable Email magic link (if disabled)

Run locally:

```
npm install
npm run dev
```

Login at `/login` with your email. Check your inbox for the magic link. After signing in, you’ll be redirected to the dashboard.

Notes:

- For production, review and tighten RLS policies; current policies in baseline are permissive for dev.
- The app protects all routes except `/login`; use the Sign out button in the top bar to end your session.

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

### Google sign-in

1. Supabase Dashboard → Authentication → Providers → Google
   - Enable Google
   - Set Client ID and Client Secret from Google Cloud Console
   - Add authorized redirect URIs that match your Site URL(s), e.g.:
     - https://your-domain.com/
     - http://localhost:5173/
2. Authentication → URL Configuration
   - Ensure Site URL and Additional Redirect URLs include your domain(s) and local dev URLs.
3. App config
   - Optional: set `VITE_SITE_URL` to your production domain so OAuth redirects return there.

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
