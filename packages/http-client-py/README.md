# @typespec/http-client-py

TypeSpec emitter for Python HTTP client libraries, built on `@alloy-js/python` and
`@typespec/emitter-framework`.

> Status: **experimental**. This package is a Phase-1 scaffold. It generates the
> Python package layout, models, enums, type aliases, and a body-less client class.
> HTTP request/response bodies, serialization, authentication, paging, and long-running
> operations are intentionally deferred to follow-up work.
>
> If you need a feature-complete Python emitter today, use
> [`@typespec/http-client-python`](../http-client-python/README.md). This package is a
> from-scratch rewrite using the modern alloy + emitter-framework authoring model.

## Install

```bash
npm install @typespec/http-client-py
```

## Emitter usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/http-client-py
```

2. Via the config

```yaml
emit:
  - "@typespec/http-client-py"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/http-client-py"
options:
  "@typespec/http-client-py":
    package-name: "my-service"
    package-version: "1.0.0"
    flavor: unbranded
    generate-sync: true
    generate-async: true
    post-process: pyodide
```

## Emitter options

### `package-name`

**Type:** `string` (default: `"test-package"`)

Name of the generated Python distribution as it will appear in `pyproject.toml`.

### `package-version`

**Type:** `string` (default: `"1.0.0"`)

Version of the generated Python distribution.

### `flavor`

**Type:** `"unbranded" | "azure"` (default: `"unbranded"`)

Selects the underlying runtime. `unbranded` targets `corehttp`; `azure` targets
`azure.core`. The `azure` flavor is reserved for future ARM/azure-core specific
behavior and currently behaves the same as `unbranded`.

### `generate-sync`

**Type:** `boolean` (default: `true`)

Whether to emit synchronous client modules.

### `generate-async`

**Type:** `boolean` (default: `true`)

Whether to emit asynchronous client modules (under `aio/`).

### `post-process`

**Type:** `"pyodide" | "none"` (default: `"pyodide"`)

Post-processing pass that runs over the emitted Python output:

- `"pyodide"` (default) — load Pyodide and run `black` over every emitted
  `.py` file, plus inject `# pylint: disable=line-too-long,too-many-lines`
  headers into files that exceed pylint's defaults. This matches the
  behavior of `@typespec/http-client-python` and produces idiomatically
  formatted, shippable output. Pays a one-time cost to bootstrap a Python
  VM in WASM (~25MB download, several seconds of startup) but only when
  compiling to disk; in-memory test harnesses short-circuit it.
- `"none"` — write the alloy-rendered output as-is. The output is still
  valid Python, but won't be `black`-formatted. Useful for fast incremental
  development when you don't care about formatting.

You can also run the post-processor independently after emitting:

```bash
npx tsp-py-postprocess ./generated
```

## Long-running operations (LROs)

LRO support is **early and heuristic-based**. The unbranded TypeSpec stack
(`@typespec/compiler`, `@typespec/http`, `@typespec/http-client`) does not
model LROs today — LRO metadata lives in `Azure.Core` (`@useFinalStateVia`,
`@pollingOperation`, `@lroStatus`, `@finalLocation`) and is consumed by
emitters via TCGC's `SdkLroServiceMethod`. Until an unbranded LRO contract
lands upstream, this emitter detects LROs by inspecting HTTP responses
directly:

- **Trigger:** an operation has a `202 Accepted` response that includes one
  of the `Operation-Location`, `Location`, or `Azure-AsyncOperation` headers.
- **Output shape (mirrors `pygen.codegen.models.lro_operation`):**
  - Public method is renamed with a `begin_` prefix (e.g. `createWidget`
    becomes `begin_create_widget`) unless its name already starts with
    `begin`.
  - A private companion `_X_initial` method is emitted; it currently raises
    `NotImplementedError` and will be filled in when basic operation bodies
    land.
  - The public method's return type is wrapped in `LROPoller[T]`, where `T`
    is the operation's success-response model.
  - The public method body calls `self._X_initial(...)` and wraps the result
    in `corehttp.polling.LROPoller(...)` with a default `LROBasePolling()`
    strategy.

Example:

```python
from corehttp.polling import LROBasePolling, LROPoller

class WidgetServiceClient:
    def _create_widget_initial(self, widget: Widget) -> object:
        raise NotImplementedError(...)

    def begin_create_widget(self, widget: Widget) -> LROPoller[Widget]:
        raw_result = self._create_widget_initial(widget)
        return LROPoller(
            client=self,
            initial_response=raw_result,
            deserialization_callback=lambda pipeline_response: pipeline_response,
            polling_method=LROBasePolling(),
        )
```

**Deliberately deferred** (Phase 2B and beyond):

- Polling strategy selection beyond the default `LROBasePolling`.
- `finalStateVia` semantics (`azure-async-operation` vs. `location` vs.
  `original-uri`).
- The actual HTTP send + initial-response deserialization in `_X_initial`.
- Async variant (`AsyncLROPoller`).
- `cls` callback parameter.
- Docstrings with `:return:` / `:rtype:` per pygen conventions.

The heuristic detection is intended to be replaced once `@typespec/http-client`
exposes a first-class LRO contract; the renderer (`src/components/operations/lro-operation.tsx`)
is decoupled from the detection layer (`src/lro/detect.ts`) for exactly that
reason.
