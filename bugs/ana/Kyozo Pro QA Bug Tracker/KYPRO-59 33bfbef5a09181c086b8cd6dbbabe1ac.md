# KYPRO-59

Actual result: An error message appears when uploading the background image. Despite the error, the form allows the user to continue and the community is created, but the background image is not saved — the header shows a plain grey gradient instead
Assignee: Ashok
Bug title: Background image upload fails silently during Create Community — image not applied
Category: Functional
Environment: http://pro.kyozo.com – Chrome
Expected result: Background image uploads successfully and is displayed in the community header banner
Notes: File tested: ~7.5MB jpg image, within the stated 10MB limit. An error message appeared indicating the image could not be loaded. The form allowed the user to proceed and the community was created, but the background image was not saved. The community header shows a plain grey gradient instead of the uploaded image.
Page/Feature: Create Community – Step 2 (Customization)
Priority: High
Reported at: April 7, 2026 5:31 PM
Reporter: Anastasia Starko
Reproducibility: Always
Screenshot: kypro59_1.mov
Severity: High
Status: New
Steps to reproduce: 1. Open Create Community modal
2. Complete Step 1 (Basic Info) and click Next
3. On Step 2 (Customization), upload a background image within the 10MB limit (tested with ~7.5MB)
4. Observe the error message
5. Proceed and click Finish
6. Open the created community