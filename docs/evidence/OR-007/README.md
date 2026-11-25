# OR-007: Miner Portal on a phone over a slow network

Tested 25 Nov 2026 on a production build of `Beldium-Miner-Hub`
(`NITRO_PRESET=node-server bun run build`), served locally against a local
backend, in the browser preview at 375 × 812 (phone width).

**How the numbers were taken.** The browser preview has no network throttling,
so each page's bytes were read from the browser's Resource Timing entries and
the Slow 4G time was worked out from them: 1.6 Mbit/s down plus about 0.6 s of
round trips (the Lighthouse "Slow 4G" profile). JS and CSS are counted at their
gzip size, because Vercel compresses them; images are counted as they are.
Local load times were all under 0.3 s and are not a useful measure.

| Page (375 px)                  | Before: bytes (raw / on the wire) | Before: Slow 4G | After: bytes (raw / on the wire) | After: Slow 4G | Heaviest requests before                                  |
| ------------------------------ | --------------------------------- | --------------- | -------------------------------- | -------------- | --------------------------------------------------------- |
| Landing `/`                    | 2,844 KB / ~2,380 KB              | ~12.8 s         | 656 KB / ~235 KB                 | ~1.8 s         | `leftside-animation.gif` 2,139 KB, main JS 355 KB, CSS 85 KB, `logo.png` 65 KB |
| Sign up `/signup` → `/verify`  | 650 KB, then 2,139 KB more in the background (fetched twice in the flow) | ~1.6 s to use, ~12 s more of data | 650 KB / ~195 KB, no background download | ~1.6 s | hidden `leftside-animation.gif` 2,139 KB × 2 |
| Sign in `/auth`                | 638 KB                            | ~1.6 s          | 638 KB, no background download   | ~1.6 s         | main JS 355 KB, CSS 85 KB                                 |
| Application `/application`     | ~790 KB                           | ~1.8 s          | 770 KB / ~225 KB                 | ~1.7 s         | main JS 355 KB, CSS 85 KB, `Combination` 55 KB            |
| Verification status `/portal` (under review) | ~814 KB             | ~1.9 s + API    | ~766 KB                          | ~1.7 s + API   | main JS 355 KB, CSS 85 KB, `logo.png` 65 KB               |
| Active dashboard `/portal`     | 814 KB, 41 requests (9 API)       | ~1.9 s + API    | 766 KB, 41 requests              | ~1.7 s + API   | main JS 355 KB, CSS 85 KB, `logo.png` 65 KB               |

## What changed

- `leftside-animation.gif` (2.1 MB) replaced by `leftside-animation.webp`, an
  animated WebP of the same frames (411 KB). Phones get a still frame,
  `leftside-still.webp` (54 KB), through `<picture>`: on the landing page the
  background sits under an 85% overlay, so the motion is barely visible there.
- The sign-in side panel (`auth-layout.tsx`) is hidden below 1024 px but its
  image was still downloaded. It is now `loading="lazy"`, so phones never fetch it.
- `logo.png` was 512 × 512 (65 KB) and is shown at 36 to 48 px. It is now
  160 × 160 (17 KB), with width and height set so the header does not shift.
- On the application page the "Draft saved locally" chip overlapped the logo at
  375 px. It now shows from 640 px up.

## Found but not changed (follow-ups)

- **API waterfall on the dashboard.** `/auth/me/` → `/organisations/` → six
  parallel calls: three round trips, each with a CORS preflight because of the
  `Authorization` header. `/organisations/` and `/mining/sites/` are each called
  twice. On Slow 4G (150 ms RTT) this adds about 1 s before data appears. Fixing
  it means changing query keys and possibly the API, so it was left.
- **Suspended members.** A member whose membership is suspended sees "Your
  account setup isn't finished" instead of being told they are suspended
  (`before-06-suspended-member-375.jpg`).
- **Main bundle.** 355 KB raw (112 KB gzip) on every page. Normal for React,
  TanStack Router and Query; no single large library to lazy-load was found.

## Screenshots

`before-*.jpg` were taken before the change and `after-*.jpg` after it, all at
375 px. The suspended and under-review states were produced on the local
database only, by suspending a local test membership and setting the local demo
organisation to `under_review`; both were reverted afterwards.
