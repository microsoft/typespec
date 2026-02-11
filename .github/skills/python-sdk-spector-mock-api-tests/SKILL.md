---
name: writing-python-sdk-spector-mock-api-tests
description: Writes TypeSpec http-client-python generator mock API tests (azure/unbranded/generic) from a Spector case. Use when given a Spector case link or a PR link that modifies Spector cases under http-specs/azure-http-specs.
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

- `packages/http-client-python/generator/test/azure/mock_api_tests`
- `packages/http-client-python/generator/test/unbranded/mock_api_tests`
- `packages/http-client-python/generator/test/generic_mock_api_tests`

And a corresponding async pytest test added under the matching `asynctests/` folder:

- `packages/http-client-python/generator/test/azure/mock_api_tests/asynctests`
- `packages/http-client-python/generator/test/unbranded/mock_api_tests/asynctests`
- `packages/http-client-python/generator/test/generic_mock_api_tests/asynctests`

## Workflow (copy as checklist)

Test-writing progress:

- [ ] Ensure prerequisites are met (pnpm install, package build)
- [ ] Identify the Spector case link (directly, or extracted from PR)
- [ ] Update spec dependency version if the case is from an unreleased PR
- [ ] Decide the destination folder(s): azure vs unbranded vs generic
- [ ] Regenerate the specific generated client (do NOT run full regeneration)
- [ ] Find existing test file to extend (or create a new one)
- [ ] Implement sync + async test(s) that match the case’s request/response expectations
- [ ] Update test requirements only if a new dependency is introduced
- [ ] Format changed python files with Black (`python -m black <paths> -l 120`)
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

After bumping, run `npm run install` under `packages/http-client-python` to update the lock file.

## Step 3 — Choose where to put the test

### Rule A: Spector in Azure/typespec-azure

Write the python test in:

- `packages/http-client-python/generator/test/azure/mock_api_tests`

### Rule B: Spector in microsoft/typespec

You may need either:

- **Option (a) generic only**: `.../generic_mock_api_tests`
- **Option (b) both flavors**: `.../azure/mock_api_tests` AND `.../unbranded/mock_api_tests`

Decide with this concrete check:

1. Locate the generated python package/module for the scenario in BOTH:
   - `packages/http-client-python/generator/test/azure/generated`
   - `packages/http-client-python/generator/test/unbranded/generated`
2. If the import root and client/model API surface you need are the same (same module path + same client entrypoint), write ONE shared test in `generic_mock_api_tests`.
3. If import paths differ (or one flavor lacks the needed client), write separate tests under both `azure/mock_api_tests` and `unbranded/mock_api_tests`.

Why: both azure and unbranded tox runs include `../generic_mock_api_tests`, so shared tests are preferred when they can import the same generated package.

## Step 4 — Regenerate the specific generated client

Generated code is gitignored (`packages/http-client-python/generator/test/**/generated/`). You must regenerate the specific spec before writing tests.

**Compile only the single spec you need** (example for azure-core-page):

```bash
cd packages/http-client-python
npm run regenerate -- --name=azure/core/page
```

> ⚠️ Do NOT run `npm run regenerate` — it compiles ALL specs and takes 40+ minutes. Only regenerate the specific spec you need.

**Verify** the generated client has the expected method:

```bash
grep -r "method_name" generator/test/azure/generated/ < name > /
```

## Step 5 — Find existing test file (or create one)

1. Search in the chosen folder for an existing test covering the same feature area.
   - Prefer extending an existing `test_*.py` when it already imports the same generated module.
2. In parallel, find the matching async test in `asynctests/`.

- If you extend `mock_api_tests/test_<area>.py`, also extend `mock_api_tests/asynctests/test_<area>_async.py` (or create it if missing).
- If you extend `generic_mock_api_tests/test_<area>.py`, also extend `generic_mock_api_tests/asynctests/test_<area>_async.py`.

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
- Generic/unbranded generated clients often expose `.aio` modules, e.g. `from <pkg>.aio import <Client>`.

## Step 7 — Dependencies (only when needed)

Default: do NOT add new dependencies.

Only if your new/extended test imports a package not already available:

- Add it to the appropriate requirements file:
  - `packages/http-client-python/generator/test/azure/requirements.txt`
  - `packages/http-client-python/generator/test/unbranded/requirements.txt`

Avoid adding dependencies unless strictly required by the test.

## Step 8 — Format changed files

Install Black if not already available, then format any python files you changed with a 120 character line length:

```bash
pip install black # if not already installed
python -m black < paths > -l 120
```

Replace `<paths>` with the specific files and/or folders you modified.

## Step 9 — Validate your test locally

Before opening a PR, run your new or updated test inside a virtual environment.

1. **Determine the test root.** Pick the directory that matches the test you changed:
   - Azure tests → `packages/http-client-python/generator/test/azure`
   - Unbranded tests → `packages/http-client-python/generator/test/unbranded`

2. **Create and activate a virtual environment** (if one does not already exist):

   ```bash
   cd packages/http-client-python/generator/test/<azure|unbranded>
   python -m venv .venv
   source .venv/bin/activate
   ```

3. **Install only the dependencies you need.**
   Installing the full `requirements.txt` is slow because it includes every generated SDK. Instead, extract and install only the non-editable dependencies, then install the specific SDK(s) you need:

   ```bash
   # Install dependencies from requirements.txt, excluding generated SDKs:
   grep -v '^-e ./generated/' requirements.txt > _requirements.txt
   pip install -r _requirements.txt
   rm _requirements.txt

   # Install the specific generated SDK(s) your test imports:
   pip install -e ./generated/<sdk-folder-name>
   ```

   Replace `<sdk-folder-name>` with the folder that matches the SDK under test (e.g., `azure-encode-duration`, `encode-duration`).

4. **Run the test:**

   ```bash
   pytest mock_api_tests/ -v < test_file > .py
   ```

   Replace `<test_file>` with the file you added or modified. Verify that all tests pass before proceeding.

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
- Do NOT run `npm run regenerate` for verification — CI will handle full regeneration and test execution.
