# Asset Tracking — Submission

**Live demo:** [placeholder — Vercel URL]

## Running locally

```bash
pnpm install
cp starter/.env.example starter/.env
# Edit starter/.env with your API_BASE_URL and API_TOKEN
pnpm dev   # API on :8080, starter on :3000
```

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `API_BASE_URL` | Yes | Upstream API including `/v1` — e.g. `https://your-api.railway.app/v1` |
| `API_TOKEN` | Yes | Server-only bearer token. Never use `NEXT_PUBLIC_API_TOKEN`. Browser requests go through `/api/upstream/*` which attaches it server-side. |

Both variables are server-side only. The browser never sees them. The default values in `.env.example` work for local development as-is.

---

## Three Calls I Nearly Made the Other Way

**1. Serial field as ScanInput (Enter to confirm) vs. plain text input**

The starter's `<ScanInput>` fires `onScan` on Enter and clears — correct for a barcode scanner that types and submits. But the serial number on a packing slip is usually handwritten or on a secondary label that requires manual typing. I started with `ScanInput` for serial and immediately noticed the problem: the tech types the serial, hits Enter to move to the next field, and instead the value fires and clears. Switched to a plain `<input>` that updates on every keystroke. The tag field still supports Enter via `onKeyDown` since that's where the USB scanner fires. The distinction matters: one field receives machine input, the other receives human input.

**2. Location scanning (parse a barcode string) vs. dropdowns**

The brief implies scanning a rack location barcode like `Lab-Building-A/Bay-12/Aisle-3/A-01/U10`. I built this first and it worked — but it required techs to have the right barcodes, and a scan of a slightly wrong label silently produced a bad location string. Switched to structured dropdowns (site → room → rack → RU) for two reasons: (a) the location space is finite and known, so a dropdown is faster than scanning, and (b) it makes incomplete deploy locations impossible to submit — the RU field defaults to empty and the button stays disabled until selected. The brief asks for a "clear on-screen error" when RU is missing; with dropdowns, the error is structural rather than post-submission, which is better UX.

**3. Write-backs in the browser vs. server route handler**

A deploy scan needs to write to both facilities and finance after it commits to ops. The first draft did this from the browser: after `api.scans.deploy()` succeeded, fire two more POSTs from the client. This works but it means the write-backs happen in user-land where they can be interrupted (tab close, network drop) without any logging. Moved all three calls into `app/api/scans/deploy/route.ts`: the browser hits one Next.js route, which calls ops, then fires both write-backs in parallel with `Promise.allSettled`. Write-back failures are logged server-side but don't fail the scan — the scan is the contract, the write-back is bookkeeping. Same argument applies to the store de-rack in `app/api/scans/store/route.ts`.

---

## Microcopy I'm Proud Of

**The serial mismatch error on receive.**

When a tech scans a tag that already exists with a different serial, the error reads:

> "Please check the serial number on the box and try again."

With a two-row comparison below it showing "Serial on file" vs "Serial you entered."

I nearly wrote: *"This tag is already registered to a different serial number."* That describes what happened. What I wrote instead describes what to do. At 11pm with a scanner in one hand and a 40lb instrument in the other, the tech needs the second one.

---

## What I Chose Not to Build and Why

**Inline editing of asset records.** The brief is explicit: no manual edits, scans are the contract. An edit form would undermine the audit trail the event log exists to protect. Every state change should have a scan payload and a user ID attached.

**Bulk actions on the manager list.** The manager's job is to investigate individual assets and act on specific drift. A bulk dispose or bulk transfer button would encourage exactly the kind of mass manual override that creates reconciliation problems downstream.

**RMA workflow UI.** The state machine supports `rma_open` and `rma_receive_back`. I show appropriate error messages when a tech tries to store or deploy an RMA-pending asset, but there's no `/tech/rma` page. The state transitions are guarded; the UI surface just isn't exposed.

**Offline scan queueing.** Every scan commits immediately to the API. The brief lists this explicitly as out of scope. Adding a service worker queue would require conflict resolution logic that's outside the challenge scope — and would block the tech from knowing immediately whether the scan committed.

**Camera scanning on location fields.** The location inputs are dropdowns. A camera scan of a rack label would need to parse an arbitrary string format — fragile, slower than a dropdown tap, and would still require maintaining a separate set of rack-level barcodes with RU encoded. Camera is reserved for asset tags and badges, where the value is short, canonical, and machine-generated.

**Pagination controls beyond prev/next.** Jump-to-page is noise at 25 rows per page. The state filter cards at the top of the manager list let a manager narrow to a specific state bucket instantly — that's faster than navigating pages.

---

## Design Decisions

**Dark mode for both tech and manager views.**
The tech user is a lab technician at 11pm in a cold dock bay — a bright white screen is hard on the eyes in low light. Dark mode reduces eye strain and makes the UI feel purpose-built for that environment. The manager dashboard is also dark because high-contrast light text on dark backgrounds makes it faster to scan for critical information: red action items, amber warnings, and green clean counts read immediately without the eye having to parse a busy light interface. The contrast hierarchy does the prioritization work before the manager reads a single word.

**Phase-based state machines on every scan page.**
Each scan page uses a discriminated union type (`Phase`) rather than separate `loading`, `error`, and `success` booleans. This was more code upfront but paid off immediately: the `bad_state` phase lets us show the full asset card before surfacing the error, so a tech can verify they scanned the right thing before being told they can't proceed. The `looking_up` phase keeps the UI honest about network activity. No surprise blank screens or stale data.

**Serial mismatch shows both serials side by side.**
When a tag exists with a different serial, most UIs would say "error." We show a two-row comparison: serial on file vs. serial you entered. The tech can look at the box, look at the screen, and immediately know which is wrong — no guessing, no need to escalate until they've checked the physical label.

**Session scan history on all tech pages.**
After each successful scan, the last 5 scans appear inline below the input. A tech doing 40 receives in a row can glance down and verify the last few without navigating away. This is in-memory only — it clears on refresh intentionally. The session history is for the shift; the permanent audit trail is in the event log.

**Camera scanner with sound and haptic feedback.**
The camera scanner plays a rising two-tone beep on success, a flat mid-tone on hold-still warning, and a descending two-tone on invalid scan. Each has a matching haptic pattern via `navigator.vibrate()`. The sound language is deliberate: rising = good, flat = neutral warning, falling = problem. A tech with gloves on can't always look at the screen — the audio and haptic tells them whether to move on or try again.

**QR codes instead of Code 128 font barcodes.**
The initial `/dev/barcodes` page used the Libre Barcode 128 Text Google Font to render Code 128 barcodes. These looked correct but were not reliably scannable by `@zxing/browser` — the font rendering doesn't produce precise enough bar widths for consistent optical decoding. Switched to `qrcode.react` which generates actual QR code SVGs that scan reliably from both a screen and a print.

**Reconciliation in three categories, not one list.**
The brief is explicit: a good report sorts disagreements into buckets. Action Required, Investigate, and Expected gaps are the three buckets. Expected is collapsed by default because it's the largest category and contains no actionable items — a stored asset not appearing in facilities is correct behavior, not drift. The manager sees action count first, investigation count second, and expected gaps only if curious. The report also shows a timestamp and refresh button so the manager knows if they're acting on fresh data.

**Write-backs are server-side and non-fatal.**
Deploy writes to facilities and finance. Store from in-service de-racks from facilities. Both happen in Next.js route handlers, not the browser. Two reasons: the API token never touches the client, and write-back failures are logged server-side without failing the scan. If a write-back fails, the scan is still committed. The failure surfaces as reconciliation drift on the next report — which is the correct escalation path.

**Receive form asks only for tag, serial, and dock location.**
A tech at a receiving dock doesn't have model or manufacturer information — that lives in the purchase order, which is finance's domain. Asking for it creates friction and produces bad data (techs guess or leave it blank). The receive form collects only what the tech physically has in front of them: the asset tag barcode, the serial number label, and the dock they're standing at. Model and manufacturer default to `"Unknown"` and can be reconciled against the finance record later.

---

## Pushback on the Brief and Starter

**`and_match_failed` is a likely typo.** The API returns error code `"and_match_failed"` when a receive scan finds the tag exists with a different serial. This reads like it should be `"tag_match_failed"` or `"serial_match_failed"` — the `and` prefix doesn't match any other error code pattern in the API. I branch on this code exactly as documented to match actual API behavior, but noting it as an inconsistency. I also handle it client-side before hitting the API (by checking the existing serial against the entered serial) so the error is surfaced immediately without a round-trip.

**The starter's `<ScanInput>` is a poor fit for the serial number field.** It fires `onScan` on Enter and clears the input — correct for a barcode scanner, wrong for a field where a human types a serial from a packing slip. The component has a good design for its intended use; the issue is applying it to a field that receives human input rather than scanner input. I replaced the serial field with a plain `<input>` and kept `ScanInput` only where a physical scanner would fire.

**The brief implies location scanning for deploy but that UX is worse than dropdowns.** "Scan a deploy location missing ru" implies the tech scans a barcode string like `Lab-Building-A/Bay-12/Aisle-3/A-01/U10`. In practice, this means maintaining a separate library of rack-level barcodes with RU encoded — which no standard rack labeling system does. I used structured dropdowns and validated RU client-side, which makes the incomplete-location error impossible to trigger rather than just catchable after submission.

**`decodeFromVideoDevice` was removed in later versions of `@zxing/browser`.** The method is referenced in most documentation and tutorials but throws at runtime in current versions. The correct approach is `decodeFromVideoElement` with a manually acquired `getUserMedia` stream. This took time to debug and isn't documented clearly in the library's README.

---

## Architecture Notes

**Why `lib/reconcile.ts` is extracted from the route handler.** The reconciliation logic is the most testable part of this submission. A future test can call `runReconciliation()` directly, mock the API client, and assert on the report shape without spinning up a Next.js server. The route handler is intentionally thin — just `try/catch` around the function call.

**Parent-child assets.** Every asset has a `parent_asset_tag` field. Nothing in the UI uses it, but the schema supports it. Adding parent-child traversal to the asset detail or reconciliation report would be a natural extension and wouldn't require schema changes.

**Offline scan queueing.** If added, it would slot between the submit button and the fetch call in each scan page. The `Phase` state machine already has a `submitting` phase; a `queued` phase would fit naturally before it without restructuring the component.
