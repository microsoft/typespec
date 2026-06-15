---
name: fix-graphql-bug
description: Fix a bug from the typespec_graphql_emitter Jira backlog. Use when the user wants to pick up and fix a GraphQL emitter bug from Jira. Fetches open bugs with the typespec_graphql_emitter label, loads emitter context (graphql-emitter skill, mutator-framework skill, design docs), brainstorms the fix approach, implements with TDD, runs all tests including e2e manual validation, creates a PR, links it to Jira, and updates the test coverage table.
---

# Fix GraphQL Emitter Bug

End-to-end workflow: pick a bug from Jira, understand it, design the fix, implement with TDD, validate, PR, link back.

## Workflow

### 1. Pick a bug

Fetch open bugs:
```
mcp__atlassian__jira_search_issues with JQL:
  labels = "typespec_graphql_emitter" AND type = Bug AND status != "In Progress" AND status != "Done"
```

Present the list. Let user pick (or confirm if only one).

### 2. Load context

Invoke skills:
- `graphql-emitter` (architecture, key files, design docs in references/)
- `mutator-framework`
- `emitter-framework`

Read the source files relevant to the bug (typical starting points):
- `packages/graphql/src/mutation-engine/schema-mutator.ts`
- `packages/graphql/src/mutation-engine/mutations/model.ts`
- `packages/graphql/src/mutation-engine/type-graph.ts`
- `packages/graphql/src/components/schema.tsx`

### 3. Create branch

```bash
git fetch origin feature/graphql
git checkout -b swatkatz/fix-<slug> origin/feature/graphql
```

### 4. Design the fix

Use `superpowers:brainstorming` to explore the approach. Keep it short for bug fixes. Identify:
- Root cause (which file, which function, why)
- Fix approach (what to change)
- Edge cases

Add implementation details to the Jira issue as a comment via `mcp__atlassian__jira_update_issue`.

### 5. Implement with TDD

Use `superpowers:test-driven-development`:
1. Write failing test in `test/e2e.test.ts` reproducing the bug (use the Jira's "Failing Test Case" if provided)
2. Verify it fails for the right reason
3. Implement minimal fix
4. Verify it passes

### 6. Build and run full test suite

```bash
export PATH="$HOME/.npm-global/bin:$PATH"
npx -y node@22 $HOME/.npm-global/bin/pnpm --filter @typespec/graphql run build
npx -y node@22 $HOME/.npm-global/bin/pnpm --filter @typespec/graphql exec vitest run
```

All tests must pass (except known API-5280 crash in e2e-manual schema 09).

### 7. Run e2e manual validation

```bash
npx -y node@22 $HOME/.npm-global/bin/pnpm --filter @typespec/graphql exec vitest run test/e2e-manual/emit.test.ts
```

8 schemas pass, only schema 09 (nested empty model) is a known crash.

### 8. Update TEST_COVERAGE.md

Edit `test/e2e-manual/TEST_COVERAGE.md`:
- Update pattern result from bug reference to "Correct (fixed in PR #N)"
- Update Known Bugs table status

### 9. Commit and create PR

```bash
git add <files>
git commit -m "<message>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push -u origin swatkatz/fix-<slug>
gh pr create --base feature/graphql --title "<title>" --body "..."
```

PR body must include:
- `Fixes [API-XXXX](https://pinterest.atlassian.net/browse/API-XXXX).`
- Summary of root cause and fix
- Test plan checklist

### 10. Link PR to Jira and update status

```
mcp__atlassian__jira_link_pull_request:
  issue_key: API-XXXX
  pull_request_url: <github PR URL>

mcp__atlassian__jira_transition_issue:
  issue_key: API-XXXX
  transition: "In Progress"
```
