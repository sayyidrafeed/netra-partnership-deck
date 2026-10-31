# Veterantech x Netra deck

Partnership deck for the Netra call (31 Oct 2026), built with the `create-deck` skill and the `vt-genesis` design system.

- `slides.html`: slide content and speaker notes
- `systems/vt-genesis/`: deck-local design system (tokens, components, fonts, assets)
- `assets/`: images used by the slides
- `plan.md`: decisions, sources, and open questions (internal, kept out of git)
- `out/`: the built deck that Vercel serves, including `veterantech-x-netra.pdf`

## Present

Open the deployed URL. Arrow keys move between slides, `f` toggles fullscreen, `n` shows speaker notes.

## Update

The build runs locally, not on Vercel, so commit `out/` after every change:

```bash
uv run --no-project --python 3.12 python ~/.agents/skills/create-deck/scripts/deck.py build . --check --pdf
git add -A && git commit -m "docs(deck): update slides"
git push
```

Vercel serves `out/` as a static site (`vercel.json`), with `noindex` so search engines skip it.
