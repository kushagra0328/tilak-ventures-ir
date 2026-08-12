# Tilak Ventures — CS Disclosure CMS

This is the secure admin portal foundation for routine Company Secretary updates.

## CS experience
The CS signs into the portal, chooses the document type, selects the financial year/quarter where applicable, selects a PDF, and clicks Publish. The portal writes to the GitHub repository through a server-side Cloudflare Worker.

Supported document areas in v1:
- Financial Results
- Annual Reports
- Corporate Announcements
- Shareholding Pattern
- Corporate Governance
- Investor Presentations
- Notices / Outcomes
- Policies

## Required Cloudflare secrets
Set these as Worker secrets; never commit them:
- `ADMIN_PASSWORD` — strong password for the CS portal
- `SESSION_SECRET` — long random secret used to sign sessions
- `GITHUB_TOKEN` — GitHub fine-grained token with Contents: Read and write only for this repository

## Deployment
Deploy from this `cms/` directory with Cloudflare Wrangler. The portal is intended to live on a private admin subdomain such as `cms.tilakventures.in`.

Do not put the GitHub token in browser JavaScript. Do not give the CS the GitHub token. Do not expose this Worker publicly without the login/password and HTTPS enabled.

## Protected website rule
The CS portal must only write disclosure/content files. It must not modify `investors.html`, website HTML/CSS/JS, `.github/workflows`, or delete existing files.

## Current status
The CMS foundation is committed to the repository. Cloudflare account access is still required to deploy the Worker and bind the custom admin subdomain. The public website baseline is not replaced by this CMS commit.
