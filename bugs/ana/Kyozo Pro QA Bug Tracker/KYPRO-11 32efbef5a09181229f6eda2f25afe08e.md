# KYPRO-11

Actual result: View resets to the default grid (card) view on every page load regardless of the user's previous selection.
Assignee: Ashok
Bug title: Communities – Selected view mode not persisted after navigating away and back
Category: UX
Environment: Chrome (latest), Ubuntu 22, Desktop 1502x818
Expected result: The previously selected view (avatar/circle) is restored when returning to the Communities page.
Notes: View preference should be persisted in localStorage or user preferences. Minor but recurring friction for users who prefer non-default views.
Page/Feature: Communities / View Toggle
Priority: Low
Reported at: March 25, 2026 6:50 PM
Reporter: Anastasia Starko
Reproducibility: Always
Screenshot: image%2024.png
Severity: Low
Status: New
Steps to reproduce: 1. Navigate to https://pro.kyozo.com/communities
2. Switch from default grid view to avatar/circle view using the third toggle button
3. Click into any community card to open it
4. Navigate back to https://pro.kyozo.com/communities