# Agent rules

- Public SEO/web-ad pages (e.g. /pseudocod) are wrapped in WebOnly so they never render inside the native apps; web ad code must stay behind Capacitor.isNativePlatform() checks — keeps store apps free of web ads.
- Resolve class leaderboard names through leaderboardIdentity and scope class-row cache by viewer ID, so missing nicknames never reveal roster names and accounts do not share cached class data.
