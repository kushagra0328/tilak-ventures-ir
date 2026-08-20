# Tilak Ventures Sanity Studio bundle

This folder contains the CMS schema/config for the existing Sanity project `mp4oev3u` / dataset `production`.

## What CS will see

- Investor Centre
  - Financial Results
  - Annual Reports
  - Board Meetings
  - Shareholders Meetings
  - Voting Results
  - Corporate Actions
  - Shareholding Pattern
  - SDD Shareholding Pattern
  - Corporate Governance
  - Integrated Filings
  - Statement of Deviation or Variation
  - Investor Complaints
  - Related Party Transactions
  - BRSR
  - ASCR
  - Bulk / Block Deals
  - Corporate Announcements
- Governance
  - Governance Documents

Quarterly matrix sections use Financial Year + Quarter + exact period label (for example `Jun-26`) and PDF/XBRL. Other filing sections use Date + Purpose/Particulars + PDF/XBRL as applicable.

## Apply to the existing local Studio

From PowerShell:

```powershell
cd C:\Users\Admin\tilak-ventures-cms
Copy-Item <downloaded-repo>\sanity-studio\schemaTypes\* .\schemaTypes\ -Force
Copy-Item <downloaded-repo>\sanity-studio\structure.ts .\structure.ts -Force
Copy-Item <downloaded-repo>\sanity-studio\sanity.config.ts .\sanity.config.ts -Force
npm.cmd run dev
```

The Studio will continue to use the existing Sanity project and production dataset. No Supabase/Render/Cloudflare CMS is required.
