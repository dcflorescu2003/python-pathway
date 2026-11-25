# Agent rules

- Public SEO/web-ad pages (e.g. /pseudocod) are wrapped in WebOnly so they never render inside the native apps; web ad code must stay behind Capacitor.isNativePlatform() checks — keeps store apps free of web ads.
- Resolve class leaderboard names through leaderboardIdentity and scope class-row cache by viewer ID, so missing nicknames never reveal roster names and accounts do not share cached class data.
- Keep pseudocode simulation traces in the shared interpreter with optional recording; this prevents normal execution and step-by-step execution from diverging. Normalize simulator syntax without removing source lines and bound both frame count and trace size to keep highlighting accurate and memory usage safe.
