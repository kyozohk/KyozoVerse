# KYPRO-69

Actual result: When an existing http://kyozo.com account signs IN (as opposed to signing UP) on a community page, the user is NOT added to that community's audience. The user remains invisible to the community admin and must be manually imported to appear in the Audience list. This behaviour is inconsistent with the sign-up flow, where a new user who signs up on a community page IS automatically added to the audience.
Assignee: Ashok
Bug title: Signing into a http://kyozo.com community page as an existing user does not enroll the user in the community audience
Category: Functional
Environment: Production
Expected result: Authenticating on a community's public page (sign-in or sign-up) should enroll the user as a member of that community. The user should appear in the Audience list in http://pro.kyozo.com immediately after signing in.
Notes: Confirmed with mailto:ana+hulkuser@kyozo.com signing into http://kyozo.com/qa-test-community-new — user was absent from the QA Test Community New audience. Contrast: ana+kyozouser who signed UP on http://kyozo.com/ashok-kyozo was automatically added to Ashok@Kyozo's audience. Related to KYPRO-68: despite not being in the audience, ana+hulkuser still gained full admin access to http://pro.kyozo.com after being manually imported — the enrollment bug compounds the auth boundary issue.
Page/Feature: http://kyozo.com community sign-in / Audience enrollment
Priority: Medium
Reported at: April 9, 2026 6:09 PM
Reporter: Anastasia Starko
Reproducibility: Always
Screenshot: https://www.loom.com/share/4e4197f064214bb79b6178302fd54427
Severity: Medium
Status: New
Steps to reproduce: 1. Ensure a http://kyozo.com account already exists (e.g. mailto:ana+hulkuser@kyozo.com).
2. Navigate to a http://kyozo.com community page (e.g. http://kyozo.com/qa-test-community-new).
3. Click Sign In (not Sign Up) and log in with the existing account credentials.
4. In http://pro.kyozo.com, open the same community and check the Audience list.
5. Observe that the signed-in user does not appear in the audience.