# Changelog

All notable changes to Joourney are documented here.
Newest version at the top. Format: date · what changed.

---

## [0.3.0] — 2026-05-17

### Added
- In-app feedback button — subtle "Feedback" link in the navbar opens a modal (Bug / Idea / Other) that posts directly to Discord
- Dedicated title bar drag strip — window is now draggable from a clean seamless strip above the navbar, matching the Claude desktop style
- Slim custom scrollbars — replaces the Windows default with a thin slate thumb on a transparent track
- Multiplayer games now have an "Untracked" status for casual play with no logging
- Bulk edit: add selected games to a list directly from edit mode
- Bulk edit: warns before applying a status that doesn't match selected game types
- Lists: optional description field, editable inline
- Lists: grid / list view toggle with per-device memory
- Lists: rank badge shown on grid cards when sorted by ranking
- Profile: clicking a tag chip navigates to the library filtered by that tag
- Library: "Hidden" tab shows hidden games — still fully navigable and loggable
- Library: grouping by tag now correctly shows games in all their matching tag sections

### Fixed
- Window now opens centered and has a minimum size of 900×600
- Feedback modal renders via React portal — always appears centered, never clipped by the navbar
- Status dropdown closes when clicking outside; only one open at a time
- Session logs for hidden games no longer appear in the home feed
- Cover art image fallback cascade — tries Steam capsule, then header, then hides gracefully
- Library news links now open in the system browser

### Changed
- Window controls (minimize / maximize / close) moved out of the navbar into a dedicated title bar strip

---

## [0.2.0] — 2026-05-16

### Added
- Custom titlebar with minimize / maximize / close controls
- Splash screen with ∞ logo mark on launch
- Auto-updater — friends get notified of new versions inside the app
- Bulk edit mode in library — select multiple games, set status + single/multiplayer type at once; covers all 9 statuses including the three multiplayer-specific ones
- Music search on journal entries — powered by iTunes, returns popularity-ranked results, supports multiple tracks as chips
- Version tooltip on the wordmark — hover the logo to see the current version
- External links (news, trending) now open in the system browser instead of doing nothing

### Fixed
- Toggle animation in Add Game modal no longer slides out of track
- GameCards now match the dark theme (were showing white)
- White side bars no longer visible around the app window
- App background is now full-bleed instead of a floating panel
- Auto-detected session rows styled as clean left-border list instead of cards
- Hero gradient on game detail page now blends into the page background

### Changed
- Logo updated — infinity symbol replaces the double-O
- Background deepened to slate-950 for a richer dark feel
- App now runs locally via `npm run dev` + `npx tauri dev` for live editing

---

## [0.1.0] — initial release

- Core library sync with Steam
- Game status tracking (Playing, Replaying, Want to Play, Completed, Abandoned)
- Journal entries per game with session auto-detection
- Home feed with currently playing + recently journaled
- Profile page with library stats and breakdown
- Lists feature
- Trending Steam games carousel
- Library news feed from Steam
- Star ratings per game

---

## How to add an entry (takes 30 seconds)

When CC makes changes, tell them:
> "Update CHANGELOG.md with what you just did under [0.x.0]"

When you're ready to ship a version:
1. Change `[0.x.0] — in progress` to `[0.x.0] — YYYY-MM-DD`
2. Run: `git tag v0.x.0 && git push origin main --tags`
3. GitHub builds it automatically → go to github.com/ArnavCh0p/joourney/releases
4. Review the draft → click Publish

That's it.
