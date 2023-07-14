---
title: Tracing
---

# Tracing

By default the TypeSpec Compiler will build without any debug information. The standard output will be minimal and limited to any `warning` or `error` diagnostics emitted during compilation.

Some additional information is however being collected and can be revealed using the `--trace` cli flag.

```bash
tsp compile . --trace import-resolution
```

You can use the `--trace` option multiple times if there is multiple areas that should be logged from.

```bash
tsp compile . --trace import-resolution  --trace projection
```

Using `--trace *` will log everything. This might be a bit overwhelming but you can [pick and choose which trace area to include](#trace-selection)

It can also be provided via the `tspconfig.yaml` file:

```yaml
trace: *

trace:
  - import-resolution
  - projection
```

## Trace selection

The tracing system in the tsp compiler works by having each trace under an area. The area name is a dot `.` separated string of area segments.

When filtering which area to select you can use this area path to select which area is going to be revealed.
The filter follow the same naming style, except the last segment could be a wildcard `*`. This is however the same result as omitting the last segment all together. In other words, those filter have the exact same behavior:

- `foo` and `foo.*`
- `one.two` and `one.two.*`

For example, assuming we'd have those 3 areas

- `one.two.three`
- `one.foo`
- `bar.info`

Using:

- `*` will log everything
- `one` will log everything under `one`(`one.two.three`, `one.foo`)
- `bar` will log everything under `bar`(`bar.info`)
- `one.foo` will log everything under `one.foo`(`one.foo`)
- `other` will log everything under `other` which is nothing here.

## Compiler Trace Areas

This is a list of the trace area used in the compiler

| Area                           | Description                                                          |
| ------------------------------ | -------------------------------------------------------------------- |
| `compiler.options`             | Log the resolved compiler options                                    |
| `import-resolution.library`    | Information related to the resolution of import libraries            |
| `projection.log`               | Debug information logged by the `log()` function used in projections |
| `bind.js`                      | Information when binding JS files                                    |
| `linter.register-library`      | Information that a library rules will be loaded                      |
| `linter.register-library.rule` | Information about a rule that is being registered                    |
| `linter.extend-rule-set.start` | Information about a ruleset it is about to extend                    |
| `linter.extend-rule-set.end`   | Information about rules enabled after extending a ruleset            |
| `linter.lint`                  | Start the lint process and show information of all the rules enabled |

## Tracing in TypeSpec library

TypeSpec libraries can emit their own tracing that can be collected using the same mechanism. It is recommended that a library scope their tracing area under the library name to prevent collision. This can be achieved by calling the `sub(subArea: string)` method on the tracer.

```ts
const tracer = program.tracer.sub("my-library");
```

the tracer is then available for trace collection

```ts
tracer.trace("emitting-ts", "Emitting ts interface");
```
