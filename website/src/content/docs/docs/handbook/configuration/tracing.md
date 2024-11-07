---
title: Tracing
---

The TypeSpec Compiler, by default, builds without any debug information. The standard output is minimal, only including any `warning` or `error` diagnostics that occur during the compilation process.

However, the compiler does collect additional information that can be accessed using the `--trace` command-line interface (CLI) flag.

```bash
tsp compile . --trace import-resolution
```

If you want to log multiple areas, you can use the `--trace` option more than once.

```bash
tsp compile . --trace import-resolution  --trace projection
```

To log everything, use `--trace *`. This might produce a lot of output, but you can [select specific trace areas to include](#selecting-trace-areas)

You can also specify the trace areas in the `tspconfig.yaml` file:

```yaml
trace: *

trace:
  - import-resolution
  - projection
```

## Selecting trace areas

The tracing system in the tsp compiler organizes each trace under a specific area. The area name is a dot `.` separated string of area segments.

To filter the areas you want to trace, you can use this area path. The filter follows the same naming style, but the last segment can be a wildcard `*`. However, this produces the same result as leaving out the last segment. In other words, these filters behave identically:

- `foo` and `foo.*`
- `one.two` and `one.two.*`

For instance, if we have these three areas:

- `one.two.three`
- `one.foo`
- `bar.info`

You can use:

- `*` to log everything
- `one` to log everything under `one`(`one.two.three`, `one.foo`)
- `bar` to log everything under `bar`(`bar.info`)
- `one.foo` to log everything under `one.foo`(`one.foo`)
- `other` to log everything under `other`, which is nothing in this case.

## Trace areas in the compiler

Here is a list of the trace areas used in the compiler:

| Area                           | Description                                                            |
| ------------------------------ | ---------------------------------------------------------------------- |
| `compiler.options`             | Logs the resolved compiler options                                     |
| `import-resolution.library`    | Logs information related to the resolution of import libraries         |
| `projection.log`               | Logs debug information from the `log()` function used in projections   |
| `bind.js`                      | Logs information when binding JS files                                 |
| `linter.register-library`      | Logs information when a library's rules are being loaded               |
| `linter.register-library.rule` | Logs information about a rule that is being registered                 |
| `linter.extend-rule-set.start` | Logs information about a ruleset that is about to be extended          |
| `linter.extend-rule-set.end`   | Logs information about rules enabled after extending a ruleset         |
| `linter.lint`                  | Starts the lint process and shows information of all the rules enabled |

## Tracing in TypeSpec libraries

TypeSpec libraries can also emit their own traces that can be collected using the same mechanism. To avoid naming conflicts, it's recommended that a library prefixes their tracing area with the library name. This can be done by calling the `sub(subArea: string)` method on the tracer.

```ts
const tracer = program.tracer.sub("my-library");
```

The tracer can then be used for trace collection:

```ts
tracer.trace("emitting-ts", "Emitting ts interface");
```
