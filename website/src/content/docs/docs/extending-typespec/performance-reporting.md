---
title: Performance Reporting
---

The TypeSpec compiler can report performance statistics after compilation, helping you identify bottlenecks and optimize your build process. Enable this feature by passing the `--stats` flag to the CLI:

```bash
tsp compile . --stats
```

<!-- cspell:disable -->

```ansi frame="terminal"
tsp compile . --stats
TypeSpec compiler v1.9.0

Compilation completed successfully.

Compiler statistics:
  Complexity:
    [90mCreated types[39m: 494
    [90mFinished types[39m: 319
  Performance:
    [90mloader[39m: [32m19ms[39m
    [90mresolver[39m: [32m6ms[39m
    [90mchecker[39m: [32m8ms[39m
    [90mvalidation[39m: [32m0ms[39m
      [90mcompiler[39m: [32m0ms[39m
    [90mlinter[39m: [32m0ms[39m
```

<!-- cspell:enable -->

The report includes:

- **Complexity metrics**: Number of types created and finished during compilation
- **Performance breakdown**: Time spent in each compilation phase (loading, resolving, type-checking, validation, and linting)

## Emitter Performance Reporting

:::note[Since TypeSpec 1.9.0]
:::
Emitters can report their own performance statistics, which are displayed alongside the compiler metrics in the same report.

Use the `EmitContext.perf` API to instrument your emitter code. The API provides several methods depending on your use case.

### `startTimer` - Manual Timer Control

Best for when the start and stop points are in different parts of your code, or when you need conditional timing:

```ts
const timer = context.perf.startTimer("my-task");

// ... do some work across multiple statements

timer.end();
```

### `time` - Synchronous Function Timing

Best for wrapping synchronous code blocks. Returns the result of the callback function:

```ts
const result = context.perf.time("my-task", () => {
  // ... do some work
  return computedValue;
});
```

### `timeAsync` - Asynchronous Function Timing

Best for wrapping async operations. Returns a promise with the callback's result:

```ts
const result = await context.perf.timeAsync("my-task", async () => {
  // ... do some async work
  return await fetchData();
});
```

### `reportTime` - Report Pre-measured Duration

Best when you already have timing data from another source (e.g., a child process or external tool):

```ts title="emit.ts"
const { duration } = runTask();
context.perf.reportTime("my-task", duration);
```

You can use the standalone `perf` utilities to measure duration in code that doesn't have access to the emit context:

```ts title="task-runner.ts"
import { perf } from "@typespec/compiler/utils";

function runTask(): { duration: number } {
  const timer = perf.startTimer();
  // ... do some work
  return { duration: timer.end() };
}
```

## Complete Example

Here's how to instrument a typical emitter with multiple phases:

```ts
import { EmitContext } from "@typespec/compiler";

export async function $onEmit(context: EmitContext) {
  // Manual timer for the preparation phase
  const timer = context.perf.startTimer("prepare");
  prepare();
  timer.end();

  // Wrap synchronous rendering with automatic timing
  const renderResult = context.perf.time("render", () => render());

  // Wrap async file writing with automatic timing
  await context.perf.timeAsync("write", async () => writeOutput(renderResult));
}
```

Running `tsp compile . --stats` with this instrumented emitter produces:

<!-- cspell:disable -->

```ansi frame="terminal"
tsp compile . --stats
TypeSpec compiler v1.9.0

Compilation completed successfully.

Compiler statistics:
  Complexity:
    [90mCreated types[39m: 494
    [90mFinished types[39m: 319
  Performance:
    [90mloader[39m: [32m19ms[39m
    [90mresolver[39m: [32m6ms[39m
    [90mchecker[39m: [32m8ms[39m
    [90mvalidation[39m: [32m0ms[39m
      [90mcompiler[39m: [32m0ms[39m
    [90mlinter[39m: [32m0ms[39m
    [90memit[39m: [32m128ms[39m
      [90mmy-emitter[39m: [32m128ms[39m
        [90mprepare[39m: [32m39ms[39m
        [90mrender[39m: [32m28ms[39m
        [90mwrite[39m: [32m51ms[39m
```

<!-- cspell:enable -->

The emitter's custom metrics (`prepare`, `render`, `write`) appear nested under the emitter name, giving you a clear breakdown of where time is spent during code generation.
