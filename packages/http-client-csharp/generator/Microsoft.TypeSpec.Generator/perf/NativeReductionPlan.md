# Profiling and selective native name reduction

> Historical pre-main-merge investigation. Measurements and legacy/shadow phase names below do not describe the current generator. See [README.md](README.md) for the updated workloads and measurement caveats.

## Status and scope

This is an investigation plan for benchmark PR #10885, not an approved production implementation or a claim that Rust is faster.

Keep C# as the generator and orchestrator. Investigate replacing only a measured hotspot with a Rust component, starting with namespace/type-name reduction currently performed by Roslyn. Do not rewrite the generator, provider model, plugin system, or general C# semantic analysis.

## Current reduction path

In `src/PostProcessing/GeneratedCodeWorkspace.cs`:

- `UpdateProject()` annotates the generated syntax root with `Simplifier.Annotation`.
- `ProcessDocument()` obtains the syntax root and semantic model, removes members, applies custom rewriters, and calls `Simplifier.ReduceAsync()` unless `Configuration.DisableRoslynReduce` is set.
- Formatting runs separately when custom rewriters are present.
- This benchmark branch already records `GetSyntaxRootAsync`, `GetSemanticModelAsync`, `Roslyn.Simplifier.ReduceAsync`, custom rewriters, formatting, and total document-processing time.

**Profiling changes execution on this branch:** enabling `POSTPROCESSING_BENCHMARK_PROFILE_STEPS=true` makes document processing sequential; ordinary execution uses `Task.WhenAll`. Use these profiles for attribution, not as the production-concurrency timing baseline. Step allocation counters are process-wide estimates, and nested step totals must not be added together as independent costs.

## Questions to answer

1. How much normal end-to-end generation time is attributable to reduction today?
2. Within reduction, is the cost semantic binding, syntax traversal/rebuilding, text processing, allocation/GC, or something else?
3. Which transformations does Roslyn actually make on representative generated output? Namespace shortening is the initial target, not an assumption that all simplification is namespace trimming.
4. Can generator-owned type identity and scope information replace enough general-purpose semantic work without changing name binding?
5. Does Rust beat an equally specialized C# implementation after conversion, interop, copying, and result integration?

## Phase 1: establish the baseline

Use the existing `FullGenerationBenchmark` and saved `Sample-TypeSpec` inputs first. Hold reference-map mode, input files, dependency versions, generator revision, and output cleanup policy constant. Do not mix reference-map changes with reducer measurements.

Record the commit, input hashes, .NET/runtime version, OS/kernel, CPU, build configuration, benchmark parameters, commands, elapsed time, and artifact locations.

Collect separately:

- Uninstrumented BenchmarkDotNet full-generation time and managed allocations.
- Existing sequential step profiles for cost attribution.
- Normal-concurrency generation with reduction enabled versus disabled, using the existing configuration switch. Disabling reduction is an experimental bound, not a proposed production fix; it changes output and does not avoid the earlier semantic-model acquisition.
- Cold CLI startup/generation and warm repeated generation, reported separately.
- Output diffs with reduction enabled/disabled to inventory transformations.

Existing step-profile invocation, from this directory:

```sh
POSTPROCESSING_BENCHMARK_PROFILE_STEPS=true \
POSTPROCESSING_BENCHMARK_PROFILE_DIR=/tmp/typespec-reduction-profiles \
  dotnet run -c Release --framework net10.0 --filter '*FullGenerationBenchmark*'
```

Run clean timing benchmarks separately with step profiling disabled. Inspect benchmark setup/cleanup costs before interpreting end-to-end measurements; the harness copies inputs and deletes temporary output on each invocation.

### Linux perf collection

Build first. Profile the actual compiled generator process, not an invocation that also builds it. The command below is a template: replace the DLL and arguments with the established generator invocation for the saved fixture.

```sh
DOTNET_PerfMapEnabled=3 \
  perf record -F 199 -g --call-graph dwarf -o generator.perf.data \
  -- dotnet <generator.dll> <generator-arguments>

perf report -i generator.perf.data
```

Check `perf` availability, kernel permissions/container restrictions, managed method names, and useful stack unwinding before trusting the profile. Perf maps supply managed names; they do not by themselves guarantee complete mixed managed/native stacks. Configure matching .NET symbols and native debug information where needed. Keep Rust release optimizations enabled when collecting native profiles.

For short-lived runs, gather sufficient samples across repeated equivalent invocations. Keep profiling runs separate from clean timing runs. Use `perf stat` in separate runs for supported counters such as cycles, instructions, and cache misses; interpret them alongside wall time rather than treating them as direct evidence for a rewrite.

Use .NET tracing when allocation sources or GC require attribution. BenchmarkDotNet managed allocations exclude Rust heap allocations, so a native prototype also needs process-memory/native-allocation measurements.

References:

- [.NET perf-map configuration](https://learn.microsoft.com/en-us/dotnet/core/runtime-config/debugging-profiling)
- [.NET Linux perf tracing](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/trace-perfcollect-lttng)

## Phase 2: define a bounded reducer

Only proceed if reduction is a material hotspot. Reuse existing fixtures; add focused cases only for behavior not already covered.

Namespace reduction must preserve C# binding, not merely remove matching text. For example, shortening `global::System.Collections.Generic.List<T>` to `List<T>` is unsafe if the target scope binds `List` differently. Account for custom code, aliases, nested types, generic parameters, member/type collisions, imported namespaces, and rewritten source.

Evaluate two boundaries:

1. **C# supplies proven-safe replacement spans; Rust applies edits in batches.** Small semantic risk, but likely limited benefit if Roslyn binding dominates. Compare with applying the same edits in C#.
2. **C# supplies generator-owned type identities and explicit scope/conflict information; a specialized reducer decides which names to shorten.** Greater potential to avoid general Roslyn work, but requires a documented safety policy. A parser alone is not a C# semantic resolver.

Initially support only explicitly understood generator-owned constructs. Keep fully qualified names for uncertain cases. Use Roslyn fallback for unsupported documents where required, and measure fallback frequency and cost. Do not use regex-only rewriting of arbitrary C# or change custom files. Comments, literals, trivia, directives, and XML documentation must remain untouched unless a separate supported rule explicitly covers them.

Inspect transformations outside namespace/type-name shortening and explicitly retain or defer them. Any intentionally different generated source must be reviewed as an output-policy change, not silently accepted as an optimization.

### Native interface candidate

Prefer one coarse call per document or batch through a Rust `cdylib` with a small C ABI, rather than a process launch or one call per name.

Specify input/output buffer encoding, span coordinate units (UTF-16 versus UTF-8), ownership/freeing, error propagation, thread safety, and ABI versioning. Rust panics must not unwind across the ABI. Avoid exchanging Roslyn/provider object graphs; their extraction cost can erase the benefit. Measure text encoding, copying, native allocations, and any reparsing needed by the remaining C# pipeline.

Keep reduction at the current pipeline position after member removal and custom rewriters. Preserve extension behavior. A separate Rust executable is an alternative only if isolation justifies startup and serialization costs.

## Phase 3: correctness and performance gates

Compare three implementations on identical inputs and rules:

| Implementation | Purpose |
| --- | --- |
| Current Roslyn reduction | Correctness and performance baseline |
| Specialized C# reducer | Isolate the benefit of changing the algorithm |
| Specialized Rust reducer | Measure the additional benefit of native implementation |

Required correctness checks:

- Existing generated-output fixtures and compilation checks.
- Focused collisions involving custom types, nested types, aliases, generic parameters, imports, and members.
- Global qualification, generic/nullable/array names, and unsupported syntax handled conservatively.
- Custom rewriters and fallback behavior, including already-rewritten source.
- Binding equivalence for supported reductions; compilation alone is insufficient because a different valid symbol can still compile.
- Deterministic output and safe concurrent execution with the normal document-processing path.

Required performance checks:

- Normal-concurrency end-to-end time, not just the isolated Rust kernel.
- Separate reducer time, input preparation, FFI/conversion, result integration, and fallback time.
- Managed allocations, native memory, process peak memory, and GC activity.
- Cold and warm results, repeatability, and representative fixture sizes.

Do not sum concurrent document durations to estimate wall-clock savings. Use the measured reducible fraction to bound potential end-to-end improvement before expanding the experiment.

After a small prototype is stable, validate only necessary representative SDKs and required affected suites. No full SDK regeneration or broad generator redesign is part of this plan.

## Decision gate and deliverables

Produce a reproducible baseline, hotspot profile, transformation inventory, documented semantic boundary, differential correctness tests, and a three-way performance comparison.

Adopt Rust only if it provides a repeatable, worthwhile end-to-end improvement beyond the specialized C# version, preserves required behavior, and justifies native packaging/maintenance across supported OS and architectures. Define the acceptance threshold before prototype comparisons. If semantic analysis dominates or interop erases the benefit, retain C# and pursue the measured algorithmic optimization instead.

Native packaging, RID coverage, supported platforms, toolchain pinning, library loading, license/security review, and managed fallback are production prerequisites, not work authorized by this planning document.
