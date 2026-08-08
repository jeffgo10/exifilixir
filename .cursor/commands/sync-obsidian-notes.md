# Sync Obsidian notes (+ optional Cursor rules)

Document recent **EXIFilixir** changes in Obsidian via MCP — topic notes, engineering noteworthies. Optionally refresh `.cursor/rules/` when agent guidance should match.

**Project notes live only in Obsidian** (`exifilixir/`). There is no repo mirror folder.

Follow `.cursor/rules/exifilixir-obsidian-sync.mdc` and `.cursor/rules/exifilixir-core.mdc`.

## Mode — read trailing user text

| Trailing text | Mode |
|---|---|
| Empty, or "both" / "rules" / "cursor rules" | **Obsidian + Rules** — vault first, then rules when guidance changed |
| "obsidian only" | **Obsidian** — vault notes only |
| Starts with "rules only" | **Rules only** — skip Obsidian; update `.cursor/rules/*.mdc` from repo docs |
| Describes a specific topic (e.g. "Firebase CI", "PWA assets", "API token") | Scope sync to that topic only |
| Text after `both:` or a colon summary | Use that summary as the primary source of truth |

If ambiguous, default to **Obsidian + Rules**.

---

## Step 0 — MCP pre-check (required before any Obsidian write)

1. Discover Obsidian tool schemas via `GetMcpTools` on `user-MCP_DOCKER` if needed.
2. **Probe:** `obsidian_list_files_in_dir` with `{ "dirpath": "exifilixir" }` on server `user-MCP_DOCKER`.
3. **If probe fails** — stop Obsidian work; report why; still run **Rules only** if requested. Do not call `obsidian_append_content`, `obsidian_patch_content`, or `obsidian_delete_file`.

---

## Step 1 — Discover what changed

Gather context from (in order of priority):

1. **Trailing user text** — explicit summary of what to document.
2. **Git** — `git status`, `git diff`, `git log -5 --oneline` for uncommitted or recent commits.
3. **Conversation** — resolved bugs, new features, deploy or EXIF pipeline changes from the current session.
4. **Repo** — `README.md`, `DEPLOYMENT.md`, `SECURITY.md`, code for canonical technical detail (not duplicated into a notes folder).

Skip trivial changes (typos, formatting-only, unrelated refactors).

---

## Step 2 — Choose Obsidian targets

| Change type | Vault path | Action |
|---|---|---|
| Stack, overview, index | `exifilixir/00 Index.md` | Patch relevant section |
| Timeline / milestones | `exifilixir/01 Timeline and Git History.md` | Patch |
| Image pipeline / ExifTool / Sharp | `exifilixir/02 Image Processing Pipeline.md` | Patch |
| Firebase, static export, GitHub Actions | `exifilixir/03 Deployment Firebase and Static Export.md` | Patch |
| Tokens / auth | `exifilixir/04 Security and API Tokens.md` | Patch |
| PWA, icons, frontend UX | `exifilixir/05 PWA and Frontend UX.md` | Patch |
| Local dev / emulator | `exifilixir/06 Local Dev and Emulators.md` | Patch |
| SEO, OG, donations, ops | `exifilixir/07 SEO Donations and Ops.md` | Patch |
| Architecture decisions | `exifilixir/08 Decisions Log.md` | Append or patch |
| Cursor rules / commands | `exifilixir/10 Cursor rules and slash commands.md` | Create or patch when `.cursor/` changes |
| ls-foundry / `@jeffgo10/*` | `exifilixir/11 ls-foundry and GitHub Packages.md` | Create or patch |
| Resolved bug, gotcha | `exifilixir/noteworthy/Notes — <short title>.md` | Create or update |
| Engineering notes index | `exifilixir/noteworthy/EXIFilixir Engineering Notes.md` | Add row when creating noteworthy |

**Always read before write:** `obsidian_get_file_contents` on the target note first.

### Noteworthy note template (new notes)

```markdown
# Notes — <Topic>

**When:** <month year>
**Context:** <one line>

## Symptom / goal
…

## Cause
…

## Fix
…

## Files touched
- `app/…` or `functions/…`

## Related
- [[00 Index]]
```

---

## Step 3 — Update Obsidian (MCP)

| Tool | Use for |
|---|---|
| `obsidian_get_file_contents` | Read existing note before edit |
| `obsidian_batch_get_file_contents` | Read several targets at once |
| `obsidian_patch_content` | Update a heading/section |
| `obsidian_append_content` | New note body or changelog at end |
| `obsidian_list_files_in_dir` | Verify paths; list `noteworthy/` before creating |

After large writes, re-read with `obsidian_get_file_contents` to confirm.

---

## Step 4 — Update Cursor rules (when mode includes rules)

| Rule file | Update when |
|---|---|
| `exifilixir-core.mdc` | Stack, routes, deploy, architecture, CI |
| `exifilixir-obsidian-sync.mdc` | Vault map, sync workflow |
| `exifilixir-ls-foundry-boundary.mdc` | `@jeffgo10/*` pins / package set |
| `clean-code.mdc` | Shared coding conventions (rarely) |

Also update vault `exifilixir/10 Cursor rules and slash commands.md` when `.cursor/` changes.

**Source of truth order:** repo code + `README.md` > Obsidian > conversation.

---

## Step 5 — Report

```markdown
## Obsidian sync report

### MCP
- Pre-check: ✅ / ❌

### Obsidian notes updated
| Note | Action |
|---|---|
| exifilixir/… | Created / Patched / Appended |

### Cursor rules updated (if any)
- …

### Skipped (with reason)
- …

### Manual follow-up
- …
```

---

## Usage examples

```
/sync-obsidian-notes
/sync-obsidian-notes obsidian only
/sync-obsidian-notes rules only
/sync-obsidian-notes both: Firebase CI workflow, Cursor rules pack
/sync-obsidian-notes Firebase deploy only
```

---

## Do not

- Create or restore a repo copy of vault notes (no `.obsidian-sync/`)
- Duplicate noteworthy notes under slightly different titles
- Put secrets in Obsidian notes
- Update Obsidian when MCP pre-check fails
- Put EXIFilixir notes in `LiteShadeMedia/`, `StickPak/`, `CrowdBadge/`, or `LS Foundry/`
