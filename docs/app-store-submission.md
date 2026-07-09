# App Store submission — BackpackLink iOS

Everything needed to submit **BackpackLink 1.0.0** to the App Store. Copy the drafted
text straight into App Store Connect (ASC).

---

## 1. Status

| Item | State |
|---|---|
| Build `1.0.0 (9)` | Uploaded to App Store Connect |
| Bundle ID | `com.backpacklink.app` |
| Team | `UF647J47K8` (Didarul Islam) |
| Signing | Manual, profile `backpack`, `ios/ExportOptions.plist` |
| Devices | iPhone only (`TARGETED_DEVICE_FAMILY = 1`) — no iPad screenshots needed |
| Export compliance | `ITSAppUsesNonExemptEncryption = false` — no encryption questions in ASC |
| Privacy Policy URL | Live at `/privacy` (required — was missing) |
| Account deletion (5.1.1(v)) | **Done** — Account → Security → Delete account |
| User-generated content (1.2) | **OPEN — see §9. This will get you rejected as-is.** |

Release build command (reproducible):

```bash
cd apps/mobile
flutter build ipa \
  --dart-define=API_URL=https://api.backpacklink.com \
  --export-options-plist ios/ExportOptions.plist

# ALWAYS check the version inside the IPA before uploading:
unzip -p build/ios/ipa/backpacklink.ipa Payload/Runner.app/Info.plist > /tmp/i.plist
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" /tmp/i.plist   # must be > last uploaded

xcrun altool --upload-app --type ios -f build/ios/ipa/backpacklink.ipa \
  --apiKey 2YN9D696SQ --apiIssuer 697ba8d5-d31e-4bc0-b0f7-bdf3e7e562e4
```

---

## 2. App Information

| Field | Value |
|---|---|
| **Name** (30 max) | `BackpackLink: Travel eSIM` (25) — the name is search-indexed, so the keyword earns its place |
| **Subtitle** (30 max) | `Instant travel eSIM data plans` (30) — alt: `Travel eSIM for 200+ countries` (30) |
| **Primary category** | Travel |
| **Secondary category** | Utilities |
| **Content rights** | Does not contain, show, or access third-party content |
| **Age rating** | 4+ (assuming the UGC decision in §9 lands on moderation) |

---

## 3. Version 1.0.0 metadata

**Promotional text** (170 max, editable without a new build):

```
Land, scan, and you're online. Instant eSIM data for 200+ countries — no roaming bills, no physical SIM, and your own number keeps working.
```

**Keywords** (100 max, comma-separated, no spaces — don't repeat the app name):

```
esim,travel,data,roaming,sim,international,prepaid,internet,hotspot,tourist,abroad,connectivity
```

**Description** (4000 max):

```
Land, scan, get online.

BackpackLink gives you instant mobile data in 200+ countries — no roaming bills, no
queuing for a local SIM, and no swapping the tiny tray card you'll inevitably lose. Buy
an eSIM before you fly, scan the QR code, and you're connected the moment you land.

WHY TRAVELLERS USE BACKPACKLINK

• Instant delivery — your eSIM appears in your account seconds after payment.
• 200+ destinations — country, regional and worldwide plans in one place.
• Keep your number — your eSIM runs alongside your normal SIM, so calls and texts still reach you.
• No roaming shock — transparent prepaid pricing, paid once, up front.
• Hotspot ready — tether your laptop and travel companions on most plans.
• Up to 5G — full speed wherever the local network supports it.
• Top up anytime — running low? Add data to the same eSIM in a couple of taps.

HOW IT WORKS

1. Search your destination and pick the data, validity and speed that suit your trip.
2. Pay securely by card.
3. Scan the QR code from your account, and you're online.

TRACK YOUR DATA
See exactly how much data is left on each eSIM, check coverage before you travel, and keep
every order and QR code in one place.

HELP WHEN YOU NEED IT
Chat with our support team from inside the app, browse install guides and troubleshooting,
and read tips from other travellers.

REQUIREMENTS
An eSIM-capable, carrier-unlocked iPhone. Plans are data-only unless the plan says otherwise.

BackpackLink is a reseller of global eSIM connectivity. Coverage and speeds depend on our
local network partners in each destination.
```

| URL field | Value |
|---|---|
| Support URL (required) | `https://www.backpacklink.com/support` |
| Marketing URL | `https://www.backpacklink.com` |
| Privacy Policy URL (required) | `https://www.backpacklink.com/privacy` |
| Copyright | `2026 BackpackLink` |

---

## 4. App Privacy answers

Derived from what the code actually stores — not guesswork.

**Do you or your third-party partners collect data from this app?** → **Yes**

| Category | Data type | Linked to user | Used for | Tracking |
|---|---|---|---|---|
| Contact Info | Email address | Yes | App Functionality | No |
| Contact Info | Name *(optional)* | Yes | App Functionality | No |
| Contact Info | Phone number *(optional)* | Yes | App Functionality | No |
| Purchases | Purchase History | Yes | App Functionality | No |
| Identifiers | User ID | Yes | App Functionality | No |
| User Content | Customer Support | Yes | App Functionality | No |
| User Content | Other User Content *(community tips)* | Yes | App Functionality | No |

**Used for tracking?** → **No.** The app bundles no analytics, advertising, or attribution
SDKs (dependencies are only `http`, `provider`, `shared_preferences`, `qr_flutter`,
`url_launcher`, `socket_io_client`). No ATT prompt is required.

**Payment data** → *not collected by us.* Card details go directly to Stripe's hosted
checkout and never touch our servers.

**Device permissions requested** → **none.** No camera, location, contacts, photos, or
microphone. QR codes are *rendered* on screen, never scanned.

**Account deletion available in-app?** → **Yes** (Account → Security → Delete account).

---

## 5. App Review Information

**Sign-in required:** Yes.

| Field | Value |
|---|---|
| Email | `demouser@gmail.com` |
| Password | *Not stored in this repo.* Enter it directly into ASC → App Review Information. |

Verified: the account exists on production and signs in.

> This is a live production credential — deliberately kept out of git. Type it straight
> into App Store Connect.

> ⚠️ **This account has 0 orders and 0 eSIMs.** A reviewer therefore sees an empty
> "My eSIMs" tab and cannot reach the core experience (QR code + data usage), because
> buying a plan needs a real card on Stripe's hosted checkout. A 100%-off coupon will not
> help — checkout passes `order.retailPrice` to Stripe, and Stripe rejects a zero amount.
>
> **Recommended:** buy the cheapest plan once on `demouser@gmail.com` before submitting, so
> the reviewer can open a real eSIM. Otherwise expect a Guideline 2.1 "unable to evaluate"
> query, and say plainly in the review notes that eSIMs appear only after purchase.

**Review notes** — paste this in:

```
BackpackLink sells prepaid eSIM mobile-data plans for international travel.

PURCHASES / IN-APP PURCHASE
eSIM plans are telecommunications services consumed outside the app — they provide
cellular data on the device's modem in the destination country. Per Guideline 3.1.5(a),
"Goods and Services Outside of the App", these are purchased with a payment method other
than in-app purchase. Checkout opens Stripe's hosted, PCI-compliant checkout page. No app
features or content are unlocked by a purchase.

ACCOUNT DELETION (Guideline 5.1.1(v))
Sign in, then: Account tab -> Security -> "Delete account". It requires the account
password and permanently deletes the account and its personal data.

PERMISSIONS
The app requests no device permissions — no camera, location, contacts, photos, or
tracking. eSIM QR codes are displayed on screen, not scanned.

DEMO ACCOUNT
Email:    demouser@gmail.com
Password: <type the demo password here — not stored in the repo>

SUPPORT
In-app: Account -> Chat with support. Web: https://www.backpacklink.com/support
```

If the Community tab ships (see §9), append:

```
USER-GENERATED CONTENT (Guideline 1.2)
The Community tab lets travellers post short text tips. Posts are filtered on submission,
every post can be reported from its "..." menu, abusive users can be blocked by any user,
and our moderators review reports within 24 hours. Contact: support@backpacklink.com
```

---

## 6. Screenshots

Required: **iPhone 6.9"** — `1320 × 2868` or `1290 × 2796`. Minimum 1, maximum 10.
No iPad set needed (iPhone-only app).

Suggested set (5): Home/hero → Destinations → Plan detail → My eSIMs (QR) → Community.

Capture them from a simulator, in **release** mode so there's no debug banner:

```bash
cd apps/mobile
xcrun simctl boot "iPhone 16 Pro Max"          # 6.9"
open -a Simulator
flutter run --release -d "iPhone 16 Pro Max" --dart-define=API_URL=https://api.backpacklink.com
# navigate to each screen, then for each:
xcrun simctl io booted screenshot ~/Desktop/bpl-01-home.png
```

---

## 7. Pricing & availability

- **Price:** Free (the app is free; plans are bought via external payment).
- **Availability:** All territories, unless you want to restrict.

---

## 8. Pre-submission checklist

- [ ] Build `1.0.0 (9)` finished processing in ASC
- [ ] Screenshots uploaded (6.9")
- [ ] Description, keywords, subtitle, promotional text filled
- [ ] Support URL + Privacy Policy URL set
- [ ] App Privacy questionnaire completed (§4)
- [ ] Age rating questionnaire completed
- [ ] **Demo account created and entered** in App Review Information
- [ ] Review notes pasted (§5)
- [ ] **Guideline 1.2 decision made and shipped** (§9)
- [ ] Export compliance — should be skipped automatically
- [ ] Pricing set to Free

---

## 9. ⚠️ Open blocker — Community tips are unmoderated UGC

`Community` is a main bottom-nav tab. It displays other travellers' posts with their
author names, and posts are **auto-approved** the moment they're submitted
(`apps/api/src/routes/community.ts`). There is **no in-app reporting, no user blocking,
and no content filtering** anywhere in the app or API — only an admin-side "hide".

App Review Guideline **1.2 (Safety — User-Generated Content)** requires *all* of:

1. a method for filtering objectionable material from being posted;
2. a mechanism to report offensive content, with timely responses;
3. the ability to block abusive users;
4. published contact information.

Only (4) exists today. Apps that ship open UGC without (1)–(3) are routinely rejected.

**Options**

| Option | Effort | Notes |
|---|---|---|
| **A. Add moderation** — report endpoint + block list + profanity filter, with report/block in the post's overflow menu | ~half a day | Keeps the feature; satisfies 1.2 properly. Recommended if Community matters. |
| **B. Hide the Community tab for 1.0** | ~15 min + rebuild | Fastest route to approval; ship Community in 1.1 with moderation. |
| **C. Submit as-is** | 0 | Likely rejection under 1.2; costs a review cycle (~1–3 days). |

---

## 10. Known gaps (not App Store blockers)

- **No password reset.** There is no email infrastructure in the codebase at all, so
  self-service reset can't work. Users must contact support. Documented honestly on
  `/password-policy`. Adding email (reset + emailing the eSIM QR) is a worthwhile follow-up.
- **Nothing is ever emailed.** The homepage, Terms and Privacy pages previously claimed the
  QR code was emailed; that copy has been corrected. Stripe issues the payment receipt.
- **`APP_VERSION` env is still `0.1.0`**, so web/admin footers show `v0.1.0`. Cosmetic —
  set it to `1.0.0` on the server when convenient.
- **Change password is app-only.** The web account page has no change-password form yet.
