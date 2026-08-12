# Tilak Ventures — CS Disclosure Upload Portal

This folder is reserved for the Company Secretary disclosure-upload interface.

## Important security rule

Do **not** put a GitHub Personal Access Token, password, or other repository secret in browser-side HTML/JavaScript.

The production portal should use a server-side/edge function (recommended: Cloudflare Worker) that stores the GitHub token as a secret and exposes only the required upload operation.

## Intended CS workflow

1. Open the secure CS portal.
2. Select document type.
3. Select financial year / quarter where applicable.
4. Select the PDF.
5. Click **Publish**.
6. The server validates the file and filename, writes it to the approved repository folder, and triggers the existing GitHub workflow.

The CS must not edit `investors.html`, `.github/`, `automation/`, manifests, or existing PDFs.

## Current Results naming convention

- Q1: `Jun-YY.pdf`
- Q2: `Sep-YY.pdf`
- Q3: `Dec-YY.pdf`
- Q4: `Mar-YY.pdf`

Example: FY 2026-27 Q1 → `Jun-26.pdf`.
