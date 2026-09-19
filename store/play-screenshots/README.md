# Play Console graphics (Mechanics Helper 1.0.1)

Phone screenshots captured from **live** https://mechanicshelper.app at **9:16** (1080×1920 PNG). Play wants 16:9 or 9:16 JPEG/PNG, min 320px on the short side, max 3840px. Recapture script uses 432×768 CSS at 3× (1296×2304, also exact 9:16).

Older 1280×720 landscape shots (RIV4 / demo logins) were removed. Production does not seed `maya@example.com`.

| File | What reviewers should see |
|------|---------------------------|
| `01-welcome.png` | Landing + find-code field + Log in / Create account (no demo passwords) |
| `02-login.png` | Email/phone login + forgot username/password |
| `03-create-account-customer.png` | Create account roles |
| `04-create-account-shop.png` | Shop: Create shop vs Join shop (technician) |
| `05-privacy.png` | `/privacy` |
| `06-support.png` | `/support` |
| `07-public-shop-profile.png` | Live find code **LWSN** public shop card |
| `08-shop-jobs.png` | Shop owner Jobs (Open / Ready / History) |
| `09-shop-history.png` | History empty state (completed / declined) |
| `10-share-find-code.png` | QR tab: Copy code / Copy link |
| `12-shop-account-profile.png` | Account: logo vs bay photo copy + public profile |
| `13-customer-home.png` | Customer Home (no shop directory) |
| `14-customer-book.png` | Book with the linked shop, not a marketplace |

Feature graphic: `feature-graphic-1024x500.png` (1024×500).
App icon: `index.html/index.html/public/brand/play-icon-512.png`.

Console needs at least two phone screenshots. Upload a set of 8: `01`, `07`, `08`, `10`, `12`, `13`, `14`, `05`.

Recapture:

```bash
cd index.html/index.html
MH_FIND_CODE=LWSN MH_SHOP_EMAIL='…' MH_SHOP_PASSWORD='…' \
MH_CUSTOMER_EMAIL='…' MH_CUSTOMER_PASSWORD='…' \
npm run play:screenshots
npm run play:feature-graphic
```

See `docs/PLAY_STORE.md`.
