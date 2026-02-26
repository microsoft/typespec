---
name: emitter-prep-for-pr
description: >
  Prepare language emitter changes for PR: validate (build, format, lint), add
  a changeset, and push. This skill is specifically for the language emitter
  packages (http-client-python, http-client-csharp, http-client-java) - NOT for
  core TypeSpec packages like compiler, http, openapi3, etc. Use when the user
  wants to finalize emitter changes, says things like "prep for pr", "prepare
  for PR", "validate and push", "add changeset", or "finalize changes".
---

# Emitter Prep for PR

Prepares language emitter changes for pull request by running build/format/lint,
creating a changeset with an appropriate message, and pushing to the remote branch.

**This skill is for language emitter packages only:**
- `http-client-python`
- `http-client-csharp`
- `http-client-java`

Do NOT use this skill for core TypeSpec packages (compiler, http, openapi3, etc.).

## Workflow

### Step 1: Identify changed language emitter packages

Determine which language emitter packages have changes:

```bash
cd ~/Desktop/github/typespec

# Compare against upstream/main (microsoft/typespec) if available, otherwise main
BASE_BRANCH=$(git rev-parse --verify upstream/main 2>/dev/null && echo "upstream/main" || echo "main")

# Filter for language emitter packages only
git diff "$BASE_BRANCH" --name-only | grep "^packages/http-client-" | cut -d'/' -f2 | sort -u
```

This filters for `http-client-python`, `http-client-csharp`, `http-client-java`, etc.

### Step 2: Validate each changed emitter package

For each changed emitter package (e.g., `http-client-python`, `http-client-csharp`, `http-client-java`):

```bash
cd ~/Desktop/github/typespec/packages/PACKAGE_NAME

# Build
npm run build
if [ $? -ne 0 ]; then
  echo "Build failed for PACKAGE_NAME"
  exit 1
fi

# Format
npm run format
if [ $? -ne 0 ]; then
  echo "Format failed for PACKAGE_NAME"
  exit 1
fi

# Lint (if available)
npm run lint 2> /dev/null || echo "No lint script for PACKAGE_NAME"
```

If any step fails, report the error and stop. Do not proceed to changeset.

### Step 3: Run format at repo root

After validating individual packages, run format at the repo root:

```bash
cd ~/Desktop/github/typespec
pnpm format
```

### Step 4: Analyze changes for changeset message

Examine the changes to determine an appropriate changeset message:

```bash
cd ~/Desktop/github/typespec

# Determine base branch
BASE_BRANCH=$(git rev-parse --verify upstream/main 2>/dev/null && echo "upstream/main" || echo "main")

# Get commit messages on this branch
git log "$BASE_BRANCH"..HEAD --oneline

# Get changed files
git diff "$BASE_BRANCH" --name-only

# Get the actual code changes (for understanding intent)
git diff "$BASE_BRANCH" --stat
```

### Step 5: Determine changeset parameters

Based on the changes, determine:

1. **changeKind** - one of:
   - `internal` - Internal changes not user-facing (tests, docs, refactoring)
   - `fix` - Bug fixes (patch version bump)
   - `feature` - New features (minor version bump)
   - `deprecation` - Deprecating existing features (minor version bump)
   - `breaking` - Breaking changes (major version bump)
   - `dependencies` - Dependency bumps (patch version bump)

2. **packages** - affected packages, e.g.:
   - `@typespec/http-client-python`
   - `@typespec/http-client-csharp`
   - `@typespec/http-client-java`

3. **message** - concise description of the change

### Step 6: Create changeset file

Create a changeset file in `.chronus/changes/`:

```bash
cd ~/Desktop/github/typespec

# Generate filename with timestamp
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
FILENAME=".chronus/changes/BRANCH_NAME-${TIMESTAMP}.md"

cat > "$FILENAME" << 'EOF'
---
changeKind: <KIND>
packages:
  - "<PACKAGE>"
---

<MESSAGE>
EOF
```

### Step 7: Show changes and prompt user

Display all changes to the user:

```bash
cd ~/Desktop/github/typespec
git status
git diff --stat
```

Then use AskUserQuestion to confirm:

- Show the changeset that will be added
- Show the files that will be committed
- Show which remote will be used: "Will push to `origin`"
- Ask: "Do these changes look good to push to origin?"

Options:

- "Yes, push to origin" - proceed with commit and push to origin
- "Push to different remote" - ask which remote to use instead
- "Edit changeset" - let user modify the changeset message/kind
- "Cancel" - abort without pushing

If user selects "Push to different remote", ask which remote name to use and push to that instead of origin.

### Step 8: Commit and push (if approved)

If user approves, commit the changes:

```bash
cd ~/Desktop/github/typespec

# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "$(
  cat << 'EOF'
<COMMIT_MESSAGE>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

Then push to the user's fork. **Default to `origin`**, but if the user specified a different remote, use that instead:

```bash
# Get current branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Push to origin by default (or user-specified remote)
git push -u origin "$BRANCH"
```

### Asking about remote

When prompting the user in Step 7, include the remote that will be used:

- Show: "Will push to `origin` (your fork)"
- If the user says to use a different remote (e.g., "push to `myfork`"), use that instead

**Important:** Never push directly to the `microsoft/typespec` remote (usually named `upstream`).

## Changeset Message Guidelines

Write changeset messages that are:

1. **User-focused** - Describe the impact on users, not implementation details
2. **Concise** - One sentence, starting with a verb (Add, Fix, Update, Remove)
3. **Specific** - Mention the feature/fix clearly

### Examples by changeKind:

**internal:**

- "Refactor namespace resolution logic for clarity"
- "Add mock API tests for paging scenarios"
- "Update development tooling and skills"

**fix:**

- "Fix incorrect deserialization of nullable enum properties"
- "Fix client initialization when using custom endpoints"

**feature:**

- "Add support for XML serialization in request bodies"
- "Add `@clientOption` decorator for customizing client behavior"

**deprecation:**

- "Deprecate `legacyMode` option in favor of `compatibilityMode`"

**breaking:**

- "Remove deprecated `v1` client generation mode"
- "Change default serialization format from XML to JSON"

## Language Emitter Package Names

| Folder               | Package Name                   |
| -------------------- | ------------------------------ |
| `http-client-python` | `@typespec/http-client-python` |
| `http-client-csharp` | `@typespec/http-client-csharp` |
| `http-client-java`   | `@typespec/http-client-java`   |

## Notes

### When to use each changeKind

- **internal**: Tests, documentation, refactoring, CI/CD changes, skill updates
- **fix**: Bug fixes that users would notice
- **feature**: New capabilities users can use
- **deprecation**: Marking something as deprecated (still works, but discouraged)
- **breaking**: Removing or changing behavior in incompatible ways

### Multiple packages

If changes affect multiple packages, list all of them:

```yaml
packages:
  - "@typespec/http-client-python"
  - "@typespec/http-client-csharp"
```

### Skipping changeset

Some changes don't need a changeset:

- Changes only to `.github/skills/` (CI will allow this)
- Changes only to test files (if marked in `changedFiles` config)
- Changes only to markdown files (if marked in `changedFiles` config)

Check `.chronus/config.yaml` for `changedFiles` patterns that are excluded.
