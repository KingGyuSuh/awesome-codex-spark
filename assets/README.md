# Assets

Visual identity for the Codex Spark plugin. Codex marketplace surfaces
(`/plugins`, install confirmation, composer chip) read these via the
`interface.composerIcon`, `interface.logo`, and `interface.screenshots`
fields in `.codex-plugin/plugin.json`.

## Files

| File | Purpose | Recommended size |
|---|---|---|
| `logo.svg` | Plugin tile in `/plugins` and marketplace listings | 256×256 (square) |
| `composer-icon.svg` | Inline chip when the skill is referenced in the composer | 64×64 (square, monochrome-friendly) |
| `screenshot-1.svg` | First marketplace screenshot (illustrative trace shape) | 1280×800 (16:10) |

## SVG vs PNG

The current files ship as SVG for portability. If the Codex install surface
fails to render an SVG asset (some marketplace tiles assume raster),
re-export the same artwork as PNG at the same dimensions and update the
manifest paths:

```json
"composerIcon": "./assets/composer-icon.png",
"logo": "./assets/logo.png",
"screenshots": ["./assets/screenshot-1.png"]
```

A one-shot conversion using `rsvg-convert` (preferred) or any image editor
is sufficient — there is no runtime processing.

## Brand

- Primary color: `#10A37F` (matches `interface.brandColor`)
- Accent dark: `#0E1B17`
- Accent light: `#B5F1DC`
