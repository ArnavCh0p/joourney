# Joourney — History & Changelog

A record of completed work by version. Use this to give CC context about past decisions or implemented features.

---

## ✅ Completed — post-v0.3.1

- **Session date fix** — auto-detected sessions now store UTC midnight of the sync day, preventing timestamp jitter from shifting the displayed date
- **Editable session date** — `SessionNoteEditor` now shows a date field pre-filled with the sync date; user can correct it to when they actually played before saving notes
- **Session dismissal** — pending auto-detected sessions can be dismissed with an inline confirmation warning ("playtime is still tracked — only the log entry is removed")
- **Back button** — game detail back button now uses `router.back()` so it respects browser history; falls back to `/library` on direct navigation
- **Feedback modal** — type dropdown now shows a "Select a type…" placeholder and blocks submission until a type is chosen
- **Library stats pills** — all four chips now show a tooltip on hover with a helpful breakdown (Steam vs manual split, playing vs replaying, hours context)

---

## ✅ Completed — v0.3.0

- Window controls moved to dedicated `TitleBar` drag strip — seamless slate-900, full-width drag region
- Window scaling — min size 900×600, centers on open, `w-full` body
- Custom slim scrollbars — 6px slate thumb, transparent track, global
- In-app feedback button — `FeedbackModal`, Discord webhook API route, Navbar button
- Lists — description field (inline editable)
- Lists — grid/list view toggle with localStorage persistence
- Lists — bulk add from library edit mode
- Status dropdown — closes on outside click, only one open at a time
- Multiplayer games — Untracked status option
- Bulk edit — SP/MP mismatch warning before applying
- Bulk edit — type toggle (SP ↔ MP) in edit mode
- Group by Tags — games now appear in all matching tag sections
- Hidden games — navigable via Hidden tab, loggable, excluded from home feed
- Profile — hidden games section removed (redundant with Hidden tab)
- Profile — tag chips link to filtered library view
- Game cover — onError fallback cascade (capsule → header → hide)
- Library news links — open in system browser via ExternalLink

---

## ✅ Completed — v0.2.0

- Custom titlebar merged into navbar (window controls right-aligned)
- White side bars gone, full-bleed `#0f172a` background
- Splash screen with ∞ mark on launch
- Auto-updater wired up with signing keys + GitHub Actions release workflow
- J∞rney wordmark with emerald ∞ in navbar
- Version tooltip on wordmark hover
- GameCards dark themed
- Toggle animation fixed in AddGameModal
- External links (news + trending) open in system browser
- Taskbar icon updated — dark slate + emerald ∞
- Navbar scroll fix on game detail page
- Hero gradient updated
- Bulk edit mode — hidden on All tab, multiplayer checkbox added
- Auto-session rows — slim emerald left border
- Sign-in hero glows — emerald/sky tints
- Music search in journal "Listened to" field — MusicBrainz, multi-select chips
- Music entries display richly in session cards (album art + track + artist)
- Game search — IGDB results sorted by popularity, DLC/bundles filtered out
- Journal — auto-save rating & overall notes
- Transient 500 errors — Prisma singleton confirmed, structured error logging added
- CHANGELOG.md + versioning system
- GitHub Actions release workflow with auto changelog extraction
- Signing keys generated + stored in GitHub secrets
