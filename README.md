# Capacity Connect

Capacity Connect is a Supabase-backed learning and capacity-building portal with Supabase Auth, role-based routing, skill-gap analysis, assessments, certifications, opportunities, and a knowledge base.

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase_schema.sql` once.
3. Run `auth_schema.sql` after it. This creates `profiles`, the signup trigger, updated-at handling, and RLS policies.
4. In **Authentication > URL Configuration**, add `http://127.0.0.1:8000/reset-password` as a redirect URL for local development.
5. In **Authentication > Providers > Email**, choose whether email confirmation is required.

The auth migration is safe for public signup: browser signups can create only `student` or `trainer` profiles. Admin is never accepted from the signup UI or trigger metadata.

## Configure keys

Copy `.env.example` to `.env` and put the Supabase URL and service-role key there. The service-role key is backend-only and must never be placed in JavaScript.

Put the project URL and the **publishable key** (or legacy anon key) in `supabase-config.js`:

```js
window.CAPACITY_CONNECT_CONFIG = {
	supabaseUrl: "https://YOUR_PROJECT.supabase.co",
	supabasePublishableKey: "YOUR_SUPABASE_PUBLISHABLE_KEY"
};
```

The browser uses this public key with Supabase Auth and RLS. The FastAPI process uses `SUPABASE_SERVICE_ROLE_KEY` only for its server-side Supabase client.

## Install and run

```powershell
pip install -r requirements.txt
uvicorn app:app --reload
```

Open `http://127.0.0.1:8000/login`. The server also serves `/signup`, `/reset-password`, `/student-dashboard`, `/trainer-dashboard`, and `/admin-dashboard` through the same SPA.

## First admin account

1. Sign up normally as a student or create an account in Supabase Authentication.
2. Confirm the email if confirmation is enabled.
3. In the Supabase SQL Editor, run:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where email = 'admin@example.com';
```

Replace the email with the intended account. Do not put an admin password in source code. The profile trigger and RLS prevent normal users from promoting themselves.

## Authentication behavior

- Login uses `supabase.auth.signInWithPassword`.
- Signup uses `supabase.auth.signUp` and creates the profile through the database trigger.
- Role tabs are a requested role only; the database profile is authoritative.
- Sessions, token refresh, logout, and recovery are handled by Supabase Auth.
- Feature writes send the access token to FastAPI; FastAPI derives `user_id` from the verified token.
- Direct dashboard URL access is redirected to the authenticated user's real role route.

## Testing checklist

With Supabase configured, manually verify student signup, trainer signup/login, admin login, wrong-role login, logout, direct protected routes, password recovery, refresh/session persistence, skill-gap save, and assessment save. Use browser developer tools to confirm that no service-role key is requested by the frontend.

## Knowledge base

Put approved content into `knowledge_documents` and `knowledge_chunks`. `/api/knowledge/search?q=javascript` performs the current text search; embeddings and a `match_documents` RPC can be added later for semantic retrieval.
