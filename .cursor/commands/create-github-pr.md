# Create GitHub PR from branch commits

Analyze commits and diffs on the current branch, draft a comprehensive PR title and description, **auto-commit uncommitted work**, **create a feature branch when on `main`**, push if needed, and open a pull request with `gh`.

Follow `.cursor/rules/exifilixir-core.mdc`. Default base branch: **`main`**.

## Mode — read trailing user text

| Trailing text | Mode |
|---|---|
| Empty | **Create** — auto-commit, branch if needed, push, open PR |
| "cleanup", "sync main", "back to main", or "merged" | **Cleanup only** — checkout `main`, pull, delete merged local branch (Step 8) |
| "draft only", "preview", or "dry run" | **Draft only** — show proposed branch name, commit message, title/body; do not run git write ops |
| "draft pr" or "as draft" | **Create draft PR** — same as Create but `gh pr create --draft` |
| "no commit" or "committed only" | Skip auto-commit; use commits already on branch |
| Contains `base:` or `into:` (e.g. `base: develop`) | Override base branch |
| Contains `branch:` (e.g. `branch: feat/my-feature`) | Override auto-generated branch name |
| Contains `title:` | Use as title hint or override (still polish for clarity) |
| Describes scope (e.g. "assets only", "cursor rules") | Narrow Summary/Changes to that scope; still list all commits in the table |

**Default:** auto-commit all safe uncommitted/untracked changes and create a local feature branch when on `main`/`master`. Do not ask for confirmation unless the branch name is ambiguous and no `branch:` hint was given.

---

## Step 0 — `gh` pre-check (Create modes only; skip for Draft only)

Before Step 6, probe GitHub CLI:

```bash
command -v gh && gh auth status
```

| Result | Action |
|---|---|
| `gh` not found | After push (Step 5), print web fallback URL + install hint (`brew install gh`); do **not** fail the flow |
| `gh` found, not authed | Same fallback + `gh auth login` hint |
| `gh auth status` OK | Proceed with `gh pr create` in Step 6 |

**Web fallback URL** (derive owner/repo from `git remote -v`):

`https://github.com/<owner>/<repo>/pull/new/<branch>`

Include the drafted title and body in the report so the user can paste them into the GitHub form.

---

## Step 1 — Gather git context (run in parallel)

From repo root:

```bash
git status
git branch -vv
git remote -v
git log --oneline -15
```

### Merged-PR cleanup (run first when applicable)

If the **current branch is not** `main`/`master`, check whether its PR is already merged:

```bash
gh pr view --json state,merged,baseRefName 2>/dev/null || true
```

| Condition | Action |
|---|---|
| PR **merged** (or user trailing text: `cleanup`, `sync main`, `back to main`, `merged`) | Run **Step 8** now, then continue from a fresh `main` if creating another PR |
| On stale feature branch with no open PR and no local commits ahead of `origin/main` | Run Step 8 or offer it before starting a new PR |

When starting **Create** mode, prefer a clean `main` that matches `origin/main` before creating a new feature branch.

Determine:

- **Current branch** and whether it is `main` / `master`
- **Base branch** — default `main`; confirm it exists locally and on `origin`
- **Uncommitted work** — modified, staged, and untracked files (respect `.gitignore`)
- **Upstream tracking** — pushed? ahead/behind `origin`?

Inspect uncommitted diff when present:

```bash
git diff
git diff --cached
git status --short
```

Then compare against base (after Steps 2–4 when branch/commits are ready):

```bash
git fetch origin main 2>/dev/null || true
git log origin/main..HEAD --oneline
git diff origin/main...HEAD --stat
git diff origin/main...HEAD
```

If `origin/main` is unavailable, use local `main..HEAD`.

**Analyze ALL commits** on the branch since diverging from base — not only the latest commit.

---

## Step 2 — Draft names and messages (before git write ops)

From the full diff (uncommitted + any existing branch commits), draft:

### A) Feature branch name (when on `main`/`master`)

| Rule | Example |
|------|---------|
| Prefix by intent | `feat/`, `fix/`, `chore/`, `docs/` |
| Lowercase slug, hyphens | `feat/pwa-brand-assets` |
| ≤ ~50 chars after prefix | `chore/cursor-rules-and-pr-command` |
| Override via trailing `branch:` | `branch: feat/my-name` |

### B) Commit message (when auto-committing)

Use HEREDOC format — **1–2 sentence summary**, then bullets by area:

```
Improve PWA and OG brand assets for EXIFilixir.

- Regenerate favicon and manifest icons from SVG
- Wire metadata / OG image in app layout
- Add Cursor rules and slash commands
```

Match repo tone. Focus on **why**, not just file names.

**Never stage or commit:** `.env*`, secrets, `node_modules/`, `.next/`, `out/`, build artifacts (honour `.gitignore`).

### C) PR title and body

Proceed to Steps 3–4 below. PR title may match commit subject line when there is a single commit; use an umbrella title when multiple commits.

---

## Step 3 — Auto-commit and create feature branch (Create modes only)

Skip entirely for **Draft only**. Skip auto-commit when trailing text contains **no commit** or **committed only**.

Requires `git_write` permission.

### Order of operations

1. **If on `main` or `master`** — create and switch to feature branch first (uncommitted changes carry over):

```bash
git checkout -b feat/your-derived-slug
```

2. **If uncommitted/untracked safe files exist** — stage and commit on the feature branch:

```bash
git add <relevant paths>   # explicit paths from status — avoid blind git add -A
git commit -m "$(cat <<'EOF'
Your comprehensive commit message here.

- Bullet one
- Bullet two
EOF
)"
```

3. **If already on a feature branch** (not `main`/`master`) — only run step 2 when there is uncommitted work.

4. Re-run `git status` and `git log origin/main..HEAD --oneline` before drafting final PR body.

**Do not** commit on `main`/`master` — always create the feature branch first.

---

## Step 4 — Draft PR title

Rules:

- One line, **≤ 72 characters** when possible
- **Imperative mood** — "Add …", "Fix …", "Update …", "Refactor …"
- Lead with the **primary outcome**
- If multiple themes, use an umbrella title + detail in the body

Bad: `updates` / `fix stuff` / `WIP`  
Good: `Add PWA brand assets and Cursor agent tooling`

---

## Step 5 — Draft PR description

Use this structure (omit empty sections):

```markdown
## Summary

<2–4 sentences: what this PR does and why.>

## Changes

<Bulleted list grouped by area. Each bullet = one logical change, not one file.>

### App / UI
- …

### Image pipeline / Cloud Functions
- …

### Firebase / deploy
- …

### Docs / Cursor rules / agent tooling
- …

### ls-foundry / `@jeffgo10/*`
- …

## Commits

| SHA | Message |
|-----|---------|
| `abc1234` | … |

## Test plan

- [ ] `npm run lint`
- [ ] `npm run build` (static export → `out/`)
- [ ] `npm run dev` → upload a 360° image (with Functions emulator if testing process)
- [ ] Processed image has 2:1 aspect and GPano tags (when pipeline changed)
- [ ] Token auth: missing token → 401 in production config; valid token succeeds
- [ ] PWA icons / OG preview look correct (when assets/metadata changed)
- [ ] Panorama viewer / helpers still work after `@jeffgo10/*` bumps (when applicable)
- [ ] …

## Notes / follow-ups

<Env setup, migration steps, breaking changes, or "None.">
```

Guidelines:

- **Summary** — answer "what would a reviewer need to know in 30 seconds?"
- **Changes** — derive from diff + commits
- **Test plan** — concrete commands; include upload + EXIF checks when pipeline changed
- **Do not** include secrets, tokens, or `.env` contents
- **Do not** paste huge diffs — summarize

If trailing text scoped the PR, focus Summary/Changes on that scope but note other commits still on the branch.

---

## Step 6 — Push (Create modes only)

If not pushed or ahead of origin:

```bash
git push -u origin HEAD
```

Requires `network` / `git_write` permissions. Never force-push to `main`/`master`. Warn before any force-push to other branches.

---

## Step 7 — Create PR

**If Step 0 passed** — use HEREDOC for body:

```bash
gh pr create --base main --title "…" --body "$(cat <<'EOF'
## Summary
…
EOF
)"
```

Add `--draft` when mode is **Create draft PR**.

If a PR already exists for this branch:

```bash
gh pr view --json url,title
```

Report the existing URL; offer to edit title/body with `gh pr edit` if the user wants.

**If Step 0 failed** — skip `gh pr create`. Report web URL + proposed title/body for manual paste.

After a successful **`gh pr create`**, note in the report:

> After the PR is **merged**, run `/create-github-pr cleanup` (or Step 8 below) to return to `main` and pull.

---

## Step 8 — Return to `main` after merge (cleanup)

Run when:

- Trailing text contains **`cleanup`**, **`sync main`**, **`back to main`**, or **`merged`**
- **Or** `gh pr view` shows the current branch PR state is **MERGED**
- **Or** user confirms the PR was just merged

Requires `git_write` and `network` permissions.

```bash
FEATURE_BRANCH="$(git branch --show-current)"

git checkout main
git pull origin main

git branch -d "$FEATURE_BRANCH" 2>/dev/null || true
```

| Result | Action |
|---|---|
| `git branch -d` succeeds | Local feature branch removed |
| `git branch -d` fails | Branch not fully merged — keep it; report reason |
| Uncommitted changes on feature branch | **Stop** — commit, stash, or discard first; do not force checkout |

**Do not** delete the remote branch unless the user asks (`git push origin --delete`).

Report:

```markdown
### Post-merge cleanup
- **Checked out:** `main`
- **Pulled:** `origin/main` @ `<short-sha>`
- **Local branch deleted:** `feat/…` / kept (reason)
```

Skip Step 8 for **Draft only** unless user explicitly requested cleanup.

When **only** cleanup is requested (trailing `cleanup` / `sync main` / `merged`), run Step 8 and report — skip PR creation steps.

---

## Step 9 — Report

Include what was automated:

```markdown
## Pull request workflow

### Git automation
- **Branch created:** `feat/…` (was on `main`) / already on feature branch
- **Auto-commit:** ✅ `<subject line>` / skipped (no uncommitted changes / `no commit` mode)

### Post-merge cleanup (Step 8, when run)
- **Checked out:** `main`
- **Pulled:** `origin/main` @ `<short-sha>`
- **Local branch deleted:** `…` / kept (reason)

### PR
**URL:** …
**Title:** …
**Base:** main ← `branch`
**Commits:** N
```

**Draft only** — show proposed branch name, commit message, title, and body; note "Say create it to run git ops and open PR."

---

## Usage examples

```
/create-github-pr
/create-github-pr draft only
/create-github-pr as draft
/create-github-pr no commit
/create-github-pr branch: feat/pwa-assets
/create-github-pr base: develop
/create-github-pr title: Add brand assets and OG metadata
/create-github-pr preview: cursor rules only
/create-github-pr cleanup
/create-github-pr sync main
/create-github-pr merged
```

---

## Do not

- Commit secrets (`.env*`, tokens) — honour `.gitignore`
- Commit or push on `main`/`master` — create feature branch first
- Include `.env` or API keys in the PR body
- Use `--fill` blindly — always write a tailored summary from full branch analysis
- Run `git config` changes
- Force-push to `main`/`master`
