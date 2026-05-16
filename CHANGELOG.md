# Changelog

All notable changes to Joourney are documented here.
Newest version at the top. Format: date · what changed.

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
