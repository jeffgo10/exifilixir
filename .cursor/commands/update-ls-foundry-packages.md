# Update ls-foundry packages (+ optional integration plan)

Bump `@jeffgo10/*` packages published from [ls-foundry](https://github.com/jeffgo10/ls-foundry) and integrate any API or type changes in EXIFilixir.

Follow `.cursor/rules/exifilixir-core.mdc` and `.cursor/rules/exifilixir-ls-foundry-boundary.mdc`.

**Do not edit, commit, or publish ls-foundry from this session.** If a needed API is missing upstream, give the user a paste-ready brief for an ls-foundry agent (template in `exifilixir-ls-foundry-boundary.mdc`), then bump here after publish.

This repo uses **npm** (not pnpm). Package manager commands below must stay npm.

## Mode — read trailing user text

| Trailing text | Mode |
|---|---|
| Empty, or "update only" / "bump only" | **Update** — bump packages and integrate breaking changes |
| Contains "plan", feature ideas, bullet list, or "I want to…" | **Plan + Update** — plan first, then bump and outline integration work |
| Starts with "plan only" | **Plan only** — no package bump; produce an integration plan the user can approve first |
| Names packages (e.g. `panorama-viewer`, `helpers`) | Scope bump/plan to those packages only |

If ambiguous, ask one short clarifying question, then proceed.

---

## Plan mode (when requested)

Before or instead of bumping, produce a concise integration plan:

1. **Restate features** the user wants in EXIFilixir (preview, helpers, UX).
2. **Map to ls-foundry** — which package(s) must change upstream vs wire here only:
   - `@jeffgo10/panorama-viewer` — 360° equirectangular preview (Pannellum), hotspots, styles
   - `@jeffgo10/helpers` — `image`, `text`, `ui`, etc. — prefer over local reimplementation
3. **List touch points** (e.g. `app/page.tsx`, new client preview component, `next.config.js` `transpilePackages`).
4. **Order work** — publish upstream (if needed) → bump here → client dynamic import → verify build/export.
5. **Flag risks** — SSR (viewer is client-only), static export + PWA, Ant Design layout with viewer CSS, token auth unchanged.

Output format:

```markdown
## Integration plan — <short title>

### Features requested
- …

### Upstream (ls-foundry) vs this repo
| Change | Where |
|---|---|

### Files to touch
- …

### Steps
1. …

### Open questions
- …
```

Stop after the plan if mode is **Plan only**. Otherwise continue to Update mode.

---

## Update mode

### 1. Pre-flight

- Confirm `.npmrc` exists with `@jeffgo10:registry=https://npm.pkg.github.com` and a token via env (`GITHUB_TOKEN` / `NODE_AUTH_TOKEN`). If missing: tell the user to `cp .npmrc.example .npmrc` and set the token — **do not guess credentials**.
- Record **current** versions from root `package.json` for any `@jeffgo10/*` deps (may be none yet).
- If no `@jeffgo10/*` deps yet and user asked to install: add the requested packages (default candidates: `@jeffgo10/panorama-viewer`, optionally `@jeffgo10/helpers`) rather than only “bumping”.

### 2. Check ls-foundry (optional, if `~/projects/ls-foundry` exists)

Read upstream `package.json` versions and recent changes in:

- `packages/panorama-viewer/`
- `packages/helpers/` (only if consumed)

Note new exports, props, CSS entrypoints, or breaking type changes. Compare with package README under that folder.

### 3. Bump or install packages

From repo root (npm):

```bash
# Install first time (example)
npm install @jeffgo10/panorama-viewer@latest
# optional:
# npm install @jeffgo10/helpers@latest

# Bump existing exact pins explicitly when "Already up to date"
npm install @jeffgo10/panorama-viewer@<version>
```

If trailing text names a version, use that version.

After add/bump:

- Ensure `next.config.js` includes `transpilePackages: ['@jeffgo10/panorama-viewer']` (and helpers if imported from source builds that need it).
- Viewer must load client-only (`"use client"` and/or `next/dynamic` with `ssr: false`).
- Import `@jeffgo10/panorama-viewer/styles.css` once in the client entry that mounts the viewer.

### 4. Verify

```bash
npm run lint
npm run build
```

Smoke when UI wired:

- `npm run dev` → process or load a 2:1 equirectangular → open panorama viewer
- Confirm static export still writes `out/` and PWA assets are intact

Update `.cursor/rules/exifilixir-ls-foundry-boundary.mdc` pin table when versions change.

### 5. Report

Summarize for the user:

- Old → new version for each `@jeffgo10/*` package (or “added @ x.y.z”)
- Breaking changes found and fixes applied (or remaining TODOs)
- If Plan mode was used: which planned features are done vs still pending
- Suggest next manual check (preview a fixed 360° image)

### 6. Knowledge sync (light)

If versions or integration notes changed materially, update:

- `.cursor/rules/exifilixir-ls-foundry-boundary.mdc` (pins)
- `.cursor/rules/exifilixir-core.mdc` (stack table) when the app now depends on these packages

---

## Usage examples

```
/update-ls-foundry-packages
/update-ls-foundry-packages update only
/update-ls-foundry-packages plan only: add panorama preview after process
/update-ls-foundry-packages panorama-viewer@0.1.2
/update-ls-foundry-packages both: helpers image utils + panorama-viewer
```

---

## Do not

- Edit ls-foundry from this session
- Commit tokens or a filled `.npmrc` with a raw PAT
- Break static export / Firebase hosting assumptions while integrating the viewer
- Copy package source into `app/` instead of depending on the published package
