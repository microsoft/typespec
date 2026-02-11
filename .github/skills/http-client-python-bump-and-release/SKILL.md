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
   - Original: `@typespec/http-specs: 0.1.0-alpha.12-dev.5`, updated by step 4 to `0.1.0-alpha.12` → keep `0.1.0-alpha.12-dev.5`.
   - Original: `@azure-tools/azure-http-specs: 0.1.0-alpha.12-dev.2`, updated to `0.1.0-alpha.12` → keep `0.1.0-alpha.12-dev.2`.

7. Run version change script:

   ```bash
   npm run change:version
   ```

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
