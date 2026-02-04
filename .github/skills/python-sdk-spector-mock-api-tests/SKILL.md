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

- [ ] Identify the Spector case link (directly, or extracted from PR)
- [ ] Decide the destination folder(s): azure vs unbranded vs generic
- [ ] Find existing test file to extend (or create a new one)
- [ ] Implement sync + async test(s) that match the case’s request/response expectations
- [ ] Update test requirements only if a new dependency is introduced
- [ ] Run the smallest relevant test command(s) and fix failures

## Step 1 — Identify the Spector case link

### If input is a Spector case link

Use it directly.

### If input is a PR link

1. List changed files.
2. From changed files, pick the ones under:
   - `packages/http-specs/specs/` (microsoft/typespec)
   - `packages/azure-http-specs/specs/` (Azure/typespec-azure)
3. Extract the specific case/scenario path(s) to target.

## Step 2 — Choose where to put the test

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

## Step 3 — Find existing test file (or create one)

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

## Step 4 — Implement the test from the Spector expectations

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

## Step 5 — Dependencies (only when needed)

Default: do NOT add new dependencies.

Only if your new/extended test imports a package not already available:

- Add it to the appropriate requirements file:
  - `packages/http-client-python/generator/test/azure/requirements.txt`
  - `packages/http-client-python/generator/test/unbranded/requirements.txt`

Avoid adding dependencies unless strictly required by the test.

## Step 6 — Run and fix (tight feedback loop)

Run the smallest relevant test(s):

- Azure flavor (from `packages/http-client-python/generator/test/azure`):
  - `tox -e test -- mock_api_tests/test_<file>.py`
  - `tox -e test -- mock_api_tests/asynctests/test_<file>_async.py`
- Unbranded flavor (from `packages/http-client-python/generator/test/unbranded`):
  - `tox -e test -- mock_api_tests/test_<file>.py`
  - `tox -e test -- mock_api_tests/asynctests/test_<file>_async.py`
- Generic-only tests (from either azure or unbranded test folder):
  - `tox -e test -- ../generic_mock_api_tests/test_<file>.py`
  - `tox -e test -- ../generic_mock_api_tests/asynctests/test_<file>_async.py`

If failures occur:

1. Fix imports/module path first.
2. Fix request shaping (headers/query/body) to match the case.
3. Fix response assertions (status/body/model shapes).
4. Re-run the same focused command until it passes.

## Notes

- Keep the skill concise: prefer adding a single focused test per scenario.
- Don’t duplicate existing coverage: extend an existing file when reasonable.
- Use forward-slash paths only.
