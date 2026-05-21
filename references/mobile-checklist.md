# Mobile Checklist

Quick reference for mobile-specific concerns across React Native/Expo, Flutter, native iOS (Swift/SwiftUI), native Android (Kotlin/Jetpack Compose), and Kotlin Multiplatform (KMP). Use alongside the `mobile-ui-engineering` and `mobile-simulator-testing` skills.

Each item picks the most representative platform; analogous APIs exist on the others — consult platform docs.

## Table of Contents

- [Permissions](#permissions)
- [App Lifecycle and Background Behavior](#app-lifecycle-and-background-behavior)
- [Offline and Network Resilience](#offline-and-network-resilience)
- [Mobile-Specific Accessibility](#mobile-specific-accessibility)
- [Build and Release Identifiers](#build-and-release-identifiers)
- [Common Pitfalls per Platform](#common-pitfalls-per-platform)

## Permissions

- [ ] Each runtime permission has a clear in-context rationale before the system prompt fires
- [ ] App degrades gracefully when permission is denied (no crash, no infinite spinner)
- [ ] Re-prompt strategy is defined: "Settings deep-link" path on permanent denial
- [ ] Required usage strings are present in the manifest (`Info.plist` keys, `AndroidManifest.xml` `<uses-permission>`)

```swift
// iOS — Info.plist (Swift/SwiftUI):
// NSCameraUsageDescription = "Scan codes from the home screen"
// NSLocationWhenInUseUsageDescription = "Show nearby places"
```

```xml
<!-- Android — AndroidManifest.xml (Kotlin/Compose) -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

```ts
// React Native / Expo — request at the moment of use, not at app launch
import { Camera } from 'expo-camera';
const { status } = await Camera.requestCameraPermissionsAsync();
if (status !== 'granted') showRationaleAndSettingsLink();
```

```dart
// Flutter — permission_handler
final status = await Permission.camera.request();
if (status.isPermanentlyDenied) await openAppSettings();
```

KMP: declare in each platform's manifest; expose a single `expect`/`actual` permission API from the shared module.

## App Lifecycle and Background Behavior

- [ ] State is persisted on backgrounding (the OS may kill the process at any time)
- [ ] In-flight network requests handle suspension and resume
- [ ] Sensitive content blurred or hidden in the app switcher (`UIApplicationDidEnterBackground` / `onPause`)
- [ ] Push-to-foreground after long suspension reloads stale data, not stale tokens

```kotlin
// Android — Jetpack Compose / Lifecycle
LaunchedEffect(Unit) {
  lifecycleOwner.lifecycle.eventFlow.collect { event ->
    if (event == Lifecycle.Event.ON_RESUME) refresh()
    if (event == Lifecycle.Event.ON_PAUSE) saveDraft()
  }
}
```

```ts
// React Native — AppState
import { AppState } from 'react-native';
AppState.addEventListener('change', state => {
  if (state === 'active') refreshIfStale();
});
```

iOS: scene-based lifecycle (`SceneDelegate` / SwiftUI `scenePhase`). Flutter: `WidgetsBindingObserver.didChangeAppLifecycleState`.

## Offline and Network Resilience

- [ ] Optimistic UI for user actions, with rollback on failure
- [ ] Local cache for read-heavy screens (SQLite / Realm / Room / Core Data)
- [ ] Mutations queue and replay when connectivity returns
- [ ] Connectivity changes do not trigger duplicate requests
- [ ] Network errors distinguish "no signal" from "server error" in the UI

```ts
// React Native — NetInfo + queued mutations
import NetInfo from '@react-native-community/netinfo';
const unsub = NetInfo.addEventListener(s => {
  if (s.isConnected) flushPendingMutations();
});
```

```kotlin
// Android — Room handles offline reads; WorkManager for replayable writes
val request = OneTimeWorkRequestBuilder<SyncWorker>()
  .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
  .build()
```

iOS: `NWPathMonitor` for connectivity, `URLSession` background sessions for retry-on-resume. Flutter: `connectivity_plus` + a sync queue. KMP: shared queue in commonMain, platform networking via Ktor.

## Mobile-Specific Accessibility

- [ ] Every interactive element has an accessibility label (not just the visible text — for icons, the label describes the action)
- [ ] Dynamic Type / font scaling respected — text reflows at 200% (no clipping)
- [ ] Reduce Motion honored — replace animated transitions with cross-fades when enabled
- [ ] Touch targets ≥ 44×44 pt (iOS) / 48×48 dp (Android)
- [ ] VoiceOver / TalkBack reading order matches visual order
- [ ] Screens for dynamic content announce changes (`accessibilityLiveRegion` on Android, `UIAccessibility.post(notification:)` on iOS)

```swift
// SwiftUI
Image(systemName: "trash")
  .accessibilityLabel("Delete task")
  .accessibilityAddTraits(.isButton)
```

```ts
// React Native
<Pressable accessible accessibilityRole="button" accessibilityLabel="Delete task">
  <TrashIcon />
</Pressable>
```

Compose: `Modifier.semantics { contentDescription = "Delete task" }`. Flutter: `Semantics(button: true, label: 'Delete task', child: ...)`.

## Build and Release Identifiers

- [ ] Bundle ID / `applicationId` is reverse-DNS, environment-suffixed for non-prod (e.g. `com.acme.app.dev`)
- [ ] Versioning strategy decided: `marketingVersion` (1.4.0) vs `buildNumber` (5023) — both increment per release
- [ ] Code signing identities checked into a secret store, not the repo
- [ ] Crash reporting symbol uploads (dSYM / mapping.txt) automated in CI
- [ ] iOS provisioning profile and Android keystore rotation cadence documented

```ruby
# iOS — Fastlane lane fragment
increment_build_number(xcodeproj: "App.xcodeproj")
upload_symbols_to_crashlytics(dsym_path: "App.app.dSYM.zip")
```

```groovy
// Android — build.gradle
android {
  defaultConfig { applicationId "com.acme.app"; versionCode 5023; versionName "1.4.0" }
  buildTypes { release { signingConfig signingConfigs.release; minifyEnabled true } }
}
```

Expo: `eas.json` profiles per env. Flutter: `--dart-define` for env switches, `flavors` for app variants. KMP: shared version constant in `gradle/libs.versions.toml`.

## Common Pitfalls per Platform

| Platform | Pitfall | Why it bites |
|---|---|---|
| React Native / Expo | Default `FlatList` re-renders every row on parent state change | Wrap items in `React.memo`, give stable `keyExtractor`; use `getItemLayout` for known heights |
| Flutter | `setState` in a `build` method or rebuilding the entire widget tree on small changes | Use `const` constructors, hoist immutable widgets, prefer `ValueListenableBuilder` |
| iOS (SwiftUI) | `@StateObject` recreated on parent re-render breaks subscriptions | Hoist owners; use `@ObservedObject` only when the parent owns the lifetime |
| Android (Compose) | Reading state inside the composition rather than in a `derivedStateOf` causes recomposition storms | Wrap derived computations; profile with Layout Inspector |
| KMP | iOS callers using a Kotlin `suspend` function from main-thread without a continuation bridge | Expose `Flow` / callback wrappers in `iosMain`; never call `runBlocking` from Swift |
| All | Hardcoding screen sizes for layout | Use safe-area insets, dynamic font scaling, and orientation-aware constraints |
| All | Logging PII or auth tokens to platform logs | Logs persist on-device and can be siphoned by other apps with debug entitlements |
