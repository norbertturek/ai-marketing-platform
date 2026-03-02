---
name: ship
description: Commit, push, create a pull request, and merge — full shipping workflow in one command. Use when the user is done with a feature and wants to ship it to main.
argument-hint: "[optional commit message or feature description]"
---

# Ship

Ship the current changes to main through a proper PR workflow: commit → branch → push → PR → merge.

## Workflow

### Step 1: Pre-flight checks

Before anything, validate the changes are ready to ship:

1. Run `git status` to see all changed files.
2. Run `git diff --stat` to understand the scope.
3. Run tests for affected areas:
   - If `apps/web/` files changed: `pnpm --filter web test -- --run 2>&1 | tail -30`
   - If `apps/api/` files changed: `pnpm --filter api test -- --run 2>&1 | tail -30`
4. Run `pnpm check-types` to verify TypeScript.
5. Run `pnpm lint` to verify linting.

**If any check fails — STOP. Fix the issues first. Do not ship broken code.**

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
   git commit -m "feat(scope): description

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
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
- [ ] Manual verification (if applicable)

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

**PR rules:**
- Title matches the commit message (without Co-Authored-By)
- Title under 70 characters
- Body includes Summary, Changes, and Test plan sections
- Always include the test plan checklist

### Step 5: Merge the pull request

1. Wait for PR creation to complete.
2. Merge using: `gh pr merge --squash --delete-branch`
   - **Squash merge** to keep main history clean
   - **Delete branch** to clean up after merge
3. Switch back to main: `git checkout main`
4. Pull latest: `git pull origin main`
5. Report the merged PR URL to the user.

## Output

After completion, report:
```
✓ Tests passed
✓ Branch: feat/short-description
✓ Commit: feat(scope): description
✓ PR: #123 — https://github.com/user/repo/pull/123
✓ Merged to main
✓ Branch cleaned up
```

## Safety Rules

- **Never force push** (`--force` or `-f`)
- **Never commit secrets** (`.env`, credentials, API keys)
- **Never skip tests** — if tests fail, stop and fix
- **Never merge with failing checks** — wait for CI if configured
- **Always squash merge** — keeps main history clean
- **Always delete the feature branch** after merge
- If the user says "don't merge" or "just PR", stop after Step 4
- If unsure about anything, ask the user before proceeding
