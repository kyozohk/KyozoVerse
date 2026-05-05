# Kyozo — Competitive Analysis

*Community management & communication platforms*

> **Note on freshness.** This analysis is grounded in publicly available information through mid‑2025. Pricing, feature sets, and ownership change frequently in this category — verify the specific figures and product claims against each vendor's current pricing/changelog page before quoting externally.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Market map](#2-market-map)
3. [Competitor deep dives](#3-competitor-deep-dives)
   - 3.1 Circle
   - 3.2 Skool
   - 3.3 Mighty Networks
   - 3.4 Discord (Communities / Server Subscriptions)
   - 3.5 Discourse
   - 3.6 Geneva
   - 3.7 Heartbeat
   - 3.8 Bettermode
   - 3.9 Slack (Connect / community use)
   - 3.10 Patreon (Chats + community)
   - 3.11 Substack (Chat + Notes)
   - 3.12 Kajabi Communities
4. [Feature comparison matrix](#4-feature-comparison-matrix)
5. [Business‑model & GTM comparison](#5-businessmodel--gtm-comparison)
6. [Technical architecture comparison](#6-technical-architecture-comparison)
7. [White‑space & positioning options for Kyozo](#7-whitespace--positioning-options-for-kyozo)
8. [Recommended wedges](#8-recommended-wedges)
9. [Open questions](#9-open-questions)

---

## 1. Executive summary

The community space has consolidated around three centers of gravity:

**The "creator clubhouse" cluster** — Circle, Skool, Mighty Networks, Heartbeat — sells an all‑in‑one space (forum + courses + events + payments) to creators, coaches, and "cohort" educators. They compete primarily on bundle breadth, mobile polish, and AI features, with prices clustering at roughly **$50–$360/month** for the SMB tier and white‑label/branded‑app tiers stretching into low four figures.

**The "open lobby" cluster** — Discord, Slack — owns synchronous chat at scale. Discord has aggressively pushed into creator monetization (Server Subscriptions, Premium Memberships, Server Shop). Slack has retreated from public communities. Both retain vastly higher DAU than the creator cluster but offer weaker structure for paid memberships, courses, and long‑form async content.

**The "publishing‑first" cluster** — Substack Chat/Notes, Patreon Chats, Kajabi Communities — bolts community onto an audience or course product the creator already runs. They win when the primary asset is the newsletter/podcast/course, and "community" is a retention layer rather than the product.

Discourse and Bettermode remain the strongest answers when the buyer is a **company** (developer relations, customer community, employee/partner program) rather than a creator.

**The unmet needs that keep showing up** in user reviews and creator forum threads:
- Cross‑community identity & a single inbox (creators run multiple SKUs and members hate fragmented logins).
- True portability — every incumbent locks members and content into proprietary schemas.
- Synchronous + async parity (Discord nails sync, Circle nails async; nobody nails both).
- Programmability — webhooks/API surfaces are thin compared to what Slack offered ten years ago.
- Moderation tooling that scales without hiring a team.

Kyozo's most defensible wedge is the **protocol angle layered under a polished SaaS app**: own the schema, allow members and content to move with the user, and treat the hosted product as the reference client. The risk is that "community as protocol" sounds like Mastodon/Matrix to buyers — i.e., technically interesting but operationally heavy. The product needs to feel as turnkey as Skool or Circle while quietly delivering portability and interop underneath.

---

## 2. Market map

```
                       Sync‑first                 Async‑first
                  ┌────────────────────┐    ┌────────────────────┐
   Creator‑led    │ Discord, Geneva,   │    │ Skool, Circle,     │
   (B2C/SMB)      │ Heartbeat          │    │ Mighty Networks    │
                  └────────────────────┘    └────────────────────┘
                  ┌────────────────────┐    ┌────────────────────┐
   Brand/Org‑led  │ Slack, Slack       │    │ Discourse,         │
   (B2B)          │ Connect            │    │ Bettermode         │
                  └────────────────────┘    └────────────────────┘

   Adjacent: Patreon Chats, Substack Chat/Notes, Kajabi Communities
   (community as a retention layer on a primary product)
```

Three observations:

1. **The async/creator quadrant is the most crowded** and the one Kyozo will be initially compared to. Skool's brand momentum makes it the de‑facto reference point.
2. **The B2B quadrants are where pricing power lives** (five‑ to six‑figure annual contracts are common at Discourse Enterprise and Bettermode), but the GTM is heavier and longer.
3. **Discord is the wildcard.** It is the only product with both massive distribution and creator monetization primitives, and the only product where the platform can change pricing/policy unilaterally and disrupt the entire creator cluster overnight.

---

## 3. Competitor deep dives

### 3.1 Circle

**Positioning.** "The all‑in‑one community platform for creators and brands." Sells primarily to course creators, coaches, agencies, and brand communities that have outgrown a Facebook Group and want a polished, branded space.

**Headline features.**
- Spaces (forums, chat, events, courses) with fairly deep customization.
- Native paywalls, bundles, recurring subscriptions, trials, coupons; payouts via Stripe.
- Circle AI ("Activity Score," AI Agents that summarize and answer member questions, AI‑generated copy) added across 2024.
- Branded mobile app on the higher tier; web app is the strongest in this cluster.
- Workflows builder for automations.

**Pricing shape (as of mid‑2025, verify before quoting).** Roughly four tiers: a starter/Basic plan around the **$50/mo** range, a Professional tier in the **$100/mo** range, a Business tier near **$360/mo**, and an Enterprise/Plus tier with branded app pricing in the **$700–$1,000+/mo** range. Transaction fees on the lower tiers; reduced or zero on higher tiers.

**Strengths.** Best‑in‑class web UI in the cluster; broad feature surface; well‑documented API and Zapier coverage; reasonable analytics.

**Weaknesses / recurring complaints.**
- Mobile experience lags web; native app feels like a wrapper to many users.
- Live/synchronous chat is functional but feels secondary to async posts.
- Pricing escalates quickly when you want the branded app or remove transaction fees.
- Search and notification routing get noisy past a few thousand members.

**Implication for Kyozo.** Circle is the feature benchmark for breadth. Match ~80% of the surface; don't try to match 100% on day one.

---

### 3.2 Skool

**Positioning.** "Community + classroom + gamification, in one simple app." Owned and championed publicly by Sam Ovens; ridden a heavy creator‑affiliate flywheel since 2023.

**Headline features.**
- Single, opinionated layout: feed, classroom, calendar, members, leaderboard. Almost no configuration.
- Gamification (points, levels, unlock content) is a core retention loop and the product's most copied idea.
- Skool Games — a public leaderboard of community owners by revenue — drives evangelism.
- Stripe‑based paid memberships; flat pricing model.
- Mobile app is decent and improved fastest of any platform in the cluster.

**Pricing shape.** Famously simple: a single price (around **$99/mo**) per community plus a percentage transaction fee on paid memberships. Very few tiers, very few add‑ons.

**Strengths.** Simplicity is the product. Aggressive creator‑affiliate program. Strong word‑of‑mouth. Surprisingly good search and discovery for a flat‑priced product.

**Weaknesses.**
- Almost zero customization or branding — the Skool look is the Skool look.
- Limited automation, weak API.
- Course features are basic compared to Kajabi/Teachable.
- Single‑community model is awkward for creators with multiple paid offers.

**Implication for Kyozo.** Skool sets the *price expectation* in the prosumer creator segment. Anything materially more expensive needs a clear "why."

---

### 3.3 Mighty Networks

**Positioning.** "Cultural software" / "the world's most powerful community platform." Sells both a self‑serve Mighty product and **Mighty Pro**, a higher‑touch white‑label branded‑app program.

**Headline features.**
- Spaces, courses, events, members, paid memberships, Stripe payouts.
- Strong native iOS/Android apps; Mighty Pro ships a fully branded app on App Store/Play.
- Mighty AI ("People Magic") for member matching and content suggestions.
- Live streaming and cohort/course tooling are deeper than Circle's defaults.

**Pricing shape.** Self‑serve plans roughly **$41–$179/mo** range; Mighty Pro custom and well into four figures monthly.

**Strengths.** Best mobile experience in the cluster. Mighty Pro is the strongest white‑label/branded‑app offering aimed at established creators and associations.

**Weaknesses.**
- Self‑serve product has felt slower to evolve than Skool or Circle.
- Web UI density makes it feel heavy compared to Skool.
- Mighty Pro pricing makes it a different sale (and a different competitor) from the SMB tier.

**Implication for Kyozo.** Mighty Pro shows there is real budget for *branded* community apps. Kyozo should treat white‑label as a tier, not an afterthought.

---

### 3.4 Discord (Communities / Server Subscriptions)

**Positioning.** Default real‑time chat for the internet. Has been deliberately courting creators and small businesses through Server Subscriptions, Premium Memberships, Server Shop, and curated "Community Server" features since 2022.

**Headline features.**
- Best‑in‑class real‑time voice/video/text at scale; thread/forum channels add structured async.
- Bots, slash commands, and a deep developer ecosystem nothing else matches.
- Server Subscriptions and Premium Memberships allow tiered paid access; Server Shop sells digital goods.
- Stage channels, scheduled events, AutoMod, and granular role/permission system.

**Pricing shape.** Free for users; Discord takes a platform cut of paid Server Subscriptions (commonly cited around 10% after fees, verify). Nitro is a per‑user upsell, not a community fee.

**Strengths.** Distribution. Network effects. Developer ecosystem. Real‑time UX.

**Weaknesses.**
- Async / long‑form posts are second‑class; threads are not a true forum.
- Identity is anchored to Discord — creators don't own their member list in any portable way.
- Search and discovery inside a server are weak past a few thousand members.
- Platform risk: policies, take rates, and feature availability can change unilaterally.

**Implication for Kyozo.** Don't compete with Discord on sync chat — match it on quality, but win on *async, ownership, and monetization that the creator controls*. Position Discord as a complement (members can bridge in) rather than a replacement.

---

### 3.5 Discourse

**Positioning.** "Civilized discussion for the internet." The de facto open‑source forum software, with a hosted SaaS arm. Strong with developer relations, OSS projects, customer support communities, and SaaS user groups.

**Headline features.**
- Mature, accessible long‑form forum with excellent SEO and search.
- Plugin ecosystem, theme components, granular trust levels, mature moderation queue.
- AI plugin suite (Discourse AI) for summaries, search, related topics, sentiment.
- Self‑host (free) or hosted SaaS; very developer‑friendly API.

**Pricing shape (hosted).** Tiers commonly in the **$50–$300/mo** range for SMB, with Enterprise quotes upward of **$1,000+/mo**.

**Strengths.** Long‑form content, durable knowledge base, SEO, programmability, OSS option.

**Weaknesses.**
- Not designed as a synchronous chat product; the chat plugin is functional but not where the product lives.
- Aesthetic feels "forum software" to non‑developer audiences; creators don't gravitate to it.
- Onboarding is heavier than Skool/Circle.

**Implication for Kyozo.** Discourse is the benchmark for *content durability and openness*. If Kyozo's protocol angle is real, it should be at least as portable as Discourse data exports and API.

---

### 3.6 Geneva

**Positioning.** "A home for your group." Mobile‑first, group‑chat aesthetic, somewhere between Discord and a private iMessage group. Popular with friend groups, niche fandoms, and lightweight memberships.

**Headline features.**
- Rooms (chat, video, broadcast, events) inside a "Home."
- Mobile feel is the strongest in the cluster.
- Lightweight paid access support added more recently.

**Strengths.** UX delight, strong with younger demographics, low setup friction.

**Weaknesses.**
- Thin async/long‑form story.
- Limited monetization, weak analytics, weak API.
- Not the tool when "community" is a paid product.

**Implication for Kyozo.** Geneva sets the bar for *mobile delight*. Kyozo's mobile app cannot feel like a web wrapper.

---

### 3.7 Heartbeat

**Positioning.** "The Slack‑meets‑Circle for creators and cohorts." Tries to combine real‑time channels, threads, events, and courses in one product.

**Headline features.**
- Channel‑based chat with threads, mirroring Slack's mental model.
- Events, courses, paid memberships, Stripe payouts.
- AI assistance ("Pulse") for summaries and member intros.

**Pricing shape.** Roughly **$50–$200/mo** SMB, with custom higher tiers.

**Strengths.** The sync+async hybrid pitch is closer to where the puck is going. Solid for cohort programs.

**Weaknesses.** Smaller team, smaller ecosystem, fewer integrations than Circle or Discourse; not the brand creators reach for first.

**Implication for Kyozo.** Heartbeat validates the sync+async combined pitch. Kyozo can win this lane on protocol and portability if execution is comparable.

---

### 3.8 Bettermode (formerly Tribe)

**Positioning.** "Customer community platform." Aimed at SaaS companies running customer/partner communities, not creators.

**Headline features.**
- Embeddable widgets, deep Salesforce/HubSpot/Zendesk integrations.
- Customizable spaces, gamification, knowledge base.
- Bettermode AI for content drafting, member Q&A, summaries.
- White‑label, custom domain, SSO, audit logs at higher tiers.

**Pricing shape.** Higher than the creator cluster; SMB plans in the **$200–$600/mo** range, Enterprise quoted.

**Strengths.** Best‑in‑class for company‑run customer communities. Deep CRM integrations.

**Weaknesses.**
- Not a creator product; UI feels like SaaS admin software.
- Less momentum than Discourse in the same B2B lane.

**Implication for Kyozo.** If Kyozo wants to expand beyond creators into brand/customer communities, Bettermode is the benchmark for integrations and admin tooling.

---

### 3.9 Slack (Connect / community use)

**Positioning.** Slack is no longer marketing itself as a community platform after pulling free workspace history and adding pricing pressure on community admins. Many communities have already migrated to Discord, Circle, or Discourse.

**Headline features (relevant to communities).**
- Connect channels for cross‑org chat.
- Best‑in‑class enterprise integrations.
- Threads, huddles, Canvas docs.

**Weaknesses for community use.**
- Pricing per active user makes free or low‑cost communities economically unworkable.
- Free plan history limits effectively kill long‑lived public communities.

**Implication for Kyozo.** Slack is now a *source of refugees*, not a competitor. There is a real "we left Slack" migration motion to capture, and Kyozo should make Slack import effortless.

---

### 3.10 Patreon (Chats + community)

**Positioning.** Membership and recurring revenue platform for creators. Community is bolted on as a retention layer; Patreon Chats added native group chat in 2024.

**Headline features (community side).**
- Patron‑only posts, comments, and Chats.
- Native iOS/Android app with strong push notifications.
- Tiered paid access tied directly to membership.

**Pricing shape.** Take‑rate model: **8–12%** plus payment processing on creator earnings, depending on plan.

**Strengths.** Owns the membership/payment relationship; payouts and tax handling are the strongest in the space.

**Weaknesses.**
- Community features are thin compared to Circle/Skool — limited spaces, limited search, limited analytics.
- Not a venue for courses or structured content.
- Take‑rate pricing is meaningfully more expensive at scale than flat SaaS fees.

**Implication for Kyozo.** Patreon is the anchor for "community as retention layer on memberships." Kyozo's monetization story (flat SaaS + lower take rate) is a clear competitive frame.

---

### 3.11 Substack (Chat + Notes)

**Positioning.** Newsletter/publishing platform. Chat (subscriber‑only group chat) and Notes (Twitter‑style social feed) extended Substack into community.

**Headline features.**
- Chat lets a publisher run a group chat for paid (or free) subscribers natively in the Substack app.
- Notes provides a network‑wide social layer and recommendation engine.
- All gated by the Substack subscription primitive — no separate community billing.

**Pricing shape.** Substack takes **10%** of paid subscriptions plus payment fees; community features are included.

**Strengths.** Distribution from the Substack network and recommendations is unique. Best path for a writer who wants community without operating a second tool.

**Weaknesses.**
- No structured spaces, courses, events, or roles — it is chat plus posts, nothing more.
- Members are Substack‑identity members; the publisher does not own the network graph.
- Take rate is meaningful at scale.

**Implication for Kyozo.** Substack proves that "community attached to publishing" is a real wedge — but it is structurally limited. Kyozo can win when the creator wants more than chat, especially events/courses/roles.

---

### 3.12 Kajabi Communities

**Positioning.** Communities feature inside Kajabi, the all‑in‑one creator/coaching platform best known for courses and funnels.

**Headline features.**
- Circles, Channels, Events, Live Rooms, Leaderboard, native mobile app.
- Tied directly to Kajabi's offers/products engine — paid access flows through one Kajabi checkout.
- AI tooling (Creator Studio) extended into community in 2024.

**Pricing shape.** Bundled into Kajabi plans, which run roughly **$70–$400/mo** depending on tier; community is included rather than priced separately.

**Strengths.** For an existing Kajabi customer, Communities is "free." Tight integration with courses, offers, automations, and email.

**Weaknesses.**
- Quality lags Circle/Skool; Kajabi's emphasis is courses/funnels, with community as the retention layer.
- Not a destination community product; few customers pick Kajabi *for* the community.

**Implication for Kyozo.** Kajabi is a reminder that "bundle wars" are a real threat — incumbents who already own course/email/funnels will keep adding good‑enough community for free.

---

## 4. Feature comparison matrix

Legend: ● strong / native ● ● leadership in category, ◐ partial / present but limited, ○ absent or weak.

| Capability | Circle | Skool | Mighty | Discord | Discourse | Geneva | Heartbeat | Bettermode | Patreon | Substack | Kajabi |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Real‑time chat (text) | ◐ | ◐ | ◐ | ●● | ◐ | ● | ● | ◐ | ◐ | ● | ◐ |
| Voice / video rooms | ◐ | ○ | ◐ | ●● | ○ | ● | ◐ | ○ | ○ | ○ | ◐ |
| Threaded async forum | ● | ● | ● | ◐ | ●● | ◐ | ● | ● | ◐ | ◐ | ● |
| Long‑form posts / blog | ● | ◐ | ● | ◐ | ●● | ○ | ● | ● | ● | ●● | ● |
| Events & calendar | ● | ● | ● | ● | ◐ | ● | ● | ● | ◐ | ○ | ● |
| Courses / classroom | ● | ●● | ● | ○ | ◐ | ○ | ● | ◐ | ○ | ○ | ●● |
| Gamification | ◐ | ●● | ● | ● | ● | ◐ | ● | ● | ○ | ○ | ● |
| Native paid memberships | ● | ● | ● | ● | ◐ | ◐ | ● | ● | ●● | ● | ●● |
| Multiple paid SKUs / bundles | ● | ◐ | ● | ◐ | ◐ | ○ | ● | ● | ● | ◐ | ●● |
| White‑label / branded app | ● ($) | ○ | ●● ($$) | ○ | ◐ | ○ | ◐ | ● ($) | ○ | ○ | ◐ |
| Native iOS/Android | ◐ | ● | ●● | ●● | ◐ | ●● | ● | ◐ | ●● | ● | ● |
| API / webhooks | ● | ◐ | ◐ | ●● | ●● | ○ | ◐ | ● | ◐ | ◐ | ● |
| Bot / extension ecosystem | ◐ | ○ | ◐ | ●● | ●● | ○ | ◐ | ◐ | ○ | ○ | ◐ |
| AI summaries / agents | ● | ◐ | ● | ◐ | ●● | ○ | ● | ● | ○ | ◐ | ● |
| Search at scale | ◐ | ● | ◐ | ◐ | ●● | ◐ | ◐ | ● | ◐ | ◐ | ◐ |
| Moderation tooling | ● | ◐ | ● | ● | ●● | ◐ | ◐ | ● | ◐ | ◐ | ◐ |
| Member portability / export | ◐ | ◐ | ◐ | ○ | ●● (OSS) | ○ | ◐ | ◐ | ◐ | ◐ | ◐ |
| SSO / SCIM | ● ($) | ○ | ● ($) | ◐ | ● | ○ | ◐ | ● | ○ | ○ | ● |
| Custom domain | ● | ◐ | ● | ○ | ● | ○ | ● | ● | ○ | ● | ● |
| Embeddable widgets | ◐ | ○ | ○ | ◐ | ● | ○ | ◐ | ●● | ○ | ● | ◐ |
| Federation / open protocol | ○ | ○ | ○ | ○ | ◐ (RSS / ActivityPub plugin) | ○ | ○ | ○ | ○ | ○ | ○ |

The cells where Kyozo can credibly differentiate are the bottom four rows: **portability, SSO/SCIM at lower tiers, embeddable widgets, and federation/protocol**. Everything above that line is table stakes that must be matched, not won.

---

## 5. Business‑model & GTM comparison

| Vendor | Model | Headline price | Take rate on creator $ | Primary buyer |
|---|---|---|---|---|
| Circle | Tiered SaaS | $50–$700+/mo | 0–4% (drops to 0% on higher tiers) | Creator / SMB / mid‑market brand |
| Skool | Flat SaaS | ~$99/mo | ~2.9% + Stripe | Creator (info products, coaching) |
| Mighty Networks | Tiered SaaS + Mighty Pro | $41–$179/mo + Pro custom | 0–3% | Creator / association / Pro: established brands |
| Discord | Free + platform cut | Free to host | ~10% on Server Subs (verify) | Creator / community owner |
| Discourse | Tiered SaaS or self‑host (free) | $50–$1,000+/mo hosted | 0% (no native payments) | Dev rel, OSS, SaaS support orgs |
| Geneva | Freemium + light paid | Free / low‑cost | TBD | Friend groups, fandoms, lightweight memberships |
| Heartbeat | Tiered SaaS | ~$50–$200/mo | 2–5% | Creator, cohort programs |
| Bettermode | Tiered SaaS | $200–$600+/mo, Enterprise quoted | n/a | SaaS companies, customer/partner communities |
| Patreon | Take rate | Free to start | 8–12% + processing | Creators monetizing recurring memberships |
| Substack | Take rate | Free to start | 10% + processing | Writers, podcasters, publishers |
| Kajabi | Bundled SaaS | $70–$400/mo (bundle) | 0% on community | Course creators, coaches |

**GTM patterns worth noting.**
- **Affiliate flywheels** drive Skool's growth more than any other lever; Circle and Mighty have less aggressive affiliate motions.
- **Migrations** drive a meaningful share of Circle and Discourse signups: "we're leaving Slack/Facebook Group" is a recurring inbound theme.
- **Bundle threats** are real — Kajabi, Teachable, ConvertKit (Kit) and Beehiiv all add community features periodically. Kyozo should plan for incumbents in adjacent categories to eventually offer "good‑enough" community for free.
- **Enterprise pricing power** sits with Discourse and Bettermode; the creator cluster has structural ceilings around the Mighty Pro / Circle Plus tier.

---

## 6. Technical architecture comparison

| Vendor | Hosting | Schema openness | API | Webhooks | Federation | Self‑host | Identity model |
|---|---|---|---|---|---|---|---|
| Circle | SaaS only | Closed; JSON export limited | REST + GraphQL (partial) | Yes | None | No | Email + SSO ($) |
| Skool | SaaS only | Closed | Limited | Limited | None | No | Email/social |
| Mighty Networks | SaaS only | Closed | Limited public API | Limited | None | No | Email + SSO ($) |
| Discord | SaaS only | Closed but rich API | REST + Gateway WS | Outgoing only | None | No | Discord identity |
| Discourse | SaaS or self‑host | Open data model, full export | Excellent REST | Yes | Plugins for ActivityPub/RSS | Yes (OSS) | Discourse acct + SSO |
| Geneva | SaaS only | Closed | Minimal | Minimal | None | No | Phone/email |
| Heartbeat | SaaS only | Closed | Partial | Yes | None | No | Email |
| Bettermode | SaaS only | Closed | GraphQL | Yes | None | No | SSO‑capable |
| Patreon | SaaS only | Closed | API for membership data | Yes | None | No | Patreon identity |
| Substack | SaaS only | Closed; export is RSS+CSV | Minimal | Minimal | None | No | Substack identity |
| Kajabi | SaaS only | Closed | API + Zapier | Yes | None | No | Kajabi identity |

**Two structural points.**

First, **only Discourse offers real openness** — open source, exportable data, plugin‑level federation. This is also why Discourse remains the default choice for OSS communities and developer relations even though its UX is "old."

Second, **identity is the deepest moat in this category.** Every SaaS vendor binds the member to a vendor‑side identity. The member has no portable record of their participation, their roles, their contributions, or their relationships across communities. This is the layer Kyozo's protocol thesis can attack most directly.

---

## 7. White‑space & positioning options for Kyozo

Three positions are credible for Kyozo, listed from narrowest to broadest. They are not mutually exclusive but they imply different sequencing.

**A. "Discord for grown‑ups, Circle without the lock‑in."**
A polished SaaS community app, tier‑priced with the Circle/Skool segment, that quietly delivers data portability, embeddable widgets, and an open API at every tier. The protocol underneath is invisible to most users; it shows up as "you can export everything" and "your members own their participation history."

- **Why it works.** Buyers don't need to understand the protocol to feel the benefits. Avoids the Mastodon/Matrix trap.
- **Risk.** Differentiation can read as "incremental Circle." Has to be backed up by a real second proof point — most likely the cross‑community member graph or the embedded experience.

**B. "The community protocol with a flagship app on top."**
Lean into the protocol. Position Kyozo as the open standard for community membership, content, and identity, and ship the hosted app as the reference client. Court bridges from Discord/Slack/Discourse early.

- **Why it works.** Differentiation is unmistakable and has long‑term defensibility. Strong with developer‑adjacent audiences who already understand the federation pitch.
- **Risk.** Creator/SMB buyers don't care. GTM needs a parallel "you don't have to think about the protocol" track. History suggests this dual narrative is hard to run.

**C. "Operating system for someone with multiple communities."**
Optimize for the creator/brand running 3–10 community SKUs (free, paid, alumni, premium, partners). One identity per member, one inbox, one analytics view, paid memberships that can move between SKUs without re‑onboarding.

- **Why it works.** This is a real, painful, under‑served job. Skool and Patreon force creators into a single‑community model; Circle handles multi‑community awkwardly. The protocol underneath becomes the why.
- **Risk.** Smaller addressable market early. Has to graduate into single‑community communities later or it caps out.

The recommended composite positioning is **A on the surface, with C as the wedge customer set, and B as the long‑term technical narrative for developer audiences.** "Polished SaaS community app for people running more than one community, built on an open protocol so the member relationship is yours."

---

## 8. Recommended wedges

Five concrete wedges, ranked.

1. **Migrations from Slack and Facebook Groups.** Build the best importer in the category. Both audiences are actively shopping. Discourse has captured most of the Slack/dev‑rel migrations; Circle has captured most of the FB Group migrations; both importers are still mediocre.
2. **Cross‑community identity.** Let a member sign in once and have a unified inbox across every Kyozo community they belong to. This is not a feature any incumbent can ship without re‑architecting; it is the most defensible early product wedge.
3. **Embeddable community.** Bettermode and Discourse have shown there is real demand for "community embedded in the product/site." Make it one line of JavaScript and price it on member‑seats, not page‑views.
4. **Programmability and webhooks at every tier.** Slack‑grade developer surface, exposed for free or near‑free, attracts the integrators and the technical creators who will set the tone.
5. **Member‑owned export.** Make every member able to download their own posts/messages/relationships. Most SaaS vendors will not do this because it hurts retention; Kyozo can use it as a trust signal.

---

## 9. Open questions

These are worth pinning down before the next planning cycle:

- **Who is the first 100 customers?** "Creators with multiple SKUs" is a sharp wedge but small. Are we comfortable selling there for 12 months, or do we need a parallel beachhead (e.g., dev‑rel, OSS, or coaching cohorts)?
- **What is the take‑rate posture?** Match Skool's ~2.9%? Undercut at 0% on higher tiers like Circle? The answer materially changes the GTM and the product priorities.
- **What is the white‑label story?** Mighty Pro proves there is budget here, but it is a different sale (longer cycle, custom builds). Worth doing in year 1, or year 2?
- **How visible is the protocol in the marketing?** Position A says "invisible." Position B says "front and center." This is the single biggest narrative decision.
- **What's the AI thesis?** Every incumbent is shipping AI summaries, agents, and search. Either match the table stakes quietly or pick one AI capability (e.g., a member‑facing agent that can act across communities) and build a moat around it.

---

*Prepared for: Ashok / Kyozo. Status: Draft v1, intended as an internal working document. Re‑verify all pricing claims against vendor pricing pages before sharing externally.*
