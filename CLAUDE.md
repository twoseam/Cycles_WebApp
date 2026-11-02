# CYCLES web app — project notes for Claude

Public repo. Keep this file free of personal details, IDs, and anything
secret. Full history in the private notes repo (`twoseam/claude-notes`,
`projects/Cycles Looper/`). Firmware lives in the private `Cycles_Hardware`
repo.

## What it is
- Companion site + web app for the CYCLES looper pedal.
- Live: https://cycleslooper.com (GitHub Pages, `main`, root). ~30 s rebuild.
- Pages: `index.html` (app), `manual.html` (Owners Manual), `tutorial.html`,
  `shop.html`, `contact.html`, `v2.html`. Shared: `cycles-shared.css/js`.
- Chromium only (File System Access). Firefox/Safari/mobile get the
  unsupported-state card. Not planned to fix.

## Owners Manual
- `manual.html` → `Assets/Cycles-Owners-Manual.pdf` via headless Chrome
  using the page's `@media print` rules.
- Regenerate the PDF every time `manual.html` changes.
- Gesture diagrams use the `mini()` helper (red = hold, blue = move).
  Diagrams over tables.

## Layout modes
- **Wide** ≥ 1200 px (zones: 1 Playback, 2 Import, 3 Stock Tracks, 4 Memory Slots).
- **Vertical** 601–1199 px. **Mobile** ≤ 600 px or `(pointer: coarse)`.
- Use these names. "2×2" is retired.
- Numbered tile grids read row-first. Don't use `grid-auto-flow: column`.

## Code rules
- Popups: `dialogConfirm` / `dialogAlert` only. Never native confirm/alert.
  Delete = `okVariant: 'danger'`. Cancel = default look.
- `#transport button` beats `#btn-export` in specificity. Use `:not()` or
  `#transport #btn-export`.
- HTML referenced by top-level `addEventListener` must sit above the
  `<script>` tag, or init() dies silently.
- Slot files: `Mem_NN[_mono][_stream].raw`. Webapp writes all four variants.
- Export applies Speed via the WAV sample-rate header. No resampling.

## Design rules (Michael's)
- Console-inspired, not imitated. Flat graphic tokens. No chrome bezels,
  halo glows, or skeuomorphic gradients.
- No glass overlay on the large waveform. OK on small 7-seg displays.
- Inset displays Y-align with the PRESSED button state.

## Open items
- Remove the mono-stream import option (firmware can't play it).
- Restore two test-mode hacks (mobile popup, unsupported browser).

## Deploy
- Edit locally, commit, push. Don't edit in GitHub's web UI (causes divergence).
- Commit and push before ending any session.
