---
name: validate-and-changeset
description: >
  Validate emitter changes (build, format, lint), add a changeset, and push.
  Use when the user wants to finalize their changes, says things like "validate
  and push", "add changeset", "prepare for PR", "finalize changes", or is ready
  to commit and push their work.
---

# Validate and Changeset Skill

Validates emitter changes by running build/format/lint, creates a changeset with
an appropriate message, and pushes to the remote branch after user confirmation.

## Workflow

### Step 1: Identify changed packages

Determine which emitter packages have changes:

```bash
cd ~/Desktop/github/typespec
git diff main --name-only | grep "^packages/" | cut -d'/' -f2 | sort -u
```

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

# Get commit messages on this branch
git log main..HEAD --oneline

# Get changed files
git diff main --name-only

# Get the actual code changes (for understanding intent)
git diff main --stat
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
- Ask: "Do these changes look good to push?"

Options:

- "Yes, push to remote" - proceed with commit and push
- "Edit changeset" - let user modify the changeset message/kind
- "Cancel" - abort without pushing

### Step 8: Commit and push (if approved)

If user approves:

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

# Get current branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Push to remote (use -u to set upstream if not already set)
git push -u origin "$BRANCH"
```

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

## Package Name Mapping

| Folder               | Package Name                   |
| -------------------- | ------------------------------ |
| `http-client-python` | `@typespec/http-client-python` |
| `http-client-csharp` | `@typespec/http-client-csharp` |
| `http-client-java`   | `@typespec/http-client-java`   |
| `compiler`           | `@typespec/compiler`           |
| `http`               | `@typespec/http`               |

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
