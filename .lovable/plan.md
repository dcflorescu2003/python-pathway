# Fix: forged Apple subscription notifications can grant free Premium

## Problem

The Apple notification verifier trusts the certificate chain that arrives inside the notification itself. It checks that the last certificate is Apple's root and that every certificate merely *parses*, but it never checks that each certificate was actually signed by the one above it (a comment in the file admits this). An attacker can therefore attach Apple's real root certificate together with their own self-made leaf certificate, sign a fake "subscription active" notification with their own key, and pass verification — granting themselves (or anyone) free Premium or Teacher access.

## Fix

Perform real certificate-chain verification before trusting the payload:

1. Verify each certificate's signature against the public key of the certificate above it, up to Apple's root.
2. Verify the root is Apple Root CA - G3 (fingerprint check, kept as-is).
3. Verify each certificate is currently within its validity dates.
4. Only then verify the notification signature with the leaf certificate's public key, and additionally check the token is not expired and belongs to this app.
5. Reject (return null) on any failure — the callers already treat null as "reject", so no behaviour changes for legitimate Apple traffic.

## Technical details

- Rewrite `supabase/functions/_shared/apple-jws.ts` to use `@peculiar/x509` (via esm.sh) for real X.509 verification: build the chain from `x5c`, call `cert.verify({ publicKey: issuer.publicKey, signatureOnly: true })` for every link, and check `notBefore`/`notAfter` on each certificate.
- Keep `jose.compactVerify` for the final JWS signature against the leaf public key, keep the existing exported function name and `Promise<Record<string, any> | null>` signature so `appstore-notifications-v2` and any other caller need no changes.
- Require a full chain (leaf + intermediate + root, length >= 3) and restrict the accepted algorithm to `ES256`, which is what Apple uses; anything else is rejected.
- After the payload decodes, sanity-check the claims: reject when `bundleId` (or `data.bundleId`) does not match the app's bundle identifier, taken from an environment value with the current bundle id as default.
- Verify the deployed function by sending a payload with a self-signed leaf plus Apple's real root and confirming it is now rejected, and by checking the function logs for legitimate notifications.
