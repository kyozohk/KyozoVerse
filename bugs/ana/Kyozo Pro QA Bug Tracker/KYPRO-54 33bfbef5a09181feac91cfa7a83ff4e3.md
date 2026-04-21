# KYPRO-54

Actual result: The reset link redirects to http://www.kyozo.com (the member-facing frontend) at the path /reset-password. The page title shown is 'Willer - Welcome to the http://Willer.fm community', indicating a community member page rather than an admin password reset form. Admins/owners initiated the reset from http://pro.kyozo.com and should be returned there.
Assignee: Ashok
Bug title: Password reset link from http://pro.kyozo.com redirects to http://www.kyozo.com (member-facing app) instead of the admin panel
Category: Functional
Environment: Chrome (desktop), http://pro.kyozo.com
Expected result: The reset link should open a password reset form on http://pro.kyozo.com (the admin panel)
Notes: The reset link URL observed: https://www.kyozo.com/reset-password?mode=resetPassword&oobCode=...&lang=en. The mismatch between http://pro.kyozo.com and http://www.kyozo.com means the reset flow sends admins to the wrong application entirely.
Page/Feature: Login / Forgot Password
Priority: High
Reported at: April 7, 2026 2:45 PM
Reporter: Anastasia Starko
Reproducibility: Always
Screenshot: https://www.loom.com/share/5343b72852744e489aba20a6ef76f48a
Severity: High
Status: New
Steps to reproduce: 1. Go to http://pro.kyozo.com and click Sign In
2. Click 'Forgot password?' and enter mailto:ana@kyozo.com
3. Click 'Send reset link'
4. Open the password reset email and click the reset link