# KYPRO-73

Actual result: Both 'Import X' (top right) and 'Import X Members' (bottom) trigger the same import action. Both update their count correctly when rows are deleted from the preview, but they are functionally identical and duplicated.
Assignee: Ashok
Bug title: Eventbrite import preview has two redundant 'Import' buttons that trigger the same action
Category: UX
Environment: Production
Expected result: A single import action is sufficient. Having two buttons for the same action is redundant and adds unnecessary visual noise to the UI.
Notes: Confirmed during happy path and delete-before-import testing on community t1. The same redundancy may exist in the CSV and Excel import preview screens — worth checking for consistency.
Page/Feature: Audience / Eventbrite Import — Preview screen
Priority: Low
Reported at: April 9, 2026 6:55 PM
Reporter: Anastasia Starko
Reproducibility: Always
Screenshot: Screenshot_2026-04-09_at_7.16.59_PM.png
Severity: Low
Status: New
Steps to reproduce: 1. Complete the Eventbrite token + event selection flow and click Fetch Attendees.
2. On the preview screen, observe there are two import buttons: 'Import X' in the top-right header area and 'Import X Members' at the bottom of the list.