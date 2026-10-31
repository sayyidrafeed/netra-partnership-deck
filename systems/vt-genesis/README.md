# vt-genesis

Deck-local system for the Netra partnership deck. It is a self-contained copy of the `veterantech` system (layer 1 of `tokens.css` and `components.css`, copied 31 Oct 2026) plus the look of the official Veterantech profile deck (Kabinet Genesis, `ComproDeck_Veterantech.pdf`, 5 slides, 1920×1080).

| Piece | Treatment | Source |
|---|---|---|
| Canvas | peach-to-rose wash; member photo washed out on cover, divider, closing | profile deck pages 1–5 |
| Header | centred tab: UPNVJ crest, pixel V mark, "KSM Veterantech" mono in accent, "Kabinet Genesis" under it | profile deck header |
| Page number | keycap box top right | profile deck tracker boxes |
| Title | Plus Jakarta Sans 700 (replaces Space Grotesk at Rafee's request); key words in accent (`vt-key`) | "About Veterantech", "Programs and Core Activities" |
| Body | mono text in a white box with an accent hairline; emphasis in deep accent (`vt-box`, `em`) | page 2 description box, page 3 program boxes |
| Chips | keycap chip with an offset shadow (`vt-chip`), small mono tags (`vt-tag`) | page 3 program names and track chips |

Assets: `logo.svg` (V mark, from veterantech system), `upnvj.svg` (UPNVJ crest from the profile deck PDF, wrapped with its own alpha mask), `members-wash.jpg` (member photo from the profile deck, page 2 background). Icons copied from the compro repo `public/icons/`.

Fonts: Plus Jakarta Sans (variable, OFL, from `@fontsource-variable/plus-jakarta-sans` 5.2.8) and JetBrains Mono 400 (from the veterantech system). It extends `base` directly so Space Grotesk is not declared.
