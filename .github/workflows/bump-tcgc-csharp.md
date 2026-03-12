---
name: Bump TCGC in http-client-csharp
description: |
  Checks daily for new stable releases of @azure-tools/typespec-client-generator-core
  and opens a PR to upgrade the http-client-csharp emitter when one is found.

on:
  schedule: daily
  workflow_dispatch:

permissions: read-all

network:
  allowed:
  - defaults
  - node

tools:
  github:
    toolsets: [default]
  edit:
  bash: true

timeout-minutes: 30

safe-outputs:
  create-pull-request:
    draft: true
    title-prefix: "[tcgc-bump] "
    labels: [dependencies, "emitter:client:csharp"]
    protected-files: fallback-to-issue
---

# Automatic TCGC Version Bump for http-client-csharp

Check if a new non-dev release of `@azure-tools/typespec-client-generator-core` (TCGC) is available and, if so, open a pull request that upgrades the `http-client-csharp` emitter package.

## Step 1 — Detect the latest stable TCGC version

Run the following command to get all published versions, then pick the latest one that does **not** contain a pre-release tag (no `-dev`, `-alpha`, `-beta`, `-rc` suffixes):

```bash
npm view @azure-tools/typespec-client-generator-core versions --json \
  | node -e "
    const versions = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const stable = versions.filter(v => !/-/.test(v));
    if (stable.length === 0) { console.error('No stable versions found'); process.exit(1); }
    console.log(stable[stable.length - 1]);
  "
```

Save the result as `LATEST_STABLE`. If no stable version is found, stop — there is nothing to do.

## Step 2 — Check for existing open PRs

Before proceeding, search for any **open** pull requests in this repository whose title contains `Bump TCGC to <LATEST_STABLE>` (substituting the actual version) **and** that have the `emitter:client:csharp` label. If such a PR already exists, **stop here** — no new pull request should be created.

## Step 3 — Read the current version from package.json

Read the file `packages/http-client-csharp/package.json` and extract the exact version listed under `devDependencies["@azure-tools/typespec-client-generator-core"]`.

Save the result as `CURRENT_VERSION`.

## Step 4 — Compare versions

If `LATEST_STABLE` equals `CURRENT_VERSION`, **stop here** — there is nothing to do and **no pull request should be created**.

If `LATEST_STABLE` is newer than `CURRENT_VERSION`, continue to Step 5.

## Step 5 — Perform the TCGC upgrade

Follow the step-by-step instructions in `.github/prompts/upgrade-tcgc.instructions.md` to upgrade the `http-client-csharp` emitter to `LATEST_STABLE`. That file is a Copilot prompt — read it and execute the migration phases it describes (package upgrade, build, fix breaking changes, regenerate tests) for the emitter located at `packages/http-client-csharp` with the target version `LATEST_STABLE`.

This will:

1. Update `devDependencies` and `peerDependencies` in `packages/http-client-csharp/package.json`.
2. Synchronize related `@azure-tools/*` and `@typespec/*` dependency versions as needed.
3. Resolve any peer dependency conflicts.
4. Build the emitter and fix any breaking changes.
5. Regenerate test projects by running `eng/scripts/Generate.ps1` inside `packages/http-client-csharp`.

**Important constraints (from the upgrade instructions):**

- Only use `npm` (not pnpm or yarn).
- Never use `--legacy-peer-deps`, `--force`, or `--omit-peer`.
- Never delete or relax existing upper peer bounds.
- Use exact versions for dev packages (no tilde ranges).
- Do not modify any files outside `packages/http-client-csharp/` unless the upgrade instructions specifically require it (such as regenerating the sample service under `docs/samples/client/csharp/`).

## Step 6 — Create a pull request

Open a pull request with:

- **Title**: `Bump TCGC to <LATEST_STABLE> in http-client-csharp`
- **Branch name**: `auto/bump-tcgc-csharp-<LATEST_STABLE>`
- **Description**: Include what version was bumped from and to, a link to the TCGC changelog, and a summary of any related dependency changes.
- **Labels**: `dependencies`, `emitter:client:csharp`

The TCGC changelog can be found at:
`https://github.com/Azure/typespec-azure/blob/main/packages/typespec-client-generator-core/CHANGELOG.md`
