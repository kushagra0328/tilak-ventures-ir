# Supabase setup

1. Open the Tilak Ventures Supabase project.
2. Go to SQL Editor and run `schema.sql` in this folder.
3. In Authentication, create the authorised Company Secretary/admin user(s).
4. Enable MFA for administrator accounts.
5. Keep the project URL and publishable/anon key available for the frontend environment variables.
6. Never place the service-role key in this repository or browser code.

The frontend will use environment variables such as:

`SUPABASE_URL`
`SUPABASE_ANON_KEY`

The service-role key is server-side only.
