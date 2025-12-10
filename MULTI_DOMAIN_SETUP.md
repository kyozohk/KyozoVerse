# Multi-Domain Setup Guide

## Overview

The application now supports two separate domains with different user experiences:

- **pro.kyozo.com** (Port 9003 in dev) - For community owners/leaders
- **www.kyozo.com** (Port 3000 in dev) - For community members (public)

## Development Setup

### Running Both Domains Locally

You'll need to run **two separate terminal windows**:

#### Terminal 1 - Pro Domain (Owner Dashboard)
```bash
npm run dev:pro
# or
pnpm dev:pro
```
Access at: **http://localhost:9003**

#### Terminal 2 - Public Domain (Member Experience)
```bash
npm run dev:public
# or
pnpm dev:public
```
Access at: **http://localhost:3000**

## URL Structure

### Pro Domain (localhost:9003)

| URL | Purpose |
|-----|---------|
| `http://localhost:9003/` | Landing page with owner sign-in/sign-up |
| `http://localhost:9003/communities` | Owner dashboard - manage communities |

**Behavior:**
- If not logged in → Shows landing page
- If logged in → Redirects to `/communities`

### Public Domain (localhost:3000)

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/[handle]` | Public community feed (e.g., `/willer`) |
| `http://localhost:3000/[handle]/signup` | Member signup page |

**Behavior:**
- Always shows public feed (no auth required)
- Signup page for new members to join

## Project Structure

```
src/app/
├── (pro)/                    # Pro domain routes
│   ├── layout.tsx
│   ├── page.tsx             # Landing page
│   └── communities/         # Owner dashboard
│       └── page.tsx
│
├── (public)/                # Public domain routes
│   ├── layout.tsx
│   ├── [handle]/
│   │   ├── page.tsx        # Community feed
│   │   └── signup/
│   │       └── page.tsx    # Member signup
│
├── (app)/                   # Existing app routes (keep for now)
├── (dashboard)/             # Old dashboard (can be removed later)
├── api/                     # API routes (shared)
└── middleware.ts            # Domain routing logic
```

## How It Works

### Middleware
The `src/middleware.ts` file detects the domain/port and rewrites URLs to the appropriate route group:

- **localhost:9003** → Routes to `(pro)` group
- **localhost:3000** → Routes to `(public)` group

### Route Groups
Next.js route groups `(pro)` and `(public)` organize routes without affecting URLs:
- Files in `(pro)` are for owners
- Files in `(public)` are for members
- Both can have the same URL structure

## Testing Workflow

### Test Pro Domain (Owner Experience)
1. Start pro server: `npm run dev:pro`
2. Open: `http://localhost:9003`
3. Sign in as owner (e.g., `dev@kyozo.com`)
4. Should redirect to `/communities`
5. Create/manage communities

### Test Public Domain (Member Experience)
1. Start public server: `npm run dev:public`
2. Open: `http://localhost:3000/willer` (or any community handle)
3. See public feed without login
4. Click "Join Community" → Goes to `/willer/signup`
5. Sign up as new member
6. After signup, see community feed

## Production Deployment

### DNS Configuration
Point these domains to your deployment:
- `pro.kyozo.com` → Your app
- `www.kyozo.com` → Your app

### Environment Variables
No special configuration needed - middleware detects domain automatically.

### Vercel/Netlify
The middleware handles routing automatically. No additional configuration required.

## Migration Notes

### What Changed
1. ✅ Created `(pro)` route group for owner dashboard
2. ✅ Created `(public)` route group for member pages
3. ✅ Added middleware for domain detection
4. ✅ Moved landing page to `(pro)/page.tsx`
5. ✅ Copied communities dashboard to `(pro)/communities`
6. ✅ Created public feed at `(public)/[handle]/page.tsx`
7. ✅ Created member signup at `(public)/[handle]/signup/page.tsx`

### What's Next
- [ ] Test both domains thoroughly
- [ ] Remove old `(dashboard)` routes after confirming everything works
- [ ] Update any hardcoded links to use correct domain
- [ ] Add proper error pages for each domain

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 9003
lsof -ti:9003 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Middleware Not Working
- Check console logs in terminal
- Middleware logs show: `[Middleware] Host: ..., Path: ..., isPro: ..., isPublic: ...`
- Verify you're accessing the correct port

### Routes Not Found
- Ensure you're on the correct port for the route you want
- Pro routes (like `/communities`) only work on port 9003
- Public routes (like `/willer`) only work on port 3000

## Quick Reference

**Owner wants to manage communities:**
→ `http://localhost:9003` → Sign in → Manage at `/communities`

**Member wants to view community:**
→ `http://localhost:3000/[handle]` → View feed → Join at `/[handle]/signup`

**In production:**
- Owners: `https://pro.kyozo.com`
- Members: `https://www.kyozo.com/[handle]`
