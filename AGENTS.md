# Agent rules

- Public SEO/web-ad pages (e.g. /pseudocod) are wrapped in WebOnly so they never render inside the native apps; web ad code must stay behind Capacitor.isNativePlatform() checks — keeps store apps free of web ads.
- Resolve class leaderboard names through leaderboardIdentity and scope class-row cache by viewer ID, so missing nicknames never reveal roster names and accounts do not share cached class data.
- Keep pseudocode simulation traces in the shared interpreter with optional recording; this prevents normal execution and step-by-step execution from diverging. Normalize simulator syntax without removing source lines and bound both frame count and trace size to keep highlighting accurate and memory usage safe.
- Maintain exactly one sitemap, public/sitemap-pages.xml (referenced by robots.txt), and add every new public web-only route to it in the same change — avoids split or stale sitemaps.
- Test single-device lock lives in DB RPCs (claim_submission_device / allow_submission_new_device) with a trigger blocking direct writes to device_* columns; the client only sends a per-submission localStorage token — keeps the lock unforgeable from the browser.
