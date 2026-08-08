---
name: handoff
description: Compact the current Cursor session into a handoff doc for the next agent (rules, skills, git, env).
argument-hint: "Next session focus (optional): e.g. finish OG assets, open PR, minimal"
disable-model-invocation: true
---

# Handoff — compact session for the next Cursor agent

Summarize the current chat into a **handoff document** a fresh Cursor agent can use to continue without re-discovering context. Save the file **outside the repo** (OS temp directory), not in the workspace.

## Mode — read trailing user text

| Trailing text | Mode |
|---|---|
| Empty | **Full handoff** — goal, progress, blockers, env, suggested next steps |
| Describes next focus (e.g. "fix Cloud Function token", "open PR only") | **Tailored** — same structure, but prioritize that focus in Goal + Next steps |
| "minimal" or "short" | **Minimal** — Goal, Current state, Next 3 steps, Critical paths only; skip long appendix |
| "with transcript" | **Full + transcript ref** — include path to this session's agent transcript if discoverable |

If ambiguous, default to **Full handoff**.

---

## Step 1 — Gather context (do not guess)

Collect facts from the session and repo before writing:

1. **User intent** — what they asked for; what changed mid-session.
2. **Trailing text** — next-session focus from mode table.
3. **Git** (when relevant):
   ```bash
   git branch --show-current
   git status --short
   git log -5 --oneline
   ```
4. **Changed files** — list paths touched or discussed; do not paste full diffs.
5. **Terminals** — if Next (`:3000`) or Functions emulator (`:5001`) matter, note cwd, last command, exit code.
6. **Cursor artifacts** — rules, commands, skills, MCP servers that matter for continuation.
7. **External refs** — PRs, issues — link or path only.

**Do not duplicate** content already in README, DEPLOYMENT.md, SECURITY.md, commits, or diffs. **Reference by path or URL**.

**Redact** API keys, tokens, passwords, `.env` values, and PII. Use placeholders like `[REDACTED]` or `process.env.*`.

---

## Step 2 — Write the handoff file

### Output location

| OS | Directory |
|---|---|
| macOS / Linux | `$TMPDIR` or `/tmp` |
| Windows | `%TEMP%` |

**Filename:** `cursor-handoff-<repo-basename>-<YYYYMMDD-HHMM>.md`  
Example: `/tmp/cursor-handoff-exifilixir-20260808-1530.md`

Tell the user the **full absolute path** when done.

### Document template

Use this structure (omit sections with nothing useful; never leave empty boilerplate):

```markdown
# Cursor handoff — <short title>

**Generated:** <ISO date/time>
**Repo:** <absolute workspace path>
**Branch:** <branch> (<clean | dirty>)
**Next session focus:** <from user trailing text or "continue current task">

## Goal

<1–3 sentences: what the user wants done and why>

## Current state

<Bullets: what's done, what's in progress, what's broken/unverified>

## Key decisions & constraints

<Non-obvious choices — e.g. static export to out/, processImage Cloud Function, token pair>

## Files & artifacts (reference only)

| Path | Relevance |
|---|---|
| `path/to/file` | <one line> |

## Environment & dev notes

<Ports, env var *names* only, emulator vs hosting, ImageMagick for assets>

## Blockers & open questions

<What stopped progress; what only the user can answer>

## Suggested next steps

1. <Concrete, ordered action>
2. …

## Cursor continuation guide

### Rules to read first

- `.cursor/rules/<file>.mdc` — <why>

### Suggested slash commands

- `/command-name` — <when to use>

### Suggested skills

| Skill | Path | When |
|---|---|---|
| <name> | `~/.cursor/skills-cursor/<skill>/SKILL.md` | <trigger> |

### MCP / tools

<Only if relevant>

### Recommended Cursor mode

<Agent | Plan | Debug> — <one line why>

## Session transcript (optional)

<Only when "with transcript" mode>
```

---

## Step 3 — EXIFilixir defaults (this repo)

When handoff touches this project, prefer these references over re-explaining:

| Topic | Read first |
|---|---|
| Project overview | `.cursor/rules/exifilixir-core.mdc`, `README.md` |
| Deploy / Firebase | `DEPLOYMENT.md`, `firebase.json`, `functions/src/index.ts` |
| Auth / tokens | `SECURITY.md`, `app/utils/auth.ts` |
| Brand / PWA assets | `public/`, `scripts/generate-public-images.mjs`, `npm run assets:generate` |
| ls-foundry / `@jeffgo10/*` | `.cursor/rules/exifilixir-ls-foundry-boundary.mdc`, `/update-ls-foundry-packages` |
| UI / UX | `.cursor/rules/UI-UX/design-core.mdc`, `UI-UX/frontend/*`, `UI-UX/binders/` |
| Knowledge sync | `.cursor/rules/exifilixir-obsidian-sync.mdc`, `/sync-obsidian-notes` |
| Open PR | `/create-github-pr` |

**Architecture reminder:** static export to `out/` for Firebase Hosting; image processing is Cloud Function `processImage` (emulator on localhost). Engine packages live in ls-foundry — never edit that repo from this session.

---

## Step 4 — Quality bar

Before finishing:

- [ ] Next agent can act in **≤2 minutes** without re-reading the whole chat
- [ ] Every file mention is a **path**, not a pasted blob
- [ ] **Next steps** are actionable (verb + target)
- [ ] **Suggested skills/commands** match the actual next task
- [ ] No secrets in the saved file
- [ ] User receives the **absolute path** to the handoff file

Do **not** commit the handoff file to git unless the user explicitly asks.
