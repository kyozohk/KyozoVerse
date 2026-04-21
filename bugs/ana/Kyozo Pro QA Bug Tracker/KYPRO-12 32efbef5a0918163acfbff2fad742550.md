# KYPRO-12

Actual result: No tooltip or additional information appears on hover. User must switch to list view to see all tags.
Assignee: Ashok
Bug title: Communities – "+1" tag overflow badge shows no tooltip revealing hidden tag names
Category: UX
Environment: Chrome (latest), Ubuntu 22, Desktop 1502x818
Expected result: A tooltip or popover appears showing the name(s) of the hidden tag(s) (e.g., "gotomarket").
Notes: Adding a title attribute or tooltip component to the overflow badge would resolve this. User must switch views to discover hidden tags, which is poor discoverability.
Page/Feature: Communities / Community Card Tags
Priority: Low
Reported at: March 25, 2026 6:50 PM
Reporter: Anastasia Starko
Reproducibility: Always
Screenshot: image%2025.png
Severity: Low
Status: New
Steps to reproduce: 1. Navigate to https://pro.kyozo.com/communities in grid view
2. Locate a community card with a "+1" overflow tag badge (e.g., "Ashok@Kyozo": code, innovate, speed, +1)
3. Hover over the "+1" badge