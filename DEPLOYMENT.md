# Tilak Ventures IR — deployment checklist

## Current architecture
- GitHub: source control
- Cloudflare Pages: public hosting/CDN
- Supabase: authentication + PostgreSQL metadata
- Cloudflare R2: private PDF document storage
- Company domain: DNS managed in Cloudflare

## Required company-owned accounts
1. GitHub account/repository
2. Cloudflare account
3. Supabase account/project
4. Domain registrar/account

## Production sequence
1. Create Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Create a private R2 bucket for disclosure PDFs.
4. Create Cloudflare Pages project connected to this GitHub repository.
5. Add only public Supabase configuration to the browser application; never commit a Supabase service-role key or R2 secret key.
6. Configure authenticated admin users in Supabase Auth.
7. Add server-side upload/signing logic for R2.
8. Connect the disclosure archive to published records.
9. Test draft/review/publish, PDF upload/download, mobile display and permissions.
10. Connect the production domain.
11. Keep the existing WordPress site available until final sign-off.

## Security requirements
- R2 bucket remains private.
- Service-role and R2 secret credentials stay in Cloudflare/Supabase secrets, never GitHub.
- Public database policy permits only `published` disclosure records.
- Admin writes are authenticated and role-controlled.
- Enable MFA for administrator accounts.
- Back up database and disclosure files before migration.
