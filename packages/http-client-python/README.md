# @typespec/http-client-python

TypeSpec emitter for Python SDKs

## Install

```bash
npm install @typespec/http-client-python
```

## Emitter usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/http-client-python
```

2. Via the config

```yaml
emit:
  - "@typespec/http-client-python"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/http-client-python"
options:
  "@typespec/http-client-python":
    option: value
```

## Emitter options

### `emitter-output-dir`

**Type:** `absolutePath`

Defines the emitter output directory. Defaults to `{output-dir}/@typespec/http-client-python`
See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)

### `api-version`

**Type:** `undefined`

Use this flag if you would like to generate the sdk only for a specific version. Default value is the latest version. Also accepts values `latest` and `all`. For multi-service packages, provide a map from each service namespace's full name to its desired version; services not listed default to their latest version.

### `license`

**Type:** `object`

License information for the generated client code.

### `package-version`

**Type:** `string`

The version of the package.

### `package-name`

**Type:** `string`

The name of the package.

### `generate-packaging-files`

**Type:** `boolean`

Whether to generate packaging files. Packaging files refer to the `setup.py`, `README`, and other files that are needed to package your code.

### `packaging-files-dir`

**Type:** `string`

If you are using a custom packaging files directory, you can specify it here. We won't generate with the default packaging files we have.

### `packaging-files-config`

**Type:** `object`

If you are using a custom packaging files directory, and have additional configuration parameters you want to pass in during generation, you can specify it here. Only applicable if `packaging-files-dir` is set.

### `package-pprint-name`

**Type:** `string`

The name of the package to be used in pretty-printing. Will be the name of the package in `README` and pprinting of `setup.py`.

### `head-as-boolean`

**Type:** `boolean`

Whether to return responses from HEAD requests as boolean. Defaults to `true`.

### `use-pyodide`

**Type:** `boolean`

Whether to generate using `pyodide` instead of `python`. If there is no python installed on your device, we will default to using pyodide to generate the code.

### `validate-versioning`

**Type:** `boolean`

Whether to validate the versioning of the package. Defaults to `true`. If set to `false`, we will not validate the versioning of the package.

### `generation-subdir`

**Type:** `string`

The subdirectory (relative to the package namespace folder) to generate the code in. Use this to keep emitter-generated code separate from hand-written/customized code, so regeneration only overwrites the subdirectory and leaves your customizations untouched. If not specified, the code is generated directly in the package namespace folder. Note: if you're using this flag, you will need to add and maintain the versioning file (`_version.py`) yourself.

Example: for `namespace: azure.storage.blob` with `generation-subdir: _generated`, generated code lands in `azure/storage/blob/_generated/` while your customized code lives in `azure/storage/blob/`. A typical `tspconfig.yaml` looks like:

```yaml
options:
  "@azure-tools/typespec-python":
    emitter-output-dir: "{output-dir}/{service-dir}/azure-storage-blob"
    namespace: "azure.storage.blob"
    generation-subdir: "_generated"
```

### `keep-setup-py`

**Type:** `boolean`

Whether to keep the existing `setup.py` when `generate-packaging-files` is `true`. If set to `false` and by default, `pyproject.toml` will be generated instead. To generate `setup.py`, use `basic-setup-py`.

### `generate-typeddict`

**Type:** `boolean`

Whether to add TypedDict typing for JSON dictionary input in `models-mode: dpg`, instead of accepting only generic JSON. This enriches the typing on the existing overloads rather than adding another request-body overload. Defaults to `true`.

### `keep-pyproject-fields`

**Type:** `object`

Which manually customized `[project]` fields to preserve in an existing `pyproject.toml` instead of overwriting them on regeneration. Set a field to `true` to keep it. By default no fields are preserved.

### `clear-output-folder`

**Type:** `boolean`

Whether to clear the output folder before generating the code. Defaults to `false`.

### `emit-yaml-only`

**Type:** `boolean`

Emit YAML code model only, without running Python generator. For batch processing.

## Structured streaming (JSONL / SSE)

For the **Azure flavor**, operations whose HTTP response is a JSONL (`application/jsonl`) or SSE (`text/event-stream`) stream generate client methods that return `Stream[T]` (sync) / `AsyncStream[T]` (async), yielding deserialized model instances instead of raw bytes. This is driven by the TCGC response stream metadata (the response stream type) — there is no opt-in emitter option. For the unbranded flavor, streaming responses keep the existing raw byte-iterator behavior (`Iterator[bytes]` / `AsyncIterator[bytes]`).

For an operation returning `JsonlStream<Thing>`, the generated method returns `Stream[Thing]` (sync) / `AsyncStream[Thing]` (async), yielding deserialized `Thing` instances as each JSONL line arrives. Similarly, `SSEStream<Events>` produces a `Stream` / `AsyncStream` over the SSE event payloads.

```python
# For an operation returning JsonlStream<Thing> (Azure flavor):
stream = client.receive()          # -> Stream[Thing]
for thing in stream:               # deserialized model instances
    ...
```

The `Stream` / `AsyncStream` runtime (plus the JSONL and SSE decoders) is **vendored** into the generated package at `_utils/streaming_base.py` (alongside `_utils/model_base.py`). It depends only on the released `azure.core.rest`, so no unreleased `azure.core.streaming` (azure-core PR #48077) dependency is required at runtime.

> **Note:** For SSE responses whose item type is a union (`@events`), each event payload is currently yielded as the parsed JSON value (e.g. a `dict` for object payloads, or the literal for terminal events such as `"[DONE]"`) rather than a fully deserialized model instance. This mirrors the existing union item-deserialization behavior used elsewhere in the generator. JSONL responses with a single model item type are deserialized into model instances.

#### Known limitations / follow-ups

- **SSE union item deserialization** — SSE item types are `@events` unions, so each event is deserialized against a forward-reference union member name and yielded as the parsed JSON value rather than a model instance. This shares a root cause with paging item deserialization: the shared `_deserialize` helper needs a `module` argument to resolve the union member names into concrete model classes. JSONL (single model item type) is unaffected and fully deserializes.
- **Heterogeneous SSE per-event dispatch** — A heterogeneous SSE stream is an `@events` union where each event has a distinct type and one may be marked `@terminalEvent` (e.g. `"[DONE]"`). The **terminal event is handled today**: it appears as a string-literal (`Literal["[DONE]"]`) member of the item union, so the generator detects it structurally and passes it to the vendored `Stream` / `AsyncStream` as `terminal_event`; the runtime stops iterating when an event's `data` matches, without attempting to JSON-parse it. What is **not** yet wired is per-event *model dispatch* — routing each `eventType` to its distinct payload model — because that mapping (event name → payload type) is not recoverable from `SdkStreamMetadata` alone: the union collapses to `Union[Thing, Literal["[DONE]"]]` in the generated code, dropping the event names. Per-event dispatch requires TCGC `sseMetadata` (`SdkSseMetadata.events[]` with `eventType` / `payloadType` / `isTerminalEvent` / `isEventEnvelope`, [typespec-client-generator-core #4882](https://github.com/Azure/typespec-azure/pull/4882)). Until then, heterogeneous events are yielded as parsed JSON (`dict`), which the SSE union item-deserialization limitation above already implies.

  Investigation (2026-08): `sseMetadata` is **not** present in the resolved TCGC `0.69.1`, **nor in `0.70.0`** (latest stable — its `SdkStreamMetadata` is byte-identical to 0.69.1, no SSE symbols). `SdkSseMetadata` (`events[]` per `@events` union variant, built by `buildSdkSseMetadata`) has since landed upstream on `Azure/typespec-azure` `main` and first appears in the `next` prerelease line (`0.71.0-dev.11`). Adopting it requires the `@typespec` 1.14 / 0.84 family bump those versions carry. Terminal-event termination does **not** depend on it (handled structurally, see above); only per-event model dispatch does.
- **SSE mock_api coverage** — The SSE spector scenario at `packages/http-specs/specs/streaming/sse/` (pinned via `@typespec/http-specs` `0.1.0-alpha.40`) defines three routes: `unnamed/receive` (homogeneous — a single unnamed `@events` variant → `message` events), `named/receive` (heterogeneous — `responseCreated`/`responseDelta` + `@terminalEvent "[DONE]"`), and `retrieve/stream` (heterogeneous with a request body). Homogeneous `unnamed/receive` and heterogeneous `named/receive` back real SSE mock_api tests (sync + async) in `tests/mock_api/azure/test_streaming_structured.py`; both assert the yielded event payloads (as `dict`s, per the union-deserialization limitation) and, for `named`, clean termination at the `[DONE]` terminal event. The `retrieve/stream` route is out of scope (request-body streaming). JSONL uses the existing `streaming/jsonl` scenario; the JSONL homogeneous mock_api tests (sync + async) run against the default Azure `streaming.jsonl` package and yield fully deserialized model instances.
