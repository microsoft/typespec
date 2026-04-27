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
checking for a changeset, and pushing to the remote branch.

**This skill is for language emitter packages only:**

- `http-client-python`
- `http-client-csharp`
- `http-client-java`

Do NOT use this skill for core TypeSpec packages (compiler, http, openapi3, etc.).

## Workflow

### Step 1: Determine the emitter package

Figure out which emitter package the user is working on from context (cwd, recent
changes, or ask). The package will be under `packages/<package-name>/`.

### Step 2: Build, format, and lint the emitter package

```bash
cd ~/Desktop/github/typespec/packages/PACKAGE_NAME

# Build
npm run build

# Format (includes both TypeScript and Python formatting)
npm run format

# Lint (emitter-only is fine for quick validation)
npm run lint -- --emitter
```

If any step fails, report the error and stop. Do not proceed.

### Step 3: Run format at repo root

```bash
cd ~/Desktop/github/typespec
pnpm format
```

**Important:** `pnpm format` may touch files outside the emitter package (e.g.,
`.devcontainer/`, other packages). When staging changes in Step 6, **only stage
files within the emitter package directory** (`packages/PACKAGE_NAME/`) and
`.chronus/changes/` and `.github/skills/`. Discard any formatting changes to
unrelated files with `git checkout -- <file>`.

### Step 4: Check for existing changeset

Check if a changeset already exists for the current branch:

```bash
cd ~/Desktop/github/typespec
BRANCH=$(git rev-parse --abbrev-ref HEAD)
ls .chronus/changes/ | grep -i "$BRANCH" || echo "NO_CHANGESET"
```

- If a changeset **exists**: Skip to Step 6 (no need to create one).
- If **NO_CHANGESET**: Proceed to Step 5 to create one.

### Step 5: Create changeset (only if none exists)

Ask the user what kind of change this is, or infer from context:

1. **changeKind** - one of: `internal`, `fix`, `feature`, `deprecation`, `breaking`, `dependencies`
2. **message** - concise user-focused description

Then create the file:

```bash
cd ~/Desktop/github/typespec
BRANCH=$(git rev-parse --abbrev-ref HEAD)
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
FILENAME=".chronus/changes/${BRANCH}-${TIMESTAMP}.md"
```

```markdown
---
changeKind: <KIND>
packages:
  - "<PACKAGE>"
---

<MESSAGE>
```

### Step 6: Stage, commit, and push

```bash
cd ~/Desktop/github/typespec
git add -A
git status
```

Show the user what will be committed and ask for confirmation. Then:

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git commit -m "<COMMIT_MESSAGE>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

# Always push to origin (user's fork), never upstream
git push origin "$BRANCH"
```

## Changeset Guidelines

### changeKind reference

- **internal**: Tests, CI/CD, refactoring, docs, skills — not user-facing
- **fix**: Bug fixes users would notice
- **feature**: New user-facing capabilities
- **deprecation**: Marking something as deprecated
- **breaking**: Removing or changing behavior incompatibly
- **dependencies**: Dependency version bumps

### Message examples

- `internal`: "Improve CI pipeline performance and test infrastructure"
- `fix`: "Fix incorrect deserialization of nullable enum properties"
- `feature`: "Add support for XML serialization in request bodies"

### Package names

| Folder               | Package Name                   |
| -------------------- | ------------------------------ |
| `http-client-python` | `@typespec/http-client-python` |
| `http-client-csharp` | `@typespec/http-client-csharp` |
| `http-client-java`   | `@typespec/http-client-java`   |
