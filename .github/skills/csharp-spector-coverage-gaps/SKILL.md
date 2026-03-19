---
name: csharp-spector-coverage-gaps
description: Discovers and implements gaps in Spector test coverage for the C# HTTP client emitter. Use when asked to find missing Spector scenarios, add Spector test coverage, or implement a specific Spector spec for the C# emitter.
---

# Discovering and implementing Spector coverage gaps for http-client-csharp

## Overview

This skill discovers which Spector scenarios the C# emitter (`@typespec/http-client-csharp`) does **not** yet cover, then implements the missing test(s). Spector scenarios are defined in `@typespec/http-specs` and `@azure-tools/azure-http-specs`. The coverage dashboard is at <https://typespec.io/can-i-use/http/>.

> **Note:** `{PKG}` refers to `<repo-root>/packages/http-client-csharp` throughout this document.

## Inputs

You may receive one of:

- **"Find coverage gaps"** — discover all missing scenarios and present them.
- **Spector spec link** — a link to a specific spec under `packages/http-specs/specs/...` or `packages/azure-http-specs/specs/...`.
- **Spec name** — e.g., `http/encode/duration`, `http/type/model/flatten`, `http/type/union/discriminated`.

## Output

- A report of coverage gaps (when discovering).
- New or updated C# NUnit test file(s) under `{PKG}/generator/TestProjects/Spector.Tests/Http/`.
- Updated `{PKG}/generator/TestProjects/Spector.Tests/TestProjects.Spector.Tests.csproj` if a new project reference is needed.
- Regenerated client code (via `Generate.ps1`).

## Workflow

- [ ] Ensure prerequisites are met (npm ci, npm run build)
- [ ] Discover coverage gaps or identify the target spec
- [ ] Verify the spec is not in the failing specs list
- [ ] Generate the C# client for the target spec (unstubbed with `-Stubbed $false`, or use Test-Spector.ps1)
- [ ] Read the generated client to understand the API surface
- [ ] Read the TypeSpec scenario file to understand expected behavior
- [ ] Find or create the test file
- [ ] Implement the test(s) following existing conventions
- [ ] Run the tests using `Test-Spector.ps1 -filter "<spec-path>"`
- [ ] Validate all tests pass

---

## Prerequisites — Environment setup

Before starting, ensure the build environment is ready. These instructions **supersede** the repo-root `pnpm` instructions.

1. **Install dependencies** (from `{PKG}`):
   ```powershell
   cd {PKG}
   npm ci
   ```
2. **Build the package**:
   ```powershell
   npm run build
   ```

> ⚠️ Do NOT run `pnpm install` or `pnpm build` at the repo root — only the http-client-csharp package build is needed.

---

## Step 1 — Discover coverage gaps

### How specs are filtered

The file `{PKG}/eng/scripts/Spector-Helper.psm1` defines which specs are included/excluded:

**Failing specs** are defined in `{PKG}/eng/scripts/Spector-Helper.psm1` in the `$failingSpecs` array. Always check that file for the current list — do not hardcode specs here.

**Azure allow-list** (only these Azure specs are tested):

- `http/client/structure/client-operation-group`
- `http/client/structure/default`
- `http/client/structure/multi-client`
- `http/client/structure/renamed-operation`
- `http/client/structure/two-operation-group`
- `http/resiliency/srv-driven`

All other specs from `@typespec/http-specs` are included by default.

### Discovering gaps programmatically

Compare available specs against existing tests. Run this from `{PKG}`:

```powershell
Import-Module "{PKG}/eng/scripts/Spector-Helper.psm1" -DisableNameChecking -Force

# Get all valid specs
$specs = Get-Sorted-Specs | ForEach-Object { Get-SubPath $_ }

# Get all test files
$testFiles = Get-ChildItem -Path "{PKG}/generator/TestProjects/Spector.Tests/Http" -Recurse -Filter "*Tests.cs" |
    ForEach-Object { $_.FullName }

# For each spec, check if a corresponding test directory/file exists
foreach ($spec in $specs) {
    $specParts = $spec -replace '/', '\' -split '\\'
    # Convert to expected test path segments
    $testPath = "{PKG}/generator/TestProjects/Spector.Tests/Http"
    # ... check if test exists
}
```

Alternatively, **manually compare** the list of specs against existing test files:

**Existing test coverage** (test directories under `Spector.Tests/Http/`):

```
Authentication/ApiKey, Authentication/Http/Custom, Authentication/OAuth2, Authentication/Union
Client/Naming, Client/Structure/{ClientOperationGroup,Default,MultiClient,RenamedOperation,TwoOperationGroup}
Documentation
Encode/{Array,Bytes,DateTime,Numeric}
Parameters/{Basic,BodyOptionality,CollectionFormat,Path,Query,Spread}
Payload/{ContentNegotiation,JsonMergePatch,MediaType,Multipart,Pageable,Xml}
Resiliency/SrvDriven/{V1,V2}
Response/StatusCodeRange
Routes
Serialization/EncodedName/Json
Server/{Endpoint/NotDefined,Path/Multiple,Path/Single,Versions/NotVersioned,Versions/Versioned}
SpecialHeaders/{ConditionalRequest,Repeatability}
Versioning/{Added,MadeOptional,Removed,RenamedFrom,ReturnTypeChangedFrom,TypeChangedFrom}
_Type/{Dictionary,Model/Empty,Model/Inheritance/*,Model/Usage,Model/Visibility,Property/*,Scalar,Union,_Array,_Enum/*}
```

### Accurate gap detection

The naive approach of matching spec paths to test directory names can produce false positives because:

- C# reserved words get underscore-prefixed in test dirs (e.g., `type/` → `_Type/`, `array` → `_Array`, `enum` → `_Enum`)
- kebab-case gets converted to PascalCase (e.g., `content-negotiation` → `ContentNegotiation`)
- Some test files cover a parent spec but not sub-specs (e.g., `UnionTests.cs` covers `type/union` but NOT `type/union/discriminated`)

**To find real gaps**, verify each candidate by checking whether a test _directory_ exists for the spec's exact path, including sub-paths. A test file at a parent level does NOT cover child specs.

**Known failing specs** are tracked in `$failingSpecs` in `{PKG}/eng/scripts/Spector-Helper.psm1`. Always read that file for the current list.

> **Important:** The gap list evolves over time. Always re-run the comparison to get current gaps. All committed Spector libraries are stubbed — `[SpectorTest]` will auto-skip tests unless you regenerate with `-Stubbed $false` or use `Test-Spector.ps1`.

### Understanding stubbed vs unstubbed generation

All Spector libraries **committed to the repository are stubbed**. `Generate.ps1` defaults to `$Stubbed = $true`, which passes `--option @typespec/http-client-csharp.generator-name=StubLibraryGenerator` to the emitter. Stubbed clients use expression-bodied constructors (`=>`) instead of block bodies (`{ }`), and the `[SpectorTest]` attribute automatically skips tests for stubbed clients.

To generate **unstubbed** code (for local testing), pass `-Stubbed $false`:

```powershell
pwsh eng/scripts/Generate.ps1 -filter "<spec-path>" -Stubbed $false
```

However, the recommended way to test is via `Test-Spector.ps1` (see Step 7), which handles the unstubbed regeneration, test execution, and directory restoration automatically.

---

## Step 2 — Read the spec to understand expected behavior

Spec files live in `{PKG}/node_modules/@typespec/http-specs/specs/` (or `@azure-tools/azure-http-specs/specs/` for Azure specs).

If node_modules is not installed, read from the source at `<repo-root>/packages/http-specs/specs/`.

Each spec contains:

- **`main.tsp`** — the TypeSpec definition with `@scenario` and `@scenarioDoc` decorators
- **`client.tsp`** (optional) — client-level customizations; takes priority over `main.tsp` during generation
- **`tspconfig.yaml`** (optional in the Spector test project) — C#-specific generation options

Read the `@scenarioDoc` decorators to understand:

- The HTTP method, path, and expected parameters
- The expected request body shape
- The expected response status code and body
- Any special behavior (e.g., "should return 204", "should send header X")

---

## Step 3 — Generate the C# client for the target spec

Use `Generate.ps1` with a filter to generate only the specific spec. By default, `Generate.ps1` generates **stubbed** code (same as what is committed to the repo). To generate **unstubbed** code for local testing, pass `-Stubbed $false`:

```powershell
cd {PKG}
# Generate unstubbed (for local testing/development)
pwsh eng/scripts/Generate.ps1 -filter "<spec-path>" -Stubbed $false

# Generate stubbed (default, matches what is committed to repo)
pwsh eng/scripts/Generate.ps1 -filter "<spec-path>"
```

Examples:

```powershell
# Single spec (unstubbed for testing)
pwsh eng/scripts/Generate.ps1 -filter "http/encode/duration" -Stubbed $false

# Versioning spec (generates v1 + v2 automatically)
pwsh eng/scripts/Generate.ps1 -filter "http/versioning/added" -Stubbed $false
```

The generated code lands in `{PKG}/generator/TestProjects/Spector/<spec-path>/src/Generated/`.

### Verify generation succeeded

```powershell
# Check that client code was generated
Get-ChildItem "{PKG}/generator/TestProjects/Spector/<spec-path>/src/Generated/" -Filter "*Client.cs"
```

> **Note:** All committed Spector libraries are stubbed. The `[SpectorTest]` attribute automatically skips tests for stubbed clients. Use `Test-Spector.ps1` (Step 7) to regenerate unstubbed, run tests, and restore automatically.

---

## Step 4 — Read the generated client API surface

Browse the generated code to understand:

1. **Client class(es)**: `*Client.cs` — the entry point(s)
2. **Sub-clients**: accessed via `Get*Client()` methods
3. **Operations**: async methods like `GetAsync()`, `PutAsync(body)`, `SendAsync()`
4. **Models**: under `Models/` — request/response shapes
5. **Constructor signature**: `new XClient(Uri endpoint, XClientOptions options)` or `new XClient(Uri endpoint, KeyCredential credential, XClientOptions options)`

Pay attention to:

- Method names (they map to TypeSpec operation names)
- Parameter types (models, primitives, BinaryData)
- Return types (`ClientResult`, `ClientResult<T>`, `AsyncPageable<T>`)

---

## Step 5 — Create or extend the test file

### Directory and namespace conventions

The test directory structure mirrors the spec path with these transformations:

- `http/` → `Http/`
- kebab-case → PascalCase (e.g., `content-negotiation` → `ContentNegotiation`)
- `type/` → `_Type/` (leading underscore because `Type` is a C# keyword)
- `array` → `_Array` (same reason)
- `enum` → `_Enum` (same reason)

**Namespace pattern**: `TestProjects.Spector.Tests.Http.<PascalCasePath>`

Example mappings:
| Spec path | Test directory | Namespace |
|-----------|---------------|-----------|
| `http/encode/duration` | `Http/Encode/Duration/` | `TestProjects.Spector.Tests.Http.Encode.Duration` |
| `http/type/union/discriminated` | `Http/_Type/Union/Discriminated/` | `TestProjects.Spector.Tests.Http._Type.Union.Discriminated` |
| `http/special-words` | `Http/SpecialWords/` | `TestProjects.Spector.Tests.Http.SpecialWords` |

### Test file template

```csharp
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using <GeneratedNamespace>;
using NUnit.Framework;

namespace TestProjects.Spector.Tests.Http.<Category>.<SubCategory>
{
    public class <Name>Tests : SpectorTestBase
    {
        [SpectorTest]
        public Task <ScenarioName>() => Test(async (host) =>
        {
            var response = await new <Client>(host, null).<Method>Async(<args>);
            Assert.AreEqual(<expectedStatusCode>, response.GetRawResponse().Status);
        });
    }
}
```

### Common test patterns

**Simple void operation (204 response):**

```csharp
[SpectorTest]
public Task SimpleOp() => Test(async (host) =>
{
    var response = await new MyClient(host, null).DoThingAsync();
    Assert.AreEqual(204, response.GetRawResponse().Status);
});
```

**GET with typed response:**

```csharp
[SpectorTest]
public Task GetValue() => Test(async (host) =>
{
    var response = await new MyClient(host, null).GetValueAsync();
    Assert.AreEqual("expected", response.Value);
});
```

**GET with model response:**

```csharp
[SpectorTest]
public Task GetModel() => Test(async (host) =>
{
    var response = await new MyClient(host, null).GetModelAsync();
    Assert.AreEqual("name", response.Value.Name);
    Assert.AreEqual(42, response.Value.Age);
});
```

**PUT/POST with body:**

```csharp
[SpectorTest]
public Task SendModel() => Test(async (host) =>
{
    var body = new MyModel("name", 42);
    var response = await new MyClient(host, null).SendAsync(body);
    Assert.AreEqual(204, response.GetRawResponse().Status);
});
```

**Round-trip (GET then PUT):**

```csharp
[SpectorTest]
public Task RoundTrip() => Test(async (host) =>
{
    var client = new MyClient(host, null);
    var getResult = await client.GetAsync();
    var response = await client.PutAsync(getResult.Value);
    Assert.AreEqual(204, response.GetRawResponse().Status);
});
```

**Error assertion:**

```csharp
[SpectorTest]
public Task InvalidKey() => Test((host) =>
{
    var exception = Assert.ThrowsAsync<ClientResultException>(
        () => new MyClient(host, new ApiKeyCredential("invalid"), null).CallAsync());
    Assert.AreEqual(403, exception!.Status);
    return Task.CompletedTask;
});
```

**Sub-client access:**

```csharp
[SpectorTest]
public Task SubClientOp() => Test(async (host) =>
{
    var response = await new MyClient(host, null)
        .GetSubClient()
        .DoThingAsync();
    Assert.AreEqual(204, response.GetRawResponse().Status);
});
```

**Pagination:**

```csharp
[SpectorTest]
public Task ListItems() => Test(async (host) =>
{
    var items = new MyClient(host, null).GetItemsAsync();
    int count = 0;
    await foreach (var item in items)
    {
        count++;
    }
    Assert.Greater(count, 0);
});
```

### Additional imports commonly needed

```csharp
using System;
using System.ClientModel;           // ClientResult, ClientResultException, ApiKeyCredential
using System.IO;                     // For file/stream scenarios
using NUnit.Framework;               // Test framework
```

---

## Step 6 — Update the .csproj if needed

If a new Spector test project directory was created (new spec), a project reference may be needed in `TestProjects.Spector.Tests.csproj`:

```xml
<ProjectReference Include="..\Spector\http\<spec-path>\src\<ProjectName>.csproj" />
```

Check existing references to match the pattern. The project name typically matches the `package-name` from `tspconfig.yaml` or is derived from the namespace.

> Only add a project reference if one doesn't already exist for the spec.

---

## Step 7 — Build and run the tests

### Recommended: Use Test-Spector.ps1

The `Test-Spector.ps1` script is the recommended way to test Spector specs. It automatically:

1. Regenerates the spec as **unstubbed** (so tests are not auto-skipped)
2. Runs the tests for that spec
3. Restores the directory to its original stubbed state

```powershell
cd {PKG}
# Test a specific spec
pwsh eng/scripts/Test-Spector.ps1 -filter "<spec-path>"
```

Example:

```powershell
pwsh eng/scripts/Test-Spector.ps1 -filter "http/encode/duration"
```

### Run full Spector test suite

```powershell
pwsh eng/scripts/Get-Spector-Coverage.ps1
```

### Manual approach (if needed)

If you need more control, you can manually generate unstubbed, build, and run tests:

```powershell
cd {PKG}

# Generate unstubbed
pwsh eng/scripts/Generate.ps1 -filter "<spec-path>" -Stubbed $false

# Build
dotnet build generator

# Run only your new tests
dotnet test generator/TestProjects/Spector.Tests/TestProjects.Spector.Tests.csproj `
    --filter "FullyQualifiedName~TestProjects.Spector.Tests.Http.<YourNamespace>"

# Restore the directory to stubbed state when done
git clean -xfd generator/TestProjects/Spector/<spec-path>
git restore generator/TestProjects/Spector/<spec-path>
```

---

## Step 8 — Handle special cases

### Versioning specs

Versioning specs generate **two clients** (v1 and v2). Tests go in separate subdirectories:

```
Http/Versioning/<Name>/V1/<Name>V1Tests.cs
Http/Versioning/<Name>/V2/<Name>V2Tests.cs
```

Generation is handled automatically by `Generate.ps1` when the path contains `versioning`.

### Srv-driven (resiliency) specs

Similar to versioning — generates v1 and v2 clients from `old.tsp` and `main.tsp`.

### Specs with tspconfig.yaml

Some specs have a `tspconfig.yaml` in the Spector test project that overrides the `package-name`. Check `{PKG}/generator/TestProjects/Spector/<spec-path>/tspconfig.yaml` before importing the generated namespace.

---

## Notes

- **Do not modify `Spector-Helper.psm1`** to remove items from the failing list unless you're sure the generator now supports them.
- **All committed Spector libraries are stubbed** — `Generate.ps1` defaults to `$Stubbed = $true`. Use `Test-Spector.ps1` to temporarily regenerate unstubbed and run tests.
- **Tests auto-skip** when the generated client is stubbed — it's safe to write tests for stubbed specs. They'll activate when `Test-Spector.ps1` regenerates them unstubbed.
- Only commit: test files (`.cs`), `.csproj` changes, and `tspconfig.yaml` if needed.
- Follow existing test naming conventions: `<Feature>Tests.cs` in the matching directory.
- Use `[SpectorTest]` attribute (not `[Test]`) for all Spector tests — it enables auto-skip for stubbed implementations.
- All test classes must inherit from `SpectorTestBase`.
- Do not add change logs — the http-client-csharp instructions say they are not needed.
- Do not comment out or delete existing tests.
