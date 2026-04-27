---
description: |
  Checks daily for new stable releases of @azure-tools/typespec-client-generator-core
  and creates a tracking issue (assigned to Copilot) to upgrade the http-client-csharp
  emitter when one is found and no equivalent issue already exists.

on:
  schedule: daily
  workflow_dispatch:

permissions: read-all

network: defaults

safe-outputs:
  create-issue:
    title-prefix: "Bump TCGC to "
    assignees: [copilot]
  assign-to-agent:
    name: "copilot"
    model: "claude-opus-4.6"

tools:
  web-fetch:
  github:
    toolsets: [issues, repos]
    lockdown: false

timeout-minutes: 15
engine: copilot
---

# Automatic TCGC Version Bump Issue for http-client-csharp

Check if a new non-dev release of `@azure-tools/typespec-client-generator-core` (TCGC) is available and, if so, file a tracking issue assigned to GitHub Copilot to upgrade the `http-client-csharp` emitter package.

## Step 1 — Detect the latest stable TCGC version

Use `web-fetch` to read the npm registry metadata at `https://registry.npmjs.org/@azure-tools/typespec-client-generator-core` and find all published versions.

Pick the latest version that does **not** contain a pre-release tag (no `-dev`, `-alpha`, `-beta`, `-rc` suffixes — i.e. the version string contains no `-` character).

Save the result as `LATEST_STABLE`. If no stable version is found, **stop here** — there is nothing to do.

## Step 2 — Read the current version from package.json

Use the `get_file_contents` tool to read `packages/http-client-csharp/package.json` from the default branch and extract the exact version listed under `devDependencies["@azure-tools/typespec-client-generator-core"]`.

Save the result as `CURRENT_VERSION`.

## Step 3 — Compare versions

If `LATEST_STABLE` equals `CURRENT_VERSION` (or `LATEST_STABLE` is not newer), **stop here** — there is nothing to do and **no issue should be created**.

If `LATEST_STABLE` is newer than `CURRENT_VERSION`, continue to Step 4.

## Step 4 — Check for existing duplicate issues

Search for any existing issue (open **or** closed) in this repository that already tracks an upgrade to `LATEST_STABLE` for the `http-client-csharp` emitter. Use the `search_issues` tool with a query like:

```
repo:${{ github.repository }} is:issue label:"emitter:client:csharp" "Bump TCGC to LATEST_STABLE" in:title,body
```

(replace `LATEST_STABLE` with the actual version string).

Treat an issue as a duplicate when **all** of the following are true:

- It carries the `emitter:client:csharp` label.
- Its title or body references upgrading TCGC to the same `LATEST_STABLE` version (e.g. `Bump TCGC to <LATEST_STABLE>`).

If any duplicate issue exists (in any state — `open` or `closed`), **stop here** — no new issue should be created.

## Step 5 — Create the tracking issue

Create exactly one new issue using the `create-issue` safe output. Use the same structure as the canonical example issue [#10367](https://github.com/microsoft/typespec/issues/10367):

- **Title** (after the configured `Bump TCGC to ` prefix): `<LATEST_STABLE>` — the final issue title will be `Bump TCGC to <LATEST_STABLE>`.
- **Body** (markdown):

  ```
  Bump TCGC to [<LATEST_STABLE>](https://github.com/Azure/typespec-azure/blob/main/packages/typespec-client-generator-core/CHANGELOG.md#<anchor>) and it's related dependencies for the http-client-csharp package. Rerun Generate.ps1 and ensure all existing tests pass.
  ```

  - Replace `<LATEST_STABLE>` with the actual version (e.g. `0.67.2`).
  - Replace `<anchor>` with the GitHub-style anchor for that version on the CHANGELOG page (lowercased, dots removed — e.g. `0.67.2` → `0672`).
- **Labels**: include `emitter:client:csharp`. (Other labels may be applied automatically by the repository.)
- **Assignees**: the workflow is configured to assign `copilot` automatically via the `create-issue` safe output configuration (`assignees: [copilot]`). The `assign-to-agent` configuration in the frontmatter sets the default model for the assigned Copilot coding agent to `claude-opus-4.6`.

Do not perform the upgrade in this workflow — Copilot will pick up the issue once it is assigned and follow the instructions in `.github/prompts/upgrade-tcgc.instructions.md` to perform the actual TCGC version bump.
