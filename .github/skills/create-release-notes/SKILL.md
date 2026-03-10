---
name: create-release-notes
description: Create a release note for the next TypeSpec release by gathering changes from changesets and formatting them in the standard release note pattern.
---

# Create Release Notes

Creates the release note markdown file for the next TypeSpec release in `website/src/content/docs/docs/release-notes/`.

## When to Use

Use this skill when:
- A new TypeSpec release is being prepared
- An issue asks to "create release note for next release"
- The task involves gathering changelogs from `.chronus/changes/`

## Preconditions

- You must be at the repository root.
- Dependencies must be installed (`pnpm install`).
- If GitHub API access is available (not blocked), prefer running `pnpm chronus changelog --policy typespec-stable --policy typespec-preview` for an automated output.

## Version Policies

The release note covers changes from packages in two policies defined in `.chronus/config.yaml`:

**typespec-stable** (lockstep, minor steps):
- `@typespec/compiler`
- `@typespec/http`
- `@typespec/openapi`
- `@typespec/openapi3`
- `@typespec/json-schema`
- `typespec-vscode`
- `@typespec/prettier-plugin-typespec`

**typespec-preview** (lockstep, minor steps):
- `@typespec/versioning`
- `@typespec/rest`
- `@typespec/protobuf`
- `@typespec/eslint-plugin`
- `@typespec/html-program-viewer`
- `@typespec/internal-build-utils`
- `typespec-vs`
- `@typespec/library-linter`
- `@typespec/events`
- `@typespec/sse`
- `@typespec/streams`
- `@typespec/xml`
- `@typespec/standalone-cli`

## Steps

### Step 1: Determine the next version and release date

1. Check the current version from the compiler package:
   ```bash
   cat packages/compiler/package.json | grep '"version"'
   ```
2. The next release version increments the minor version (e.g., `1.9.0` → `1.10.0`).
3. Use the current date as the release date (format: `YYYY-MM-DD`).

### Step 2: Try automated changelog generation

Attempt to run the chronus changelog command. This requires GitHub API access:

```bash
pnpm chronus changelog --policy typespec-stable --policy typespec-preview
```

If this succeeds, use the output as the basis for the release note, then skip to Step 5 to clean up.

If this fails (e.g., network blocked), proceed to Step 3.

### Step 3: Gather changes manually from changeset files

Read all changeset files in `.chronus/changes/`:

```bash
cat .chronus/changes/*.md
```

For each changeset file, extract:
- `changeKind`: The type of change (`feature`, `fix`, `breaking`, `deprecation`, `internal`, `dependencies`)
- `packages`: List of affected packages
- The description (text after the `---` separator)

**Filter**: Only include changesets where at least one package is in the `typespec-stable` or `typespec-preview` policy lists above. Skip:
- `internal` changeKind (not user-facing)
- `dependencies` changeKind (dependency bumps - remove this category per convention)
- Packages not in either policy (e.g., `@typespec/http-client-python`, `@typespec/http-client-java`, `@typespec/http-specs`, etc.)

### Step 4: Find PR numbers for each change

To add proper PR links, correlate each change with a git commit. Search the git log:

```bash
git log --oneline --no-merges | head -100
```

Match commit messages to changeset descriptions to find the PR number (format: `(#NNNN)` at the end of the commit message).

### Step 5: Create the release note file

Create the file at: `website/src/content/docs/docs/release-notes/release-YYYY-MM-DD.md`

Use this template structure:

```markdown
---
title: "X.Y.0"
releaseDate: YYYY-MM-DD
version: "X.Y.0"
---

# X.Y.0

## Breaking Changes   (only if any exist)

### @typespec/package-name

- [#NNNN](https://github.com/microsoft/typespec/pull/NNNN) Description of the breaking change

## Deprecations   (only if any exist)

### @typespec/package-name

- [#NNNN](https://github.com/microsoft/typespec/pull/NNNN) Description of the deprecation

## Features

### @typespec/package-name

- [#NNNN](https://github.com/microsoft/typespec/pull/NNNN) Description of the feature

## Bug Fixes

### @typespec/package-name

- [#NNNN](https://github.com/microsoft/typespec/pull/NNNN) Description of the fix
```

**Formatting rules:**
- Sections appear in order: Breaking Changes, Deprecations, Features, Bug Fixes
- Omit a section entirely if it has no entries
- Under each section, group changes by package name (sorted alphabetically or by policy order)
- Each package is a `###` heading with its full package name (e.g., `### @typespec/compiler`)
- Each entry is a list item with a linked PR number followed by the description
- The `Dependencies` category is always omitted from release notes
- The `Internal` category is always omitted from release notes

### Step 6: Reference existing release notes for the pattern

Look at recent release notes as examples:

```bash
cat website/src/content/docs/docs/release-notes/release-2026-02-10.md
```

### Step 7: Register the release note in the sidebar (if needed)

Check if the website sidebar or navigation config needs to be updated. Usually the website auto-discovers markdown files so no extra step is needed. Verify by checking:

```bash
ls website/src/content/docs/docs/release-notes/*.md | tail -5
```

## Notes

- PR links follow this format: `[#NNNN](https://github.com/microsoft/typespec/pull/NNNN)`
- If a PR number cannot be found for a change, include the description without a PR link
- If a single changeset affects multiple packages in the policy, create one entry per package under its respective heading
- When a change affects both `@typespec/openapi` and `@typespec/openapi3`, include it under both package headings
