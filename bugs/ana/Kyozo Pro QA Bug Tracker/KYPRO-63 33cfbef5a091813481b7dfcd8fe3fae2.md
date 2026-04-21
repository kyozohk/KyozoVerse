# KYPRO-63

Actual result: Two buttons are shown that trigger identical behaviour: 'Import N' (top-right of the preview table) and 'Import N Members' (bottom-right). Both complete the import and return to the source selection screen — no functional difference observed.
Assignee: Ashok
Bug title: Import preview has two buttons that perform the same action ('Import N' and 'Import N Members')
Category: UX
Environment: Production — http://pro.kyozo.com
Expected result: A single, clearly labelled primary action button to confirm the import (e.g. 'Import N Members')
Notes: Having duplicate CTA buttons with slightly different labels ('Import 3' vs 'Import 3 Members') is confusing and may lead users to wonder whether the two buttons do different things. Recommend keeping only one consistent button, ideally 'Import N Members' at the bottom of the preview list.
Page/Feature: Audience → Automatically Integrate → Import Preview step
Priority: Low
Reported at: April 8, 2026 2:47 PM
Reporter: Anastasia Starko
Reproducibility: Always
Screenshot: image%2023.png
Severity: Low
Status: New
Steps to reproduce: 1. Open the Audience page of any community
2. Click 'Automatically Integrate'
3. Select any import source (CSV, TSV, Excel/XLS)
4. Upload a valid file and proceed to the Preview step
5. Observe the buttons available on the preview screen