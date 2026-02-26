---
name: code-review-gate
description: Run structured code reviews focused on correctness, security, regressions, and missing tests with severity-ranked findings. Use when the user asks for review, PR feedback, or change-risk analysis.
---

# Code Review Gate

## Review Priorities

1. Correctness and behavior regressions.
2. Security and data exposure risks.
3. Reliability and operational failure modes.
4. Test completeness for changed behavior.
5. Maintainability and long-term complexity.

## Severity Model

- **Blocker**: Must be fixed before merge.
- **Major**: High-risk defect or missing coverage.
- **Minor**: Improvement recommended before merge if feasible.
- **Suggestion**: Optional improvement.

## Review Workflow

1. Inspect changed code paths and connected dependencies.
2. Enumerate findings in severity order with concrete fix guidance.
3. Call out missing tests and required scenarios.
4. State assumptions and open questions explicitly.
5. Provide a short residual risk summary.

## Output Template

Use this structure:

```markdown
Findings (highest severity first)
1) [Severity] Title
   - Why it matters
   - Suggested fix

Open questions / assumptions
- ...

Residual risk
- ...
```
