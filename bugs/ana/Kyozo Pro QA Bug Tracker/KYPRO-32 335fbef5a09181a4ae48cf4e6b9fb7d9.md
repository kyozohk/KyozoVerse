# KYPRO-32

Actual result: The first data row is silently consumed and used as column headers. All remaining rows are imported but the first contact is permanently lost with no warning.
Assignee: Ashok
Bug title: Excel import with no header row consumes first data row as headers, silently losing all data
Category: Functional
Environment: http://pro.kyozo.com — Chrome
Expected result: Importer should ask the user whether the first row contains headers or data. If no header row, the user should be able to define column mappings manually. A warning should be shown if the presumed header row looks like data.
Notes: Tested with a 5-row data-only sheet — only 4 contacts imported, first row used as field names.
Page/Feature: Integrations > Import > Excel
Priority: High
Reported at: April 1, 2026 1:46 PM
Reporter: Anastasia Starko
Reproducibility: Always
Screenshot: image%207.png, bug32_no_header.xlsx, image%208.png
Severity: High
Status: New
Steps to reproduce: 1. Go to Integrations > Import
2. Select Excel as source
3. Upload an .xlsx file where the first row contains data (not column headers)
4. Complete the import