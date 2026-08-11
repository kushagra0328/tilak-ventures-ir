# Tilak Ventures IR — deployment checklist

## Current architecture
- GitHub: source control
- Cloudflare Pages: public hosting/CDN
- Cloudflare Pages Functions: server-side BSE investor-data proxy
- Supabase: authentication + PostgreSQL metadata for company-managed content
- Cloudflare R2: private PDF document storage for company-managed documents
- Company domain: DNS managed in Cloudflare

## Investor relations architecture
- **BSE Limited is the source of truth for exchange-filed investor information.**
- The public Investors page presents BSE information in the Tilak Ventures design system.
- The browser calls `/api/investor-feed`; the Pages Function calls the BSE corporate-announcement endpoint server-side.
- Direct BSE PDF attachments are opened directly when the exchange provides an attachment URL.
- If BSE does not provide a direct attachment in the returned record, the UI links to the official BSE corporate filing area rather than the legacy WordPress archive.
- Company-owned Governance, Policies, Documents and Contact information remain maintained separately on Tilak Ventures.
- Do not duplicate or manually maintain exchange disclosures in the public investor UI unless there is a specific archival requirement.

## Production sequence
1. Create Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Create a private R2 bucket for disclosure PDFs.
4. Create Cloudflare Pages project connected to this GitHub repository with Pages Functions enabled.
5. Add only public Supabase configuration to the browser application; never commit a Supabase service-role key or R2 secret key.
6. Configure authenticated admin users in Supabase Auth.
7. Add server-side upload/signing logic for R2.
8. Keep BSE investor data retrieval server-side through the Pages Function.
9. Test BSE feed availability, category navigation, pagination, direct PDF opening, mobile display and fallback behaviour.
10. Connect the production domain.
11. Keep the existing WordPress site available until final sign-off and archival migration is complete.

## Security and reliability requirements
- R2 bucket remains private.
- Service-role and R2 secret credentials stay in Cloudflare/Supabase secrets, never GitHub.
- Public database policy permits only `published` company-managed disclosure records.
- Admin writes are authenticated and role-controlled.
- Enable MFA for administrator accounts.
- Cache BSE feed responses briefly at the edge to reduce load and improve page speed.
- Never expose BSE credentials or private integration credentials in browser JavaScript.
- Back up database and company-managed disclosure files before migration.
- Treat BSE API response shape as an external dependency and fail gracefully if BSE changes or becomes temporarily unavailable.
