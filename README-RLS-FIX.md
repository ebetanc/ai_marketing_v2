# Fix for RLS Policy Infinite Recursion

## Problem
The "Company admins can manage memberships" policy on the `company_users` table is causing infinite recursion because it queries the same table it's protecting.

## Solution
You need to update the first policy ("Company admins can manage memberships") in your Supabase dashboard.

### Steps to Fix:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Policies
3. Find the `company_users` table
4. Edit the policy "Company admins can manage memberships"
5. Replace the current USING expression with this simplified version:

```sql
(company_id IN (
  SELECT companies.id
  FROM companies
  WHERE companies.owner_id = auth.uid()
))
```

### What this does:
- Removes the circular reference to `company_users` table
- Only allows company owners (not admins from company_users table) to manage memberships
- Breaks the infinite recursion loop

### Alternative (if you need admin-level access):
If you need users with 'admin' role in company_users to also manage memberships, you'll need to restructure your approach. For now, use the simpler solution above to fix the recursion.

The key is to avoid querying the same table that the policy is protecting, which was causing the infinite loop.