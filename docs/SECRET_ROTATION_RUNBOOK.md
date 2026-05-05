# Secret Rotation Runbook

**When to use this:** Every secret currently in `.env` and `.env.local` should be considered compromised, because (a) those files have lived in plaintext on a developer laptop for months and (b) at least one was inspected during a security audit. Rotate everything in this document.

**Order matters.** Rotate in the order below. Each new secret must be put into Vercel's encrypted environment variables (Production scope) *before* the old secret is deleted, or the live site will break.

**Roughly 30–45 minutes end to end.**

---

## 0. Before you start

- Open a terminal in the repo root.
- Open Vercel: <https://vercel.com/dashboard> → your `kyozo-verse` project → Settings → Environment Variables.
- Have your password manager open.
- Decide a target time when a 2-minute outage is acceptable (the Resend + Firebase rotations briefly fail in-flight requests).

---

## 1. Firebase Admin service account (HIGHEST PRIORITY)

**Why first:** the private key in `.env` grants full Firestore + Auth + Storage admin access. If leaked, the database is gone.

1. Go to <https://console.firebase.google.com/project/kyozoverse/settings/serviceaccounts/adminsdk>.
2. Click **"Generate new private key"** → confirm. A JSON file downloads.
3. Open the downloaded JSON. Copy the entire JSON object (all of it, including the curly braces).
4. In Vercel → Environment Variables, **edit** `FIREBASE_SERVICE_ACCOUNT_KEY` for the **Production** environment. Paste the new JSON. Save.
5. Repeat for **Preview** and **Development** environments.
6. Also update these three vars to match the new JSON's fields (some code paths read these instead of the JSON blob):
   - `FIREBASE_PROJECT_ID` → from `project_id` field
   - `FIREBASE_CLIENT_EMAIL` → from `client_email` field
   - `FIREBASE_PRIVATE_KEY` → from `private_key` field (keep the literal `\n` escapes as-is in the Vercel UI)
7. Redeploy: in Vercel → Deployments → latest → "Redeploy" → uncheck "Use existing Build Cache" → Redeploy.
8. Once the new deploy is live and healthy, go back to the service-accounts page in step 1 and **delete the old key** (the row whose `key id` ends with the same prefix as the one you previously had — easiest if you note the prefix before generating the new one).
9. Update your local `.env` and `.env.local` to match the new values, then test `pnpm dev` boots.

**Verification:** the deploy succeeds and a logged-in user can still create a community.

---

## 2. Resend API key

**Why second:** controls outbound email; if leaked, attackers send from your verified domains.

1. Go to <https://resend.com/api-keys>.
2. Click **Create API Key**. Name it `kyozoverse-prod-2026-05`. Permission: **Full access**. Domain: leave as "All domains" (or scope to `contact.kyozo.com` and any community subdomains in use). Click create.
3. Copy the new key (starts with `re_`).
4. In Vercel → Environment Variables, edit `RESEND_API_KEY` for **Production**, **Preview**, and **Development**. Paste new key. Save.
5. Redeploy.
6. Once the new deploy is live, return to the Resend dashboard and **revoke** the old key (the one starting `re_BSraSy...`).
7. Update local `.env`.

**Verification:** trigger a test email (e.g., the waitlist welcome flow) and confirm it arrives.

---

## 3. Gemini / Google Generative AI key

1. Go to <https://aistudio.google.com/app/apikey>.
2. Click **Create API key in a new project** (or in your existing kyozoverse project). Copy the new key.
3. In Vercel, edit `GEMINI_API_KEY` for all three environments. Save.
4. Redeploy.
5. Return to the Gemini console and delete the old key (starts `AIzaSyA5GPJDPS...`).
6. Update local `.env`.

**Verification:** trigger an AI-generated email subject from the broadcast UI.

---

## 4. WhatsApp / 360dialog API key

1. Log into the 360dialog client hub: <https://hub.360dialog.com/>.
2. Go to your channel → API Key tab → click **Generate New Key** (or "Rotate"). Copy the new key.
3. In Vercel, edit `D360_API_KEY` (and `D360_DIALOG_API_KEY` if it's also set) for all environments. Save.
4. Redeploy.
5. Old key is invalidated automatically by 360dialog when a new one is generated; double-check on the dashboard.
6. Update local `.env`.

**Verification:** send a WhatsApp template message from your broadcast UI.

---

## 5. GoDaddy API key & secret

**Why:** used by `/api/setup-community-domain` and `/api/setup-email-domain` to create DNS records on `kyozo.com`. If leaked, an attacker can redirect mail or hijack subdomains.

1. Go to <https://developer.godaddy.com/keys/>.
2. Find the key currently in use (starts with the prefix in your `.env`'s `GO_DADDY_API_KEY`). Click **Delete** — but only after you've created the replacement.
3. Click **Create New API Key**. Environment: **Production**. Name: `kyozoverse-prod-2026-05`. Copy the key and the secret.
4. In Vercel, edit `GO_DADDY_API_KEY` and `GO_DADDY_API_SECRET` for all environments. Save.
5. Redeploy.
6. Now delete the old key from step 2.
7. Update local `.env`.

**Verification:** create a test community subdomain (or check an existing community's domain still works).

---

## 6. Vercel OIDC token

The `VERCEL_OIDC_TOKEN` in `.env` is auto-issued by `vercel pull` and short-lived. **You don't rotate this manually.** Just delete the line from `.env` and re-run `vercel env pull` next time you need it; Vercel will issue a fresh one.

---

## 7. Webhook verify token

Currently the WhatsApp webhook accepts the literal string `kyozo_webhook_token` as its verify token (defined in `app/api/whatsapp/webhook/route.ts`).

1. Generate a random 32-character string: `openssl rand -hex 24` in a terminal.
2. Add a new env var in Vercel for all environments: `WEBHOOK_VERIFY_TOKEN` = the generated string.
3. Redeploy.
4. In the 360dialog dashboard → Webhook settings, update the verify token to match.
5. Trigger a webhook re-verification.
6. Update local `.env`.

(The code already prefers `process.env.WEBHOOK_VERIFY_TOKEN` over the hardcoded fallback. The fallback will be removed by the security fix branch.)

---

## 8. Local .env hygiene (one-time, do once at end)

After all rotations are complete and verified:

1. Confirm `.gitignore` contains `.env*` and `*.env` (it does — verified during audit).
2. Run `git ls-files | grep -i env` to confirm no env file is tracked. (Verified clean during audit.)
3. Optional but recommended: install [`gitleaks`](https://github.com/gitleaks/gitleaks) and run `gitleaks detect` to scan history for any accidentally committed secret. If gitleaks finds anything, the affected secret needs an additional rotation.

---

## 9. After rotation: tighten ongoing hygiene

These aren't urgent but should be done before the next audit:

- Move all secrets out of the local `.env` file and into `vercel env pull` on demand. Keep only non-secret values (like `NODE_ENV` or feature flags) in committed `.env.example`.
- Restrict environment-variable access in Vercel's team settings so only the engineering owners can read prod values.
- Set up [Doppler](https://doppler.com/) or [1Password Developer Tools](https://developer.1password.com/) if more than 2 people need access to secrets — they handle rotation reminders and audit logs.
- Add a calendar reminder to rotate every key in this document every 90 days.

---

## Checklist (tick off as you go)

- [ ] Firebase service account rotated, new deploy verified, old key deleted
- [ ] Resend API key rotated, test email sent, old key revoked
- [ ] Gemini API key rotated, AI feature tested, old key deleted
- [ ] 360dialog API key rotated, test WhatsApp message sent
- [ ] GoDaddy API key rotated, domain setup tested, old key deleted
- [ ] Vercel OIDC token cleared from local .env
- [ ] WhatsApp webhook verify token replaced with random value
- [ ] Local `.env` and `.env.local` updated with new values
- [ ] Optional: gitleaks scan run on full history
