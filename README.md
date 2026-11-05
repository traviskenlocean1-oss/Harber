# Harbor Mind

Portfolio demo by Visionary Web Studio: a therapy and counseling practice homepage built on the
structure of compasspathways.com, re-branded (copy, colors, fonts, media, logo).

- Build: `node tools/build.js` (needs `tools/src` + `tools/mirror`, fetched with `node tools/fetch-src.js`)
- Local test: `ORIGIN=http://localhost:8850 node tools/build.js`, then serve the folder on :8850
- Deploy: Cloudflare Workers (`npx wrangler deploy`) -> https://harber.traviskenlocean1.workers.dev
