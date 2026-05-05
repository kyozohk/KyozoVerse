# Kyozo Pro (KyozoVerse)

Next.js 15 community platform. Source for `pro.kyozo.com`.

## Getting started

```bash
pnpm install
pnpm dev   # http://localhost:9003
```

`src/app/page.tsx` is the landing page. App routes live in `app/`.

## API

The public, versioned API lives under `/api/v1/` and is documented by
`public/openapi.yaml`.

The interactive playground, self-serve key management, and MCP server live in
the separate **kyozo-developers** repo (deployed at `developers.kyozo.com`).

For first-party app traffic, all v1 routes accept either an API key
(`x-api-key`) or a Firebase Bearer token (`Authorization: Bearer <id-token>`),
so the main app exercises the same v1 surface third parties use.

For local CLI key minting (alternative to the dashboard UI):

```bash
pnpm mint-api-key --name "local dev" --scopes "*"
```

Spec changes are auto-published to the dev portal via the
`.github/workflows/publish-openapi.yml` action.

## Open work

- Remove the mushroom animation
- SMTP outbound email working end-to-end
- Show the list of selected members in broadcast/invite flows

## Notes

Earlier revisions of this README contained example curl commands with live
provider keys (360dialog, Resend). Those keys must be considered compromised —
rotate them at the provider and scrub them from `git.log` and any branches
that still reference them.
