---
title: Performance reporting
---

# Performance reporting

TypeSpec compiler can report performance statistics after a compilation. This can be enabled by passing `--stats` to the CLI.

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

Since TypeSpec 1.9.0 emitters can now also report their own performance statistics which will then be displayed in the same report.

Reporting performance in an emitter can be done using the `EmitContext.perf` API. There is a few approaches depending on the use case:

## 1. `startTimer`

This approach is useful when you want to start a timer at one point in your code and stop it later.

```ts
const timer = context.perf.startTimer("my-task");
// ... do some work
timer.stop();
```

## 2. `time`

This approach is useful when you have a synchronous function and want to measure its execution time.

```ts
context.perf.time("my-task", () => {
  // ... do some work
});
```

## 3. `timeAsync`

This approach is useful when you have an asynchronous function and want to measure its execution time.

```ts
await context.perf.timeAsync("my-task", async () => {
  // ... do some work
});
```

## 4. `reportTime`

This approach is useful when you already have the duration of a task and want to report it directly.
You can then use the `perf` utilities to measure the duration in that task.

```ts title=emit.ts
const { duration } = runTask();
context.perf.reportTime("my-task", durationInMs);
```

```ts title=task-runner.ts
import { perf } from "@typespec/compiler/utils";

function runTask(): { duration: number } {
  const timer = perf.startTimer();
  // ... do some work
  return { duration: timer.end() };
}
```

## Example

```ts
export function $onEmit(context: EmitContext) {
  const timer = context.perf.startTimer("prepare");
  prepare();
  timer.stop();

  const renderResult = context.perf.time("render", () => render());

  context.perf.timeAsync("write", () => writeOutput(renderResult));
}
```

Which would result in the following

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
