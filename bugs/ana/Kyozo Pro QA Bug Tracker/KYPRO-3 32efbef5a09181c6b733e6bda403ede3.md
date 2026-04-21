# KYPRO-3

Actual result: Both "UAT" and "uat" appear as separate distinct tags in the filter bar, occupying two slots.
Assignee: Ashok
Bug title: Communities – Tag filter treats "UAT" and "uat" as separate tags
Category: Functional
Environment: Chrome (latest), Ubuntu 22, Desktop 1502x818
Expected result: Tags with the same name regardless of case are normalised and shown as one entry.
Notes: Tags are stored with the casing provided at creation time and compared case-sensitively. Fix should normalise tag casing on write or on read.
Page/Feature: Communities / Tag Filter
Priority: Low
Reported at: March 25, 2026 6:50 PM
Reporter: Anastasia Starko
Reproducibility: Always
Screenshot: image%2026.png
Severity: Low
Status: New
Steps to reproduce: 1. Navigate to https://pro.kyozo.com/communities
2. Wait for page to fully load
3. Observe the tag filter bar — note both "UAT" and "uat" are listed as separate tags