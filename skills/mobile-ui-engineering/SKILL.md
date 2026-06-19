---
name: mobile-ui-engineering
description: Guides agents through production-quality mobile UI architecture — navigation, state, lists, gestures, app lifecycle, and platform accessibility — across React Native/Expo, Flutter, native iOS (Swift/SwiftUI), native Android (Kotlin/Jetpack Compose), and Kotlin Multiplatform (KMP). Use when the project ships a mobile app: detect via package.json with react-native or expo, pubspec.yaml with flutter, *.xcodeproj or Package.swift, build.gradle with the android plugin, or kotlin sources under shared/commonMain. Use when adding screens, list views, gestures, navigation flows, or platform integrations on mobile. Skip for web-only frontends — use frontend-ui-engineering instead.
workflow_mode: standard
max_context_files: 6
default_output: evidence-heavy
---

# Mobile UI Engineering

## Overview

Build production-quality mobile UI across the five mainstream stacks. Mobile is its own discipline — app lifecycle, OS permissions, offline behavior, platform navigation idioms, and store policies have no real analogue on the web. The goal is UI that respects each platform's Human Interface Guidelines (iOS HIG) and Material Design 3 (Android), reuses shared logic where it pays, and treats unreliable networks and aggressive process termination as the default — not edge cases.

Use [`references/lean-senior-sdlc.md`](../../references/lean-senior-sdlc.md)
to choose platform-native behavior before wrappers and to keep permission,
lifecycle, offline, and accessibility handling inside the minimum viable mobile
slice.

This skill covers the architecture decisions; runtime verification on simulators/emulators belongs to `mobile-simulator-testing`.

## When to Use

- Building or modifying screens in a React Native, Expo, Flutter, native iOS, native Android, or KMP project
- Adding navigation, lists, gestures, forms, or platform integrations (camera, push, deep links)
- Choosing a state-management approach for mobile-shared logic
- Diagnosing UI architecture issues: re-render storms, list jank, broken back-stack, lifecycle bugs

**When NOT to use:**
- Web-only frontends — use `frontend-ui-engineering`
- Pure backend or API work — use `api-and-interface-design`
- Runtime debugging on a simulator/device — use `mobile-simulator-testing`
- App Store / Play Store submission workflows — out of scope for v1.2 (see `shipping-and-launch` for general release patterns)

## Core Process

### Step 0: Identify the platform(s) and the layer

Before architecting anything, name the stack and the layer the change lives in. Mobile decisions cascade differently than web ones — getting this wrong wastes a lot of code.

```
DETECT THE STACK:
  package.json has "react-native" or "expo"  → React Native / Expo
  pubspec.yaml has flutter:                  → Flutter
  *.xcodeproj or Package.swift only          → Native iOS
  build.gradle (no .xcodeproj)               → Native Android
  shared/commonMain/ + iosApp/ + androidApp/ → Kotlin Multiplatform

NAME THE LAYER:
  Cross-platform shared    → KMP commonMain, RN/Flutter logic
  Per-platform UI          → SwiftUI screen, Compose screen, native module
  Platform integration     → Camera, push, biometrics, deep links
```

If the change is platform-specific UI in a shared codebase, decide whether it belongs in shared code with platform branches, or in a per-platform implementation.

### Step 1: Choose navigation before anything else

Navigation choices are the hardest to reverse — they shape every screen. Pick the platform-idiomatic option, not the one closest to web routing.

| Stack | Recommended | Avoid |
|---|---|---|
| Expo | Expo Router (file-based, deep-link-friendly) | Hand-rolled stack on top of `react-navigation` for greenfield projects |
| React Native | `@react-navigation/native` v6+ with native-stack | Custom navigation containers — they fight gesture handlers |
| Flutter | `go_router` for declarative + deep links | Imperative `Navigator.push` for app-wide navigation (fine for modals) |
| iOS (SwiftUI) | `NavigationStack` (iOS 16+) | `NavigationView` (deprecated) |
| Android (Compose) | Navigation Compose with type-safe destinations | Fragment-based navigation in new Compose codebases |
| KMP | Per-platform navigation, shared view models | Trying to share navigation state across iOS/Android |

Verify deep links work end-to-end on day one. Adding deep-link support late forces back-stack rewrites.

### Step 2: Decide state ownership and scope

```
LOCAL screen state         → @State (SwiftUI), useState (RN), setState (Flutter), remember (Compose)
SHARED across screens      → ViewModel (Compose, SwiftUI ObservableObject), Riverpod/Bloc (Flutter), Zustand (RN)
SERVER state with cache    → React Query / TanStack Query (RN), SWR-style observable (Flutter), Combine + cache (iOS)
APP-WIDE config / auth     → Singletons or DI containers (Hilt, Koin, Swift Dependency Injection)
KMP shared business logic  → ViewModels in shared/commonMain via expect/actual
```

**Rule of thumb:** if state survives across screens, it survives across process death. Persist it (Keychain/Keystore for secrets, MMKV / DataStore / UserDefaults / SharedPreferences for config, SQLite/Room/Realm/Core Data for records).

### Step 3: Build for the mobile runtime, not the web one

Mobile is not "web with smaller screens." Three constraints diverge sharply:

1. **The OS will kill your process.** Background a screen for 10 minutes; iOS/Android may terminate the app. State that lives only in memory is gone. Persist on `onPause` / `scenePhase == .background` / `AppState 'background'`.
2. **Networks are unreliable by default.** Cellular handoff, captive portals, and tunnels drop connections. Every mutation needs a queue + replay path. See [`references/mobile-checklist.md`](../../references/mobile-checklist.md) for the offline pattern.
3. **Permissions are a UX, not an API call.** Show a rationale screen before the system prompt fires. Handle permanent denial with a Settings deep-link.

### Step 4: Get list performance right the first time

List jank is the #1 cause of "feels cheap" mobile UI. The right primitive matters more than micro-optimizations.

| Stack | Use | Notes |
|---|---|---|
| React Native | `FlashList` (Shopify) for >50 items | `FlatList` is fine for short lists; both need stable `keyExtractor` and memoized rows |
| Flutter | `ListView.builder` with `itemExtent` when known | `const` constructors on row widgets eliminate rebuilds |
| iOS (SwiftUI) | `LazyVStack` inside `ScrollView`, or `List` for chrome | `.id()` stability matters; avoid recomputing models in `body` |
| Android (Compose) | `LazyColumn` with stable `key` | Use `derivedStateOf` for computed scroll signals to avoid recomp storms |
| KMP | Per-platform list (no shared list widget) | Shared row data class, native row composables |

For >1000 items, profile scroll on a low-end device — a Pixel 4a or iPhone SE is closer to median user hardware than the latest dev phone.

### Step 5: Wire accessibility from the first screen

Mobile a11y is enforced by both Apple and Google review. See [`references/mobile-checklist.md`](../../references/mobile-checklist.md#mobile-specific-accessibility) for the full checklist; the must-haves:

- Every interactive element has a label that names the *action*, not the icon
- Dynamic Type / font scaling does not clip layout at 200%
- Touch targets ≥ 44pt (iOS) / 48dp (Android)
- VoiceOver / TalkBack reading order matches visual order
- Reduce Motion replaces animated transitions with cross-fades

### Step 6: Verify on a simulator before review

Hand off to `mobile-simulator-testing` for runtime checks: launches without crash, navigation back-stack, list scroll on low-end profile, permission flows, offline behavior. Never declare a screen done from the editor preview alone — SwiftUI Preview, Compose Preview, and Hot Reload all hide real-device bugs.

## Patterns Worth Reusing

### Container / presentation split (universal)

```ts
// React Native — container handles data, presentation handles render
function TaskScreenContainer() {
  const { data, isLoading, error } = useTasks();
  if (isLoading) return <TaskListSkeleton />;
  if (error)     return <ErrorState onRetry={refetch} />;
  if (!data?.length) return <EmptyState onCreate={openCreate} />;
  return <TaskList tasks={data} />;
}
```

The same split is idiomatic in SwiftUI (`@StateObject` view model + presentation `View`), Compose (`ViewModel` + `@Composable`), and Flutter (Bloc/Riverpod + widget).

### Optimistic mutations with rollback

Optimistic UI is essential on mobile — a 400ms round-trip on cellular feels broken. Roll back on failure, surface a discreet retry, never a full-screen error for a single tap.

### Platform branches over abstraction layers

If two platforms diverge (e.g., iOS uses biometric prompt, Android uses BiometricPrompt API), branch at the call site. Don't build a `BiometricService` abstraction until the third platform appears — Rule of Three. Three similar lines beats a premature interface.

## Common Rationalizations

| Rationalization | Reality (failure story or quantified cost) |
|---|---|
| "I'll add the offline queue later" | Retrofitting an offline queue is a 1–2 sprint refactor because every mutation site has to change. Apps shipped without it earn 1- and 2-star reviews citing "loses my data on subway commute." |
| "SwiftUI Preview / Hot Reload looked right, ship it" | Previews skip lifecycle, deep links, real fonts at user font-scale, and the gesture system. ~30% of "works on my machine" mobile bugs reproduce only on the simulator. |
| "FlatList is fine, we don't have many items yet" | At ~50 items on a low-end Android, default FlatList drops to <30fps because every row re-renders on parent re-render. Switching to FlashList + memoized rows is a one-day fix early, a multi-screen rewrite later. |
| "Permissions are an OS concern, not a UX concern" | Apps that fire system permission prompts at first launch see ~40% denial rates (industry data). Apps that fire after an in-context rationale see ~70% grant rates. The system prompt is a one-shot — there's no second chance without a Settings deep-link flow. |
| "I'll wrap the platform navigation in a custom abstraction" | The platform navigators encode swipe-back gestures, transition timing, and accessibility behavior. Custom wrappers usually break one of those, which is unfixable without rebuilding the wrapper around the platform behavior. |
| "Dynamic Type / large text scaling is an edge case" | Apple rejects apps where layout breaks at 200% font scale; Google's Play pre-launch report flags it. ~25% of users over 50 set their device to a larger font scale. |

## Red Flags

- Hardcoded pixel values for layout — should be `dp` / `pt` / scaled units
- One giant screen file > 400 lines with no extracted view models
- `useEffect` / `LaunchedEffect` / `onAppear` chains > 3 deep — lifecycle bugs guaranteed
- No `key` / `keyExtractor` / `id()` on list rows — recomposition storms guaranteed
- Permission requested at first launch with no in-context rationale
- Web-style fixed widths (`width: 320`) instead of safe-area-aware constraints
- A "BiometricService" / "PushService" / "CameraService" abstraction wrapping a single platform implementation
- Cross-platform navigation state shared between iOS and Android in a KMP project
- Dynamic Type / font scaling not tested above 100%
- Editor preview ("looks right in SwiftUI Preview") used as the only verification

## Verification

Run these before handing off to `mobile-simulator-testing`:

- [ ] Stack and entry points detected: e.g. `grep -lE 'react-native|expo' package.json` or `test -f pubspec.yaml` or `find . -name '*.xcodeproj' -maxdepth 3 | head -1` returns the expected match
- [ ] Navigation library is one of the recommended options for the stack — `grep -E '@react-navigation|expo-router|go_router|NavigationStack|androidx.navigation' src ios android lib -r | head` returns at least one hit
- [ ] List rows have stable keys — `grep -nE 'keyExtractor|key:|id\(\)|key =' <changed list files>` shows the key prop on every list
- [ ] Permission rationale UI exists for every requested permission — `grep -rniE 'rationale|permission.*explain' <changed files>` returns hits, OR a code review note explains why none is needed
- [ ] Accessibility labels on all icon-only interactive elements — `grep -cE 'accessibilityLabel|contentDescription|.accessibilityLabel\(' <changed files>` ≥ count of icon-only buttons
- [ ] Persistence wired for state that crosses screens — `grep -nE 'AsyncStorage|MMKV|DataStore|UserDefaults|Keychain|Keystore|Hive|shared_preferences' <changed files>` shows persistence calls or an explicit "in-memory only" note
- [ ] Reference checklist consulted — `references/mobile-checklist.md` reviewed for the relevant section (permissions, lifecycle, offline, a11y)

## Next

After this skill exits, advise the user on what to do next. Pick the row
that matches the situation:

| If the situation is... | Suggest invoking |
|---|---|
| UI is built — verify it on a simulator/emulator | `mobile-simulator-testing` |
| Frame rate, list-scroll perf, or startup time is the concern | `performance-optimization` |
| Permissions, deep links, or platform input boundaries need scrutiny | `security-and-hardening` |
| UI is verified and ready for review | `/ofa-review` (`code-review-and-quality`) |

End the conversation turn with: `Next: I recommend <skill-or-command> because <one-line reason>.`
