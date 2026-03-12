---
on:
  schedule: daily
permissions:
  contents: read
tools:
  github:
    toolsets: [pull-requests, issues]
  bash: ["npm", "node", "jq", "cat", "grep"]
safe-outputs:
  create-pull-request: {}
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

## Step 2 — Read the current version from package.json

Read the file `packages/http-client-csharp/package.json` and extract the exact version listed under `devDependencies["@azure-tools/typespec-client-generator-core"]`.

Save the result as `CURRENT_VERSION`.

## Step 3 — Compare versions

If `LATEST_STABLE` equals `CURRENT_VERSION`, **stop here** — there is nothing to do and **no pull request should be created**.

If `LATEST_STABLE` is newer than `CURRENT_VERSION`, continue to Step 4.

## Step 4 — Perform the TCGC upgrade

Follow the instructions in `.github/prompts/upgrade-tcgc.instructions.md` to upgrade the `http-client-csharp` emitter to the `LATEST_STABLE` version. Run the upgrade command, replacing `<LATEST_STABLE>` with the actual version number from Step 1:

```
tcgc upgrade http-client-csharp <LATEST_STABLE>
```

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

## Step 5 — Create a pull request

Open a pull request with:

- **Title**: `Bump TCGC to <LATEST_STABLE> in http-client-csharp`
- **Branch name**: `auto/bump-tcgc-csharp-<LATEST_STABLE>`
- **Description**: Include what version was bumped from and to, a link to the TCGC changelog, and a summary of any related dependency changes.
- **Labels**: `dependencies`

The TCGC changelog can be found at:
`https://github.com/Azure/typespec-azure/blob/main/packages/typespec-client-generator-core/CHANGELOG.md`
