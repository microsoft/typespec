# Changelog - @typespec/tspd

## 0.77.1

### Bug Fixes

- [#11813](https://github.com/microsoft/typespec/pull/11813) Document the generated auto decorator accessors, so libraries re-exporting them satisfy
  api-extractor's `ae-undocumented` rule. `get*` and `set*` accessors carry the description of the
  decorator they read or write; `is*` accessors get a generic one, since a decorator description
  does not describe a boolean check.
  
  ```ts
  /** Check if the `@TypeSpec.GraphQL.inputType` decorator was applied on the given target. */
  export function isInputType(program: Program, target: Model): boolean {
    return hasAutoDecorator(program, "TypeSpec.GraphQL.inputType", target);
  }
  
  /** Mark a model as a GraphQL input type in the emitted schema. */
  export function setInputType(program: Program, target: Model): void {
    setAutoDecorator(program, "TypeSpec.GraphQL.inputType", target);
  }
  ```
- [#11813](https://github.com/microsoft/typespec/pull/11813) Honor the library's own `tspconfig.yaml` when generating signatures and reference documentation, so
  libraries that opt into a compiler feature (such as `auto-decorators`) no longer report errors during
  `gen-extern-signature` and `doc`.
- [#11561](https://github.com/microsoft/typespec/pull/11561) `gen-extern-signature` now generates signatures for sub path exports. Each export with a `typespec` condition is compiled on its own, entities are attributed to the export that first reaches their source file, and the generated files are written under a directory matching the sub path with `$decorators` imported from that same sub path.
  
  ```ts
  // generated-defs/streams/MyLib.Streams.ts-test.ts
  import { $decorators } from "my-lib/streams";
  import type { MyLibStreamsDecorators } from "./MyLib.Streams.js";
  
  const _decs: MyLibStreamsDecorators = $decorators["MyLib.Streams"];
  ```


## 0.77.0

### Features

- [#11221](https://github.com/microsoft/typespec/pull/11221) `tspd doc` now generates a documentation page per linter rule (`reference/rules/<name>.md`) and per diagnostic (`reference/diagnostics/<code>.md`), sourced from the `docs` field on the rule and diagnostic definitions. A `documentation-missing` warning is reported for any linter rule or diagnostic that does not provide documentation.
- [#11000](https://github.com/microsoft/typespec/pull/11000) `tspd gen-extern-signature` now also generates a typed setter (e.g. `setMyFlag`, `setMyLabel`) for each `auto` decorator, alongside the existing `is*`/`get*` readers.
- [#11316](https://github.com/microsoft/typespec/pull/11316) Add a `--rules-dir` option (and `rulesDir` API option) to `tspd doc` to control where per-rule reference pages are written. Defaults to `rules` (relative to `--output-dir`); can be set to a path escaping the output dir (e.g. `../rules`) to keep rule pages outside the generated reference folder.


## 0.76.0

### Features

- [#10197](https://github.com/microsoft/typespec/pull/10197) `tspd gen-extern-signature` now generates typed accessor functions for `auto` decorators (e.g., `isMyFlag`, `getMyLabel`).
- [#11247](https://github.com/microsoft/typespec/pull/11247) `tspd gen-extern-signature` now also generates a typed setter (e.g. `setMyFlag`, `setMyLabel`) for each `auto` decorator, alongside the existing `is*`/`get*` readers.


## 0.75.0

### Features

- [#10640](https://github.com/microsoft/typespec/pull/10640) Improve render of complex emitter options
- [#10640](https://github.com/microsoft/typespec/pull/10640) Render documentation for sub exports

### Bug Fixes

- [#10880](https://github.com/microsoft/typespec/pull/10880) Render function type signatures with arrow syntax and avoid internal compiler imports.


## 0.74.2

### Bug Fixes

- [#10501](https://github.com/microsoft/typespec/pull/10501) Fix broken (404) links to linter rule pages on auto-generated linter reference pages. The links no longer drop the website base path.


## 0.74.1

### Bump dependencies

- [#9838](https://github.com/microsoft/typespec/pull/9838) Upgrade dependencies


## 0.74.0

### Bump dependencies

- [#9446](https://github.com/microsoft/typespec/pull/9446) Upgrade dependencies


## 0.73.3

### Bump dependencies

- [#9202](https://github.com/microsoft/typespec/pull/9202) Update to alloy 0.22
- [#9223](https://github.com/microsoft/typespec/pull/9223) Upgrade dependencies


## 0.73.2

### Bump dependencies

- [#9046](https://github.com/microsoft/typespec/pull/9046) Upgrade dependencies


## 0.73.1

### Bump dependencies

- [#8823](https://github.com/microsoft/typespec/pull/8823) Upgrade dependencies

### Bug Fixes

- [#8580](https://github.com/microsoft/typespec/pull/8580) Handle union of union correctly for target type in decorator signature generation


## 0.73.0

### Features

- [#8345](https://github.com/microsoft/typespec/pull/8345) Adds `llmstxt` frontmatter to generated reference docs to enable inclusion in llms.txt. Opt-in: specify `--llmstxt` to enable

### Bump dependencies

- [#8317](https://github.com/microsoft/typespec/pull/8317) Upgrade dependencies

### Bug Fixes

- [#8362](https://github.com/microsoft/typespec/pull/8362) Upgrade alloy to 0.20


## 0.72.2

### Bump dependencies

- [#8050](https://github.com/microsoft/typespec/pull/8050) Upgrade alloy 0.19
- [#7978](https://github.com/microsoft/typespec/pull/7978) Upgrade dependencies


## 0.72.0

### Bump dependencies

- [#7655](https://github.com/microsoft/typespec/pull/7655) Upgrade to alloy 0.18.0
- [#7674](https://github.com/microsoft/typespec/pull/7674) Upgrade dependencies

### Bug Fixes

- [#7647](https://github.com/microsoft/typespec/pull/7647) Add missing dependency on `@microsoft/api-extractor`


## 0.71.0

### Features

- [#7218](https://github.com/microsoft/typespec/pull/7218) Add basic doc generation for typekits using `--typekits` flag

### Bump dependencies

- [#7605](https://github.com/microsoft/typespec/pull/7605) Updates alloy to 0.17
- [#7363](https://github.com/microsoft/typespec/pull/7363) Upgrade alloy 16

### Bug Fixes

- [#7481](https://github.com/microsoft/typespec/pull/7481) Fix duplicate usage sections by renaming emitter usage section to "Emitter usage"


## 0.70.0

### Features

- [#7083](https://github.com/microsoft/typespec/pull/7083) Migrate internal decorator signature generation to alloy




## 0.69.0

### Features

- [#7031](https://github.com/microsoft/typespec/pull/7031) Always add `emitter-output-dir` to list of options

### Bug Fixes

- [#7046](https://github.com/microsoft/typespec/pull/7046) `typedoc` missing as a dependency
- [#7069](https://github.com/microsoft/typespec/pull/7069) Handle types without node

