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
npx npm-check-updates --version
```

If the command fails or prompts for installation, install it globally:

```bash
npm install -g npm-check-updates
```

## Workflow

1. Navigate to the package directory:

   ```bash
   cd {REPO}/packages/http-client-python
   ```

2. Reset and sync with main:

   ```bash
   git reset HEAD && git checkout . && git checkout origin/main && git pull origin main
   ```

3. Create release branch (use current date in MM-DD format):

   ```bash
   git checkout -b publish/python-release-{MM-DD}
   ```

4. Update dependencies:

   ```bash
   npx npm-check-updates -u --filter @typespec/*,@azure-tools/* --packageFile package.json
   ```

5. Update `peerDependencies` in package.json:
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

   Verify that the script updated both the emitter version in `package.json` and `CHANGELOG.md`. If either file was not updated:
   - Increment the third component of the emitter version in `package.json` (for example, `a.b.c` to `a.b.(c+1)`).
   - Add this entry near the top of `CHANGELOG.md`, immediately after the changelog title:

     ```markdown
     ## <new emitter version>

     ### Bump dependencies

     - Bump dependencies of `@typespec/*` and `@azure-tools/*` to latest versions
     ```
    - Verify that the version in `package.json` matches the new `CHANGELOG.md` heading.

8. Build and commit:

   ```bash
   npm install && npm run build && git add -u && git commit -m "bump version"
   ```

9. Push and create PR:

   ```bash
   cd {REPO}
   git push origin HEAD
   ```

10. Create PR with title `[python] release new version` and no description.

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
6. Return the branch name, released package version, `@typespec/http-client-python` version, commit hash, pull request URL, review findings, and any skill update to the user.
