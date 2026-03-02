---
name: ship
description: Commit, push, and create a PR for code review. Stops after PR; merge only after user approves. Use when the user wants to ship a feature and do a review before merging.
argument-hint: "[optional commit message or feature description]"
---

# Ship

Ship the current changes via: commit → branch → push → **PR for code review**. Do **not** merge automatically. Merge only after the user explicitly approves.

## Workflow

### Step 1: Pre-flight checks

Before anything, validate the changes are ready to ship:

1. Run `git status` to see all changed files.
2. Run `git diff --stat` to understand the scope.
3. Run tests for affected areas:
   - If `apps/web/` files changed: `pnpm --filter web test 2>&1 | tail -40`
   - If `apps/api/` files changed: `pnpm --filter api test -- --run 2>&1 | tail -30`
4. Run `pnpm check-types` to verify TypeScript.
5. Run `pnpm lint` to verify linting (note: if lint fails only in unchanged areas, say so and continue).

**If tests or typecheck fail — STOP. Fix the issues first. Do not ship broken code.**

### Step 2: Analyze changes and draft commit message

1. Run `git diff` (staged + unstaged) to read all changes.
2. Determine the change type and scope:
   - `feat(web):` — new frontend feature
   - `feat(api):` — new backend feature
   - `fix(web):` or `fix(api):` — bug fix
   - `refactor(web):` or `refactor(api):` — refactoring
   - `docs:` — documentation only
   - `chore:` — tooling, config, dependencies
   - If changes span both apps, use the primary scope or omit scope: `feat: ...`
3. Draft a concise commit message (1 sentence) focusing on the *why*, not the *what*.
4. If the user provided a description, use that as the basis for the commit message.

### Step 3: Create branch, commit, and push

1. Generate a branch name from the commit message:
   - Format: `feat/short-description` or `fix/short-description`
   - Lowercase, hyphens, max 50 chars
   - Example: `feat/campaign-crud-api`
2. Create and switch to the branch: `git checkout -b <branch-name>`
3. Stage relevant files: `git add <specific files>` (never `git add .` or `git add -A`)
   - **Never stage** `.env`, credentials, or secrets files
4. Commit with the drafted message:
   ```
   git commit -m "feat(scope): description"
   ```
5. Push the branch: `git push -u origin <branch-name>`

### Step 4: Create pull request

Create a PR using `gh pr create`:

```bash
gh pr create --title "feat(scope): description" --body "## Summary
- Brief description of what changed and why

## Changes
- List of key changes

## Test plan
- [ ] Unit tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Manual verification (if applicable)"
```

**PR rules:**
- Title matches the commit message
- Title under 70 characters
- Body includes Summary, Changes, and Test plan sections
- Always include the test plan checklist

### Step 4b: Stop and ask for approval

**Do not merge yet.** Report the PR and ask the user to review:

1. Output the **PR URL** clearly so the user can open it for code review.
2. Say: **"Code review ready. When you approve, reply with 'approve' or 'yes' to merge this PR to main."**
3. Stop. Do not run merge unless the user explicitly approves in a follow-up message.

### Step 5: Merge (only after user approval)

Run this **only** when the user has said they approve (e.g. "approve", "yes", "merge it", "looks good"):

1. Merge using: `gh pr merge <PR_NUMBER> --squash --delete-branch`
   - Or if you have the branch name: `gh pr merge --squash --delete-branch` (from the branch) or `gh pr merge <branch> --squash --delete-branch`
2. Switch back to main: `git checkout main`
3. Pull latest: `git pull origin main`
4. Report: "Merged to main. Branch deleted."

**If the user only said "ship" and did not yet say they approve, do not run Step 5.**

## Output after Step 4 (default)

```
✓ Tests passed
✓ Branch: feat/short-description
✓ Commit: feat(scope): description
✓ PR: #123 — https://github.com/user/repo/pull/123

Code review ready. When you approve, reply with **approve** or **yes** to merge this PR to main.
```

## Output after Step 5 (after approval)

```
✓ Merged to main
✓ Branch deleted
```

## Safety Rules

- **Never force push** (`--force` or `-f`)
- **Never commit secrets** (`.env`, credentials, API keys)
- **Never skip tests** — if tests fail, stop and fix
- **Never merge without explicit user approval** — ship stops at PR; merge only when user says they approve
- **Always squash merge** when merging — keeps main history clean
- **Always delete the feature branch** after merge
- **Never add AI/tool attribution** — no "Co-Authored-By", "Generated with", "Made with Cursor/Claude/Copilot", or any similar credit lines in commits, PR bodies, or code. Treat all output as if the user wrote it.
- If unsure about anything, ask the user before proceeding
