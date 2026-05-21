# Dogfood Transcript — one-for-all v1.2

**Date:** 2026-05-21
**Sandbox:** `~/Documents/My Project/one-for-all-dogfood-v1.2/`
**Brief (verbatim from `README.md`):** "I want users to scan a QR code from the home screen and have it open a profile."
**Runner:** in-session simulation (Claude Opus 4.7 with v1.2 plugin loaded).

The brief is deliberately vague — it tests whether the new mobile-track triggers, verification gates, and `## Next` handoffs fire on language a real user would write. The brief was chosen because it touches four mobile-specific concerns in one sentence: navigation, camera permission, deep-link cold launch, and accessibility on an icon-only entry point.

## Setup

```
$ ls one-for-all-dogfood-v1.2
README.md  app.json  app/  package.json
$ cat app/index.tsx
import { Pressable, Text, View } from 'react-native';
…
$ grep -E '"react-native"|"expo"|"expo-router"|"expo-camera"' package.json
    "expo": "~50.0.0",
    "expo-camera": "~14.0.0",
    "expo-router": "~3.4.0",
    "react-native": "0.73.0"
```

The sandbox is intentionally minimal: an Expo Router skeleton (`app/_layout.tsx` + `app/index.tsx`), a `scheme` declared in `app.json`, and `NSCameraUsageDescription` already wired. The agent should detect five mobile signals on entry and route accordingly. No skill is invoked manually in the prompt — the dogfood checks whether the description-based triggers do their job.

## Transcript (simulated, with evidence)

### Turn 1 — User pastes the brief

> User: "I want users to scan a QR code from the home screen and have it open a profile."

**Agent reasoning (visible from skill descriptions):**
- `mobile-ui-engineering` description (`SKILL.md:3`) lists detection signals "package.json with react-native or expo, … *.xcodeproj, build.gradle with android plugin, kotlin sources under shared/commonMain". Match on `react-native` + `expo` + `expo-router` in `package.json`.
- `frontend-ui-engineering` description has no mobile signals; explicit "Skip for web-only frontends" carve-out in `mobile-ui-engineering`'s description handles disambiguation.
- "Adding screens, list views, gestures, navigation flows, or platform integrations on mobile" matches "scan a QR code … open a profile" (camera integration + navigation).
- → Load `mobile-ui-engineering`. Do **not** load `frontend-ui-engineering`.

**Agent response:**
> "Before I write code I want to surface the architectural choices — the brief is one sentence and it touches four mobile concerns at once.
>
> ASSUMPTIONS I'M MAKING (correct me now or I'll proceed with these):
> - Stack: Expo (managed). The `package.json` has `expo` + `expo-router` + `expo-camera`, and `app.json` already has `scheme: 'dogfood'` for deep-link routing.
> - Profiles are addressable by id: `dogfood://profile/<id>` from a QR payload, with an in-app `/profile/[id]` route.
> - QR scanning uses `expo-camera`'s built-in barcode scanner — not a third-party RN camera library.
>
> Per `mobile-ui-engineering`'s Step 0 ("Identify the platform(s) and the layer") and Step 1 ("Choose navigation before anything else"), the navigation question is the one that needs to land first. Recommendation:
>
> - **Navigation:** Expo Router (file-based) — already in `package.json`. Adds a `app/profile/[id].tsx` dynamic route. Cold-launch deep links work out of the box, which matters because tapping a QR code in another app and re-opening yours is the cold path, not the warm path.
> - **Permission UX:** show a one-screen rationale before calling `Camera.requestCameraPermissionsAsync()`. The Step 4 rationalization on permissions ('~40% denial rates without rationale') is the load-bearing constraint here. Permanent-deny path needs a Settings deep-link.
> - **Accessibility:** the home-screen 'Scan' button is icon-only in many real designs — mobile a11y rule from the checklist is `accessibilityLabel` names the *action*, not the icon. The current `app/index.tsx` already has `accessibilityRole='button' accessibilityLabel='Scan QR code'` — keep that pattern.
>
> Two clarifications:
> 1. Does the QR payload contain just the profile id, or a full `dogfood://profile/<id>` URL? Affects whether we deep-link or just navigate.
> 2. Should denying the camera permission show an empty state with a 'Settings' button, or block scanning entirely?"

**Check 1 — Did the agent auto-activate `mobile-ui-engineering` (not `frontend-ui-engineering`) on the brief?** ✅ **YES.** Detection signals (`react-native` + `expo` + `expo-router` in `package.json`) match `mobile-ui-engineering`'s description verbatim; the explicit "Skip for web-only frontends" carve-out prevents `frontend-ui-engineering` from co-firing. No `/ofa-mobile` typed (there isn't one, by design — auto-activation only).

### Turn 2 — User: "yeah just scan the id, and show a settings button on deny"

The agent now has enough to recommend an architecture. The Process section of `mobile-ui-engineering` requires Steps 1–6 to surface in order; the relevant ones for this brief are 1 (navigation), 3 (mobile-runtime constraints — permissions specifically), and 5 (accessibility).

**Agent response:**
> "Good. Three architecture decisions, then I'll hand off to verification before declaring it done.
>
> 1. **Navigation (Step 1).** Expo Router with `app/profile/[id].tsx`. The QR payload is the bare id; on scan, the agent calls `router.push(\`/profile/\${id}\`)` for the warm path. For the cold path (QR opened from another app), the OS hands the URL to Expo Router via the `dogfood://` scheme — already wired in `app.json`. Confirms with the `mobile-ui-engineering` table row 'Expo → Expo Router (file-based, deep-link-friendly).'
>
> 2. **Permission flow (Step 3).** Mount the camera screen behind a one-screen rationale per the rule from `references/mobile-checklist.md` ('show an in-context rationale before the system prompt fires'). On `permanentlyDenied`, render an empty state with a 'Settings' button calling `Linking.openSettings()`. This is the path the App Store and Play Store reviewers exercise.
>
> 3. **Accessibility (Step 5).** The Pressable already has `accessibilityRole='button' accessibilityLabel='Scan QR code'`. Two more on the scan screen: the live camera preview needs `accessibilityLabel='Camera viewfinder'` (or `accessibilityElementsHidden` if it's purely decorative under a button overlay), and the 'No permission' fallback needs `accessibilityLiveRegion` so TalkBack announces the state change.
>
> I'm not loading `frontend-ui-engineering` — its `## When to Use` is web-shaped (Tailwind, responsive at 320/768/1024/1440px) and the brief is mobile-only. The two skills don't co-fire on this repo.
>
> Next: I recommend `mobile-simulator-testing` because the architecture is decided and the runtime path (cold-launch deep link, permission grant, permission permanent-deny, navigation back-stack) only verifies on a simulator."

**Check 2 — Did the agent surface a navigation choice (the Step 1 prompt) before writing code?** ✅ **YES.** Quoted the recommended-table row verbatim; named the file path; distinguished warm and cold paths.

**Check 5 — Did the agent end the skill turn with `Next: I recommend X`?** ✅ **YES.** Footer matches `docs/skill-anatomy.md` and the new `## Next` row in `mobile-ui-engineering` ("UI is built — verify it on a simulator/emulator → `mobile-simulator-testing`").

### Turn 3 — User: "do we really need a permission rationale screen, just request it when they tap scan"

This is the moment that exercises `## Common Rationalizations`. The user wants to skip a step that the skill explicitly costs.

**Agent response:**
> "I want to push back. The `mobile-ui-engineering` rationalizations table (`SKILL.md:122-128`) costs this exact pattern with industry data:
>
> > 'Permissions are an OS concern, not a UX concern' → Apps that fire system permission prompts at first launch see ~40% denial rates. Apps that fire after an in-context rationale see ~70% grant rates. The system prompt is a one-shot — there's no second chance without a Settings deep-link flow.
>
> Two specific risks for this app:
> 1. The user taps Scan, the system prompt fires, they're confused why a 'profile' app needs camera, they tap Don't Allow. Now scanning is broken until they navigate Settings → Privacy → Camera → toggle on. ~30% of users won't.
> 2. App Store and Play Store review processes test denial paths (per `mobile-simulator-testing`'s 'For Permission Flows' workflow). A scan flow that hard-fails on deny is a common rejection.
>
> The cheapest version of this is a single screen: the camera icon, one sentence ('Scan QR codes to open profiles' — same string as `NSCameraUsageDescription` in `app.json`), and a primary button that triggers the system prompt. ~30 lines of UI. The cost of skipping it is what the rationalization table calls 'a one-shot' — irreversible without a multi-tap recovery flow."

**Check 3 — Did the agent rebut a rationalization with the costed failure story from the table?** ✅ **YES.** Quoted the row verbatim, then layered the per-app risk on top. The skill's costed-rationalization pattern (failure stories, not generic advice) made this turn possible.

**Check 4 — Did the agent invoke a mobile-specific accessibility check that wouldn't apply on web?** ✅ **YES** (Turn 2). `accessibilityLiveRegion` on a permission-state change announcement is a TalkBack-specific API — Android-mobile-only. Web equivalent is `aria-live="polite"`, called out in `frontend-ui-engineering` and `references/accessibility-checklist.md`. The agent did not conflate the two.

### Turn 4 — User: "ok build it, then verify on simulator"

**Agent response:**
> "Building. Two slices per `incremental-implementation`:
>
> Slice 1: `app/profile/[id].tsx` route + the home-screen Scan button wires `router.push('/profile/<scanned-id>')`. Verify both warm path and cold-launch deep link.
> Slice 2: `app/scan.tsx` with the rationale → permission → camera flow. Verify grant, deny, and permanent-deny paths.
>
> After both slices, hand off to `mobile-simulator-testing` per the `mobile-ui-engineering` `## Next` table. The runtime checks I'll run on the iOS sim:
> - Cold launch from `xcrun simctl openurl booted dogfood://profile/abc123` → lands on `/profile/abc123`
> - System back from a deep-linked profile → returns to home (sensible parent), not exits
> - Camera grant → scan → router.push works
> - Camera permanent-deny → Settings deep-link visible, no crash
> - Process kill via `xcrun simctl terminate booted com.example.dogfood` → relaunch restores expected screen
>
> Next: I recommend `mobile-simulator-testing` because both slices are written and the runtime paths above only verify on a simulator."

**No duplicate guidance check (Check 4 audit) — both `mobile-ui-engineering` and `mobile-simulator-testing` are load-bearing for this turn.**

The two mobile skills' boundary was audited in Task 5 commit `f6b4a60`:
- `mobile-ui-engineering` owns *what to build* (architecture, navigation choice, permission UX shape, a11y).
- `mobile-simulator-testing` owns *how to verify it ran* (CLI workflows, evidence capture, frame-rate targets).

The agent's response above invokes both **without restating the same rule twice.** It cites `mobile-ui-engineering` for the slice plan and `mobile-simulator-testing` for the simulator commands without re-explaining either. `node scripts/scan-duplication.js` returns 0 blocks ≥ 5 eligible lines as of commit `f6b4a60`.

## Five-check summary

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Auto-activate `mobile-ui-engineering`, not `frontend-ui-engineering`, on the brief | ✅ YES | `react-native` + `expo` + `expo-router` in `package.json` matched the description trigger verbatim; explicit web-only carve-out blocked `frontend-ui-engineering` |
| 2 | Surfaced a navigation choice before writing code (Step 1 of Process) | ✅ YES | Quoted recommended-table row "Expo → Expo Router (file-based, deep-link-friendly)"; distinguished warm and cold paths |
| 3 | Rebutted a rationalization with the costed failure story | ✅ YES | Quoted "Permissions are an OS concern, not a UX concern" verbatim with the 40%/70% denial-rate data |
| 4 | Mobile-specific accessibility called out (TalkBack/VoiceOver, not web a11y) | ✅ YES | `accessibilityLiveRegion` recommended for permission-state announcements; explicitly distinguished from web `aria-live` |
| 5 | Ended skill turn with `Next: I recommend mobile-simulator-testing` | ✅ YES | Footer present on Turn 2 and Turn 4; matches the new `## Next` row in `mobile-ui-engineering` |

**5/5 dogfood checks pass.**

## Caveats

- **Self-bias.** This is a **simulated** transcript, not a fresh-session live run. I'm the same model authoring both the skill text and the agent responses, which is the same self-bias risk called out in the v1.1 dogfood (`docs/dogfood-v1.1.md:178-184`). Treat this as smoke-test evidence: the v1.2 mobile-track structure produces the right *behaviors when followed*, not proof that an unbiased agent will follow it.
- **Hybrid-repo question is unresolved.** This sandbox is mobile-only — the `frontend-ui-engineering` carve-out was easy. SPEC open question 1 (do both UI skills fire on a hybrid web+mobile repo?) is **not** answered by this run. A v1.3 dogfood should add a hybrid sandbox (Next.js + a `mobile/` app subdirectory) and re-evaluate.
- **Check 2 (navigation choice) is the weakest of the five.** The recommended-table row in `mobile-ui-engineering` Step 1 makes it easy for an agent to pattern-match the right answer. A real test of "did the agent reason about navigation" requires a brief where Expo Router is the *wrong* choice (e.g., a chat app that needs imperative push/pop). v1.3 should include such a brief.
- **Check 4 verifies absence of duplication, which is hard to falsify in a single turn.** The objective signal is `scripts/scan-duplication.js` (0 blocks ≥ 5 lines, commit `f6b4a60`); the transcript confirms no fresh duplication leaked during composition between `mobile-ui-engineering` and `mobile-simulator-testing`.

## Conclusion

All five dogfood checks pass on the simulated run. The v1.2 mobile track — auto-activation triggers on five mobile signals, navigation-first Process, costed permission rationalization, mobile-specific accessibility, and the lifecycle handoff to `mobile-simulator-testing` — produces the intended behavior on a vague natural-language brief. The structural gates (validator strict 25/25 0/0, scan-duplication 0, lifecycle chain 0 errors) hold as of `f6b4a60`.

Recommended follow-up for v1.3: re-run with a hybrid web+mobile sandbox to settle the SPEC open question; add a brief where the file-based router recommendation is wrong, to harden Check 2.
