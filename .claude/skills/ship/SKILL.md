---
name: ship
description: Commit, push, and create a pull request for code review. Does NOT merge — the user reviews and merges manually. Use when the user is done with a feature and wants to open a PR.
argument-hint: "[optional commit message or feature description]"
allowed-tools: Bash(git *), Bash(gh *), Bash(pnpm *)
---

# Ship

Ship the current changes as a PR for code review: commit → branch → push → PR. Do NOT merge — leave the PR open for the user to review.

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
4. If the user provided `$ARGUMENTS`, use that as the basis for the commit message.

### Step 3: Create branch, commit, and push

1. Generate a branch name from the commit message:
   - Format: `feat/short-description` or `fix/short-description`
   - Lowercase, hyphens, max 50 chars
   - Example: `feat/campaign-crud-api`
2. Create and switch to the branch: `git checkout -b <branch-name>`
3. Stage relevant files: `git add <specific files>` (never `git add .` or `git add -A`)
   - **Never stage** `.env`, credentials, or secrets files
4. Commit with the drafted message using a HEREDOC:
   ```
   git commit -m "$(cat <<'EOF'
   feat(scope): description

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```
5. Push the branch: `git push -u origin <branch-name>`

### Step 4: Create pull request

Create a PR using `gh pr create`:

```bash
gh pr create --title "feat(scope): description" --body "$(cat <<'EOF'
## Summary
- Brief description of what changed and why

## Changes
- List of key changes

## Test plan
- [ ] Unit tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Manual verification (if applicable)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**PR rules:**
- Title matches the commit message (without Co-Authored-By)
- Title under 70 characters
- Body includes Summary, Changes, and Test plan sections
- Always include the test plan checklist

### Step 5: Switch back to main

After creating the PR, switch back to main so the next phase of work starts clean:

1. `git checkout main`
2. Report the PR URL to the user for review.

**Do NOT merge the PR.** The user will review and merge manually.

## Output

After completion, report:
```
✓ Tests passed
✓ Branch: feat/short-description
✓ Commit: feat(scope): description
✓ PR: #123 — https://github.com/user/repo/pull/123
→ Ready for code review
```

## Safety Rules

- **Never force push** (`--force` or `-f`)
- **Never commit secrets** (`.env`, credentials, API keys)
- **Never skip tests** — if tests fail, stop and fix
- **Never merge** — PRs are for the user to review and merge
- If unsure about anything, ask the user before proceeding
