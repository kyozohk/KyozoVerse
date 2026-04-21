# KYPRO-50

Actual result: On initial page load, 'Select All' only selected 20 of 3016 members ('20 of 20 selected'). After performing the 'Test' search (which causes the system to load more member data) and clearing it, clicking 'Select All' correctly selected all 3016 members ('3016 of 3016 selected'). The selection count is tied to how many records are currently loaded in the frontend, not the actual total member count.
Assignee: Ashok
Bug title: 'Select All' only selects currently loaded members, not all members in the community
Category: Functional
Environment: Chrome (desktop), http://pro.kyozo.com
Expected result: 'Select All' should always select all members in the community (3016), regardless of what has been previously loaded or searched
Notes: Critical data integrity risk. An admin could believe they are selecting all members to broadcast or tag, but only a small subset would be affected. Behavior changes depending on session state (what has been previously loaded or searched).
Page/Feature: Audience / Select All
Priority: High
Reported at: April 7, 2026 1:19 PM
Reporter: Anastasia Starko
Reproducibility: Always
Screenshot: image%202.png, image%203.png
Severity: High
Status: New
Steps to reproduce: 1. Navigate to the Audience tab (community has 3016 members)
2. Click 'Select All' without performing any search
3. Note the number of selected members
4. Deselect All
5. Type 'Test' in the search bar and wait for all 4 results to fully load (~50 seconds)
6. Clear the search
7. Click 'Select All' again
8. Note the number of selected members