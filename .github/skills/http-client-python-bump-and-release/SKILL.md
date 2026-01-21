---
name: http-client-python-bump-and-release
description: Create a PR to bump dependencies or release a new version of the http-client-python package. Use when the user wants to bump TypeSpec/Azure-tools dependencies, update peer dependencies, or release a new version of the Python HTTP client.
---

# HTTP Client Python Bump and Release

Create a new PR to bump dependencies and release a new version of the http-client-python package.

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

6. Run version change script:

   ```bash
   npm run change:version
   ```

7. Build and commit:

   ```bash
   npm install && npm run build && git add -u && git commit -m "bump version"
   ```

8. Push and create PR:

   ```bash
   cd {REPO}
   git push origin HEAD
   ```

9. Create PR with title `[python] release new version` and no description.
