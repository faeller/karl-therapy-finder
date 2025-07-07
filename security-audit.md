# Security Audit Findings

This document outlines the security vulnerabilities and areas for improvement found during a security audit of the Karl Therapy Finder application.

## Critical Vulnerabilities

### 1. Timing Attack Vulnerability in Admin Authentication

- **File:** `server/utils/admin-auth.ts`
- **Vulnerability:** The `validateAdminToken` function uses a non-constant-time string comparison (`===`) to verify the HMAC signature of the admin token. This makes the application vulnerable to timing attacks, where an attacker could potentially forge a valid token by measuring the response time of the server.
- **Recommendation:** Replace the direct string comparison with `crypto.timingSafeEqual()` to perform a constant-time comparison of the signatures.

### 2. Timing Attack Vulnerability in Admin Login

- **File:** `server/api/admin/login.post.ts`
- **Vulnerability:** The admin login endpoint uses a non-constant-time string comparison (`!==`) to validate the admin password. This is also vulnerable to timing attacks, allowing an attacker to potentially guess the admin password by measuring server response times.
- **Recommendation:** Use `crypto.timingSafeEqual()` to compare the provided password with the stored admin password in a constant-time manner.

## Other Security Concerns and Recommendations

### 1. Disabled Duplicate Email Check in Waitlist

- **File:** `server/api/karl-waitlist.post.ts`
- **Issue:** The code to check for duplicate email addresses when a user signs up for the waitlist is commented out. This could allow a single user to be added to the waitlist multiple times, potentially spamming the system.
- **Recommendation:** Re-enable the duplicate email check to prevent multiple sign-ups from the same email address.

### 2. Logging of Sensitive Information

- **File:** `server/api/karl-waitlist.post.ts`
- **Issue:** The user's email address is logged to the console when they are added to the waitlist. In a production environment, this could expose sensitive user data in the server logs.
- **Recommendation:** Remove the `console.log` statement that logs the user's email address.

### 3. Storage of Unencrypted Personally Identifiable Information (PII)

- **File:** `server/database/schema.ts`
- **Issue:** The `plz` (postal code) is stored unencrypted in the `karl_waitlist` table. While the rest of the user profile is encrypted, the PLZ is still considered PII.
- **Recommendation:** Encrypt the `plz` along with the rest of the user profile data. If the PLZ is needed for analytics, consider using a one-way hash of the PLZ instead of storing it in plaintext.

### 4. Lack of Input Sanitization on Admin Dashboard

- **File:** `app/pages/admin/dashboard.vue`
- **Issue:** The admin dashboard displays data from the database without explicit sanitization. While the data is rendered as text and not as HTML, which mitigates the risk of XSS, it is still a good practice to sanitize all data that is displayed to the user.
- **Recommendation:** Implement a data sanitization library on the frontend to ensure that all data displayed on the admin dashboard is properly sanitized.
