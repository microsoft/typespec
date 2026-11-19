---
name: http-client-python-bump-and-release
description: Create a PR to bump TypeSpec/Azure Tools dependencies, update peer dependencies, or release a new version of the http-client-python package.
---

# HTTP Client Python Bump and Release

Create a PR to bump dependencies and release a new version of the http-client-python package.

> **Note:** `{REPO}` refers to the root folder of the `microsoft/typespec` repository.

## Prerequisites

Before starting, verify that `npm-check-updates` is available:

```bash
npx --no-install npm-check-updates --version
```

If the command fails or prompts for installation, install it globally:

```bash
npm install -g npm-check-updates
```

The version script also requires pnpm and the repository's workspace dependencies, even though the emitter uses npm. Verify that `pnpm --version` and `pnpm exec chronus --version` work from `{REPO}`. If pnpm is missing, install the version declared in the root `package.json`'s `packageManager` field. If Chronus is missing, run `pnpm install --frozen-lockfile` from `{REPO}` before continuing.

Use the CFS feed `https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry/` for dependency queries and installation. From the package directory, verify that `npm config get registry` reports this feed; it is configured in the package's `.npmrc`. Do not silently fall back to npmjs.org if the feed is unavailable.

## Workflow

1. Navigate to the package directory:

   ```bash
   cd {REPO}/packages/http-client-python
   ```

2. Inspect the worktree and fetch main without discarding local changes:

   ```bash
   git status --short
   git fetch origin main
   ```

   Preserve unrelated local work. Do not run `git reset` or `git checkout .` as release preparation.

3. Create release branch (use current date in MM-DD format):

   ```bash
   git switch -c publish/python-release-{MM-DD} origin/main
   ```

4. Update dependencies:

   ```bash
   npx npm-check-updates -u --filter '@typespec/*,@azure-tools/*' --packageFile package.json --registry https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry/
   ```

5. Update `peerDependencies` in package.json:
   - Do not assume step 4 updated peer dependencies: in the release run it updated development dependencies but left peer lower bounds unchanged. Use the latest versions reported in step 4 for the corresponding peers.
   - If format is `">=0.a.b <1.0.0"`: Update only the `0.a.b` portion, keep the range format unchanged
   - If format is `"^1.a.b"`: Update to the latest version

6. Verify `devDependencies` versions for specs:
   - Check `@typespec/http-specs` and `@azure-tools/azure-http-specs`
   - If the original version in `package.json` is newer than the updated value, keep the original version
   - Dev versions are typically in the form `x.y.z-alpha.N-dev.M` (e.g., `0.1.0-alpha.37-dev.3`).

   Example:
   - Original: `@typespec/http-specs: 0.1.0-alpha.12-dev.5`, updated by step 4 to `0.1.0-alpha.11` → keep `0.1.0-alpha.12-dev.5`.
   - Original: `@typespec/http-specs: 0.1.0-alpha.12-dev.5`, updated by step 4 to `0.1.0-alpha.12` → keep `0.1.0-alpha.12` (step 4 works as expected).
   - Original: `@azure-tools/azure-http-specs: 0.1.0-alpha.12-dev.2`, updated to `0.1.0-alpha.11` → keep `0.1.0-alpha.12-dev.2`.
   - Original: `@azure-tools/azure-http-specs: 0.1.0-alpha.12-dev.2`, updated to `0.1.0-alpha.12` → keep `0.1.0-alpha.12` (step 4 works as expected).

7. Run version change script:

   ```bash
   npm run change:version
   ```

   Verify that the script updated both the emitter version in `package.json` and `CHANGELOG.md`. If neither file was updated:
   - Increment the third component of the emitter version in `package.json` (for example, `a.b.c` to `a.b.(c+1)`).
   - Add this entry near the top of `CHANGELOG.md`, immediately after the changelog title:

     ```markdown
     ## <new emitter version>

     ### Bump dependencies

     - Bump dependencies of `@typespec/*` and `@azure-tools/*` to latest versions
     ```

   Verify that the version in `package.json` matches the new `CHANGELOG.md` heading. Consumed Python change files under `.chronus/changes/` are expected deletions; include them in the release commit.

8. Install, build, validate, and commit:

   ```bash
   npm install --registry=https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry/ && npm run build
   npm run lint
   npm run test:emitter
   ```

   Run formatting from `{REPO}` using the `pnpm-format` skill. If `packages/prettier-plugin-typespec/dist/index.js` is missing, build the formatter first with `pnpm -r --filter '@typespec/prettier-plugin-typespec...' build`, then run `pnpm format`. Do not repeat dependency installation or build the entire monorepo for this missing-plugin error.

   Verify that `package-lock.json` and its root package entry match the manifest version, peer dependencies, and development dependencies. Review `git diff --check` and the changed-file list; stage only the release manifest, lockfile, changelog, and consumed Python change files. Commit using a conventional message such as `chore(python): bump version to <version>` and the required co-author trailer.

   Check the lockfile diff for registry changes: preserve existing CFS URLs and resolve new or updated packages through CFS, without migrating unrelated pre-existing npmjs.org entries. Changing the registry and rerunning `npm install --package-lock-only` did not repair existing npmjs.org URLs in the release run. If correcting such a lockfile, obtain the exact CFS tarball URLs from feed metadata and verify their contents against the lockfile integrity hashes before replacing URLs; do not blindly rewrite hosts or change package versions.

9. Push and create PR:

   ```bash
   cd {REPO}
   git push origin HEAD
   ```

10. Create PR with title `[python] release new version` and no description.

    Verify the created PR's title, description, base/head branches, and draft state rather than relying on the creation tool's output. The release run's PR tool inserted a placeholder despite receiving an empty body; if this happens, clear it with `gh api --method PATCH repos/microsoft/typespec/pulls/<number> -f body=''` and verify again. If the tool creates a draft, mark it ready with `gh pr ready <number>` unless the user requested a draft.

## Post-Process Review

1. After the pull request is created, review the complete release run: commands executed, command output, manual interventions, validation results, changed files, commit, push, cleanup, and PR creation.
2. Update this skill only when the completed run provides a concrete finding and a strong reason for the change, such as:
   - A documented step failed or produced an incorrect result.
   - The agent needed an undocumented manual correction to complete the release.
   - A step was ambiguous enough to create a real risk or delay.
   - A command was unnecessary or could be replaced by a demonstrably safer or more reliable command.
3. Do not change the skill based on preference, speculation, or an unobserved edge case. For every update, record the observed evidence and explain why the edit improves future releases.
4. Keep any skill update minimal, validate its formatting and frontmatter, and keep it separate from the completed release PR unless the user explicitly asks to include it there.
5. If the review finds no evidence-backed improvement, leave the skill unchanged and state that no update was warranted.
6. Return the branch name, prepared `@typespec/http-client-python` version, commit hash, pull request URL, review findings, and any skill update to the user. Creating a release PR does not mean the package has been published.
