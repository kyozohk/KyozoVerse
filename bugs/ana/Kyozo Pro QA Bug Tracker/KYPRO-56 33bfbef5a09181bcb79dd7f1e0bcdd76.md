# KYPRO-56

Actual result: The handle retains a trailing hyphen (e.g. "qa-test-community-new-"), creating an invalid or unclean URL slug
Assignee: Ashok
Bug title: Custom Handle generates trailing hyphen when community name ends with special character
Category: Functional
Environment: http://pro.kyozo.com – Chrome
Expected result: The handle strips trailing hyphens/special characters, producing a clean slug (e.g. "qa-test-community-new")
Page/Feature: Create Community – Step 1 (Basic Info)
Priority: Low
Reported at: April 7, 2026 5:18 PM
Reporter: Anastasia Starko
Reproducibility: Always
Severity: Low
Status: New
Steps to reproduce: 1. Open Create Community modal
2. In the Community Name field, type a name ending with a special character (e.g. "QA Test Community New!")
3. Observe the auto-generated Custom Handle field