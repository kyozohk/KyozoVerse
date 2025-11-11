# **App Name**: KyozoVerse

## Core Features:

- User Authentication: Firebase Authentication integration for user registration, login, and profile management.
- Profile Management: Users can create and manage their profiles, including avatar, cover, bio, tags, and social links.
- Community Creation: Community owners can create and manage communities with branding, privacy settings, and contact information.
- Content Feed: Display of sharded community feeds. Users can post, like, comment, and share content within communities. Filterable feed that uses generative AI to re-prioritize popular or relevant content from all communities based on the user's stated or inferred interests. This AI feature may act as a tool depending on inferred community demand.
- Unified Inbox: Aggregates messages from various channels (WhatsApp, email, in-app) into a unified inbox.
- Blog Hosting: Root level public blogs created under an owner handle
- Event Management: Create and manage events, including paid/free options, ticket sales via Stripe, and check-in functionality.

## Style Guidelines:

- Primary color: Use a desaturated pink (#F2D7EE) as a base to offer warmth without overwhelming.
- Background color: Light gray (#F5F5F5) to keep UI controls prominent.
- Accent color: Light purple (#D8B4FE) for interactive elements such as CTAs.
- Font: 'Inter' for both body and headline, as a clean sans-serif will help provide the UI with a simple, understandable appearance.
- Use minimalist icons for navigation and actions, with a border/fill color matching the primary accent color (#D8B4FE).
- Employ a two-level sidebar navigation: a narrow, fixed main sidebar for app-wide operations, and a community-specific sidebar for selected communities.  Use skeleton controls to show content loading.
- Subtle hover effects on custom UI controls with the specified hover color (#e84e99) to indicate interactivity.