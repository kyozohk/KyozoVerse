# TODO

## Sidebar nav reference (scratch)

    { href: (handle: string) => `/${handle}`, icon: LayoutDashboard, label: 'Overview', section: 'communities' },
    { href: (handle: string) => `/${handle}/members`, icon: Users, label: 'Members', section: 'communities' },
    { href: (handle: string) => `/${handle}/broadcast`, icon: Bell, label: 'Broadcast', section: 'communities' },
    { href: (handle: string) => `/${handle}/inbox`, icon: Inbox, label: 'Inbox', section: 'communities' },
    { href: (handle: string) => `/${handle}/feed`, icon: Rss, label: 'Feed', section: 'communities' },
    { href: (handle: string) => `/${handle}/ticketing`, icon: Ticket, label: 'subscription' },
    { href: (handle: string) => `/${handle}/integrations`, icon: Plug, label: 'settings' },
    { href: (handle: string) => `/${handle}/analytics`, icon: BarChart, label: 'analytics' },

---

## SSR / Server-Component migration (deferred)

Today every page is `'use client'` and renders a skeleton while Firebase Auth resolves and Firestore data loads. That's fine for the admin app where every visitor is signed in, but it costs us:

- No SEO / link previews on public-facing pages (`/`, `/[handle]/join`, `/developers`, future `/communities/[handle]`).
- Visible loading flash on every navigation.
- Larger first-paint JS bundle.

**Decision: defer.** Skeletons now match the loaded layout (PageLoadingSkeleton was reworked to mirror the real table + banner shape), so the UX gap is much smaller. Revisit SSR when SEO or first-paint speed becomes a real product constraint.

### When we pick this back up — three tiers

**Tier 1 — Server shell + client islands (recommended starting point, ~1–2 weeks)**
- Convert page shells (sidebar, page header, banner) to Server Components.
- Wrap the live data sections in `<Suspense fallback={<PageLoadingSkeleton ... />}>`.
- Mint a Firebase **session cookie** on sign-in via `getAuth().createSessionCookie()` so the server can identify the user from the request.
- Server reads via Firebase **Admin SDK** for "first paint" data (workspace name, community name, member count, etc.). Client subscribes to `onSnapshot` for live updates from there.
- Files to add: `src/lib/firebase/session.ts` (cookie helpers), `middleware.ts` (parse session cookie, attach uid to request), `app/(authed)/` route group with a server-component layout.

**Tier 2 — Full hybrid hydration (~4–6 weeks)**
- Every page is a Server Component; calls Admin SDK for initial snapshots.
- Client island re-subscribes via `onSnapshot` starting from the server-fetched cursor.
- Dual code paths everywhere — only worth it if Tier 1 isn't enough.

**Tier 3 — Partial Pre-Rendering (PPR) in Next 15**
- Static shells at build time, `<Suspense>` boundaries stream dynamic parts at request time.
- Cleanest model long-term. PPR is still flagged experimental in Next 15 but production-usable.
- Requires Tier 1 plumbing (session cookie + Admin SDK reads) underneath.

### Prerequisites before any tier

1. **Session cookie wiring.** Without it the server has no identity for the visitor and can't pre-fetch their data.
2. **Admin SDK read parity.** Every Firestore read pattern the client currently does (`onSnapshot`, `getDocs` with `where`) needs an Admin-SDK equivalent in `src/lib/firebase/server-reads.ts` so server components can fetch without round-tripping to a REST API.
3. **Workspace-scoping enforced on every server read.** The v2 `requireWorkspace()` resolver already does this for `/api/v1/*` routes; server components should call it too before fetching contacts / imports / sourceConnections.
4. **Rules-emulator tests for tenant isolation.** Task #31 — write these before SSR ships, because server-side reads bypass Firestore rules entirely (Admin SDK) and we lose the rules safety net unless we re-check workspace membership in code.

### Pages that benefit most (in priority order)

1. `/developers` (and any marketing/landing pages) — SEO, link previews, fast first paint for prospects who aren't signed in.
2. `/[handle]/join` — invite landing, often opened in fresh tabs without cookies. SSR removes the skeleton flash.
3. `/[handle]` overview, `/[handle]/feed`, `/[handle]/audience` — high navigation volume inside the app; biggest perceived-perf wins.
4. `/master-database` (once it exists) — read-heavy, low write-frequency, perfect SSR candidate.

### Out of scope for SSR

- `/[handle]/inbox` — purely realtime, no SSR benefit.
- `/[handle]/broadcast` — heavy interactive composer.
- The whole `/onboard/*` flow — short-lived sessions, every step has user-specific in-flight state.




