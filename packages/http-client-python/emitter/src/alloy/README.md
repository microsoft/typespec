# Alloy renderer (opt-in)

This directory contains an experimental alloy + emitter-framework based
renderer for `@typespec/http-client-python`. It is enabled by setting the
emitter option `use-alloy-renderer: true`.

When enabled, the emitter bypasses the existing `pygen` + Pyodide / native
Python path entirely. Instead, it constructs an alloy component tree over the
TCGC `SdkPackage` and writes Python files directly from Node, then optionally
post-processes them with a Pyodide-hosted `black` + pylint header pass.

## Current scope (foundation slice)

Only the package skeleton is rendered today:

```
<output>/<module>/__init__.py
<output>/<module>/_version.py
<output>/<module>/py.typed
<output>/pyproject.toml
<output>/README.md
```

Models, clients, operations, paging, LROs, async variants, and serialization
helpers are intentionally **not** rendered yet — they will land slice-by-slice
in follow-up changes.

Until the alloy renderer reaches feature parity with the pygen path, the
existing path remains the default. Consumers who want to experiment can pass
`--option @typespec/http-client-python.use-alloy-renderer=true`.

## File map

| File                               | Responsibility                                            |
| ---------------------------------- | --------------------------------------------------------- |
| `index.ts`                         | Public entry — `renderWithAlloy(emitContext, sdkContext)` |
| `components/output.tsx`            | Top-level alloy `Output` (externals, name policy)         |
| `components/package-directory.tsx` | Renders the package skeleton                              |
| `external-packages/corehttp.ts`    | `corehttp` / `azure.core` module descriptors              |
| `post-process.ts`                  | Pyodide-hosted `black` + pylint header pass               |

## Why this lives next to `code-model.ts`

`code-model.ts` already consumes the rich TCGC `SdkPackage` (with
`SdkLroServiceMethod`, paging metadata, polymorphism) and today serializes it
to YAML for the pygen wheel. The alloy renderer is being added side-by-side so
it can consume the same `SdkContext.sdkPackage` directly, without an
intermediate YAML round-trip.
