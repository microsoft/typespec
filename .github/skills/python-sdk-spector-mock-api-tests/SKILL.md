---
name: writing-python-sdk-spector-mock-api-tests
description: Writes TypeSpec http-client-python generator mock API tests (azure/unbranded/shared) from a Spector case. Use when given a Spector case link or a PR link that modifies Spector cases under http-specs/azure-http-specs.
---

# Writing python SDK tests from a Spector case

## Inputs

You may receive either:

- **Spector case link** (preferred): link to a specific scenario/case under:
  - `https://github.com/microsoft/typespec/tree/main/packages/http-specs/specs/...`
  - `https://github.com/Azure/typespec-azure/tree/main/packages/azure-http-specs/specs/...`
- **PR link**: a GitHub PR that changes one or more Spector cases.

Spector cases define the **expected request + response**. The goal is to add/extend python tests that validate the generated SDK behaves accordingly.

## Output

A python pytest test (sync) added to one of:

- `packages/http-client-python/tests/mock_api/azure`
- `packages/http-client-python/tests/mock_api/unbranded`
- `packages/http-client-python/tests/mock_api/shared`

And a corresponding async pytest test added under the matching `asynctests/` folder:

- `packages/http-client-python/tests/mock_api/azure/asynctests`
- `packages/http-client-python/tests/mock_api/unbranded/asynctests`
- `packages/http-client-python/tests/mock_api/shared/asynctests`

## Workflow (copy as checklist)

Test-writing progress:

- [ ] Ensure prerequisites are met (pnpm install, package build)
- [ ] Identify the Spector case link (directly, or extracted from PR)
- [ ] Update spec dependency version if the case is from an unreleased PR
- [ ] Decide the destination folder(s): azure vs unbranded vs shared
- [ ] Regenerate the specific generated client (do NOT run full regeneration)
- [ ] Find existing test file to extend (or create a new one)
- [ ] Implement sync + async test(s) that match the case’s request/response expectations
- [ ] Update test requirements only if a new dependency is introduced
- [ ] Format changed python files with Black (`python -m black <paths> --config ./eng/scripts/ci/config/pyproject.toml`)
- [ ] Validate test locally (start Spector mock server + run pytest)
- [ ] Add a changelog entry under `.chronus/changes`

## Prerequisites — Environment setup

Before starting, ensure the build environment is ready:

1. **Install dependencies** (from repo root):
   ```bash
   pnpm install
   ```
2. **Build the http-client-python package** (required before any `tsp compile`):
   ```bash
   cd packages/http-client-python
   npm install
   npm run build
   ```

> ⚠️ Do NOT run `pnpm build` at the repo root — it builds the entire monorepo (including the website) and takes 7+ minutes. Only the http-client-python package build is needed.

## Step 1 — Identify the Spector case link

### If input is a Spector case link

Use it directly.

### If input is a PR link

1. List changed files.
2. From changed files, pick the ones under:
   - `packages/http-specs/specs/` (microsoft/typespec)
   - `packages/azure-http-specs/specs/` (Azure/typespec-azure)
3. Extract the specific case/scenario path(s) to target.

## Step 2 — Update spec dependency (if needed)

If the Spector case comes from a PR that hasn't been released yet, you must bump the spec dependency in `packages/http-client-python/package.json`:

- For `Azure/typespec-azure` cases: update `@azure-tools/azure-http-specs`
- For `microsoft/typespec` cases: update `@typespec/http-specs`

To find the latest dev version, check npm:

```bash
npm view @azure-tools/azure-http-specs versions --json | tail -5
npm view @typespec/http-specs versions --json | tail -5
```

Pick the newest version that includes the Spector case you need. Prefer a stable version (e.g., `0.1.0-alpha.38`) if one exists; only fall back to a `-dev.X` version (e.g., `0.1.0-alpha.38-dev.2`) when no stable version contains the change yet.

**Example 1 — a newer stable version is available:**

```jsonc
// Before
"@azure-tools/azure-http-specs": "0.1.0-alpha.37",

// After (stable 0.1.0-alpha.38 exists and includes the case)
"@azure-tools/azure-http-specs": "0.1.0-alpha.38",
```

**Example 2 — no new stable, only a dev version:**

```jsonc
// Before
"@azure-tools/azure-http-specs": "0.1.0-alpha.37",

// After (0.1.0-alpha.38 does not exist yet, use dev)
"@azure-tools/azure-http-specs": "0.1.0-alpha.38-dev.2",
```

Same pattern applies to `@typespec/http-specs`.

After bumping, run `npm run install` under `packages/http-client-python` to update the lock file.

## Step 3 — Choose where to put the test

### Rule A: Spector in Azure/typespec-azure

Write the python test in:

- `packages/http-client-python/tests/mock_api/azure`

### Rule B: Spector in microsoft/typespec

You may need either:

- **Option (a) shared only**: `.../mock_api/shared`
- **Option (b) both flavors**: `.../mock_api/azure` AND `.../mock_api/unbranded`

Decide with this concrete check:

1. Locate the generated python package/module for the scenario in BOTH:
   - `packages/http-client-python/tests/generated/azure`
   - `packages/http-client-python/tests/generated/unbranded`
2. If the import root and client/model API surface you need are the same (same module path + same client entrypoint), write ONE shared test in `mock_api/shared`.
3. If import paths differ (or one flavor lacks the needed client), write separate tests under both `mock_api/azure` and `mock_api/unbranded`.

Why: both azure and unbranded tox runs include `mock_api/shared`, so shared tests are preferred when they can import the same generated package.

## Step 4 — Regenerate the specific generated client

Generated code is gitignored (`packages/http-client-python/tests/generated/`). You must regenerate the specific spec before writing tests.

**Compile only the single spec you need** (example for azure-core-page):

```bash
cd packages/http-client-python
npx tsx ./eng/scripts/ci/regenerate.ts --flavor azure --name azure/core/page
```

The `--flavor` flag selects `azure` or `unbranded`. The `--name` flag is a case-insensitive substring match on the package name.

> ⚠️ Do NOT run `npx tsx ./eng/scripts/ci/regenerate.ts` without `--name` — it compiles ALL specs and takes 40+ minutes. Only regenerate the specific spec you need.
> ⚠️ Do NOT use `npm run regenerate -- --flavor ...` — npm may strip the flags. Use `npx tsx` directly.

**Verify** the generated client has the expected method:

```bash
grep -r "method_name" tests/generated/azure/ < package-name > /
```

## Step 5 — Find existing test file (or create one)

1. Search in the chosen folder for an existing test covering the same feature area.
   - Prefer extending an existing `test_*.py` when it already imports the same generated module.
2. In parallel, find the matching async test in `asynctests/`.

- If you extend `mock_api/azure/test_<area>.py`, also extend `mock_api/azure/asynctests/test_<area>_async.py` (or create it if missing).
- If you extend `mock_api/shared/test_<area>.py`, also extend `mock_api/shared/asynctests/test_<area>_async.py`.
- If you extend `mock_api/unbranded/test_<area>.py`, also extend `mock_api/unbranded/asynctests/test_<area>_async.py`.

3. If no sync test exists, create a new `test_<area>.py` and also create the async counterpart under `asynctests/`.

Conventions to match:

- Use `pytest`.
- Use a `client()` fixture that constructs the generated client and yields it via context manager.
- For async tests: use `async def client()` fixture + `async with ...` and mark tests with `@pytest.mark.asyncio`.
- Follow existing assertion style (direct equality for models; `list(...)` for paged results).

## Step 6 — Implement the test from the Spector expectations

1. Read the Spector case to identify:
   - operation name / route
   - HTTP method
   - parameter locations (path/query/header/body)
   - request body shape + media type
   - response status code + headers + body
2. Translate into SDK calls:
   - construct the client
   - call the method with the specified inputs
   - assert the returned value matches the expected response
   - if the scenario requires sending data, call the corresponding PUT/POST/PATCH and assert no unexpected error

Practical guidance:

- Prefer comparing with generated model instances (e.g., `models.Foo(...)`) when the SDK returns models.
- If the response is a stream or iterator, materialize it (`list(...)`) before asserting.
- Async iterator pattern (seen in existing tests): `result = [item async for item in client.list(...)]`.
- If the scenario is about serialization (e.g., XML), assert round-trip via GET/PUT (pattern: `assert client.foo.get() == model; client.foo.put(model)`).

Async client import patterns (match the folder you’re writing to):

- Azure: import `aio` submodule alongside models, e.g. `from specs.<...> import models, aio`, then `async with aio.<Client>()` and `await client.<op>(...)`.
- Shared/unbranded generated clients often expose `.aio` modules, e.g. `from <pkg>.aio import <Client>`.

## Step 7 — Dependencies (only when needed)

Default: do NOT add new dependencies.

Only if your new/extended test imports a package not already available:

- Add it to the appropriate requirements file under `packages/http-client-python/tests/requirements/`:
  - `base.txt` — shared dependencies (pytest, pytest-asyncio, etc.)
  - `azure.txt` — Azure-specific dependencies (azure-core, azure-mgmt-core)
  - `unbranded.txt` — unbranded-specific dependencies (corehttp)

Avoid adding dependencies unless strictly required by the test.

## Step 8 — Format changed files

Format any python files you changed using Black with the project's shared config:

```bash
cd packages/http-client-python
python -m black ./eng/scripts/ci/config/pyproject.toml < paths > --config
```

Replace `<paths>` with the specific files and/or folders you modified (relative to the `http-client-python` root).

Alternatively, you can format all test files via the npm script:

```bash
npm run format -- --generator
```

## Step 9 — Validate your test locally

Before opening a PR, run your new or updated test. You will need two terminals: one to run the Spector mock API server, and another to run pytest.

1. **Determine the test flavor.** Pick the flavor that matches the test you changed:
   - Azure tests → `azure`
   - Unbranded tests → `unbranded`

2. **Regenerate and install packages** (if not already done):

   ```bash
   cd packages/http-client-python
   npx tsx ./eng/scripts/ci/regenerate.ts --flavor <azure|unbranded> --name <spec-name>
   ```

3. **Create and activate a virtual environment** (if one does not already exist):

   ```bash
   cd packages/http-client-python/tests
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/Mac:
   source .venv/bin/activate
   ```

4. **Install dependencies and the generated SDK:**

   ```bash
   pip install -r requirements/base.txt
   pip install -r requirements/<azure|unbranded>.txt

   # install only a single generated SDK:
   pip install --no-deps -e generated/<flavor>/<sdk-folder-name>
   ```

5. **Start the Spector mock API server** in a separate terminal:

   ```bash
   cd packages/http-client-python
   npx tsp-spector serve node_modules/@azure-tools/azure-http-specs/specs/ node_modules/@typespec/http-specs/specs/
   ```

   Wait until you see the server listening message before running tests.

6. **Run the test** in the original terminal (with venv activated):

   ```bash
   cd packages/http-client-python/tests
   pytest mock_api/ < azure | unbranded | shared > / < test_file > .py -v
   ```

   Verify that all tests pass before proceeding.

   > **Important:** If you only added or changed test files, confirming the changed test passes is sufficient. However, if you modified emitter source code (under `generator/` or `emitter/`), you **must** run the full test suite for the affected flavor(s) to catch regressions before proceeding.

## Step 10 — Add a changelog entry

Create a changelog file under `.chronus/changes/` to document the change. The file should be a Markdown file with YAML frontmatter specifying the change kind and affected package(s).

**File naming convention:** `<short-description>-<YYYY>-<M>-<DD>-<H>-<m>-<s>.md`

**Template:**

```markdown
---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

<Brief description of what was added or changed.>
```

**Available `changeKind` values:**

| Kind           | When to use                                      |
| -------------- | ------------------------------------------------ |
| `internal`     | Internal changes not user-facing (most test PRs) |
| `fix`          | Bug fixes to existing features                   |
| `feature`      | New user-facing features                         |
| `deprecation`  | Deprecating an existing feature                  |
| `breaking`     | Breaking changes                                 |
| `dependencies` | Dependency bumps                                 |

For test additions, use `changeKind: internal` and list `@typespec/http-client-python` as the package.

## Notes

- Keep the skill concise: prefer adding a single focused test per scenario.
- Don’t duplicate existing coverage: extend an existing file when reasonable.
- Use forward-slash paths only.
- Generated code is gitignored — do NOT attempt to commit it. Only commit: test files, and `package.json`/`package-lock.json` (if dependency versions were updated).
- You should still validate your test locally (Step 9) before pushing. CI runs the full regeneration and the complete test matrix, but catching failures early locally is faster.
- Do NOT run `npm run regenerate` without `--name` for verification — CI will handle full regeneration.
