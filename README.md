# AKA Speed Test

A functional black-and-white internet speed test built for Cloudflare Pages + Pages Functions.

## Features
- Real browser download throughput test
- Real upload throughput test
- Ping and jitter
- IP, approximate location and network information
- Local test history
- Responsive AKA black-and-white UI

## Deploy to Cloudflare

### Recommended: GitHub + Cloudflare Pages
1. Upload this project to a GitHub repository.
2. Open Cloudflare Dashboard → Workers & Pages → Create Application → Pages.
3. Connect the GitHub repository.
4. Framework preset: None.
5. Build command: leave empty.
6. Build output directory: `/`
7. Deploy.

Cloudflare automatically deploys the `functions/api/` folder as Pages Functions.

### Important
Do NOT deploy only `index.html`, `style.css`, and `script.js` using plain static hosting if you want the speed test backend. The `functions/api/` folder is required.

## Local testing
Install Wrangler and run:

    npx wrangler pages dev .

Then open the local URL shown by Wrangler.

## Note on accuracy
Results depend on the user's browser, CPU, Wi-Fi/router, Cloudflare edge location, and connection quality. For a global production-grade speed test network, dedicated geographically distributed test servers are recommended.
