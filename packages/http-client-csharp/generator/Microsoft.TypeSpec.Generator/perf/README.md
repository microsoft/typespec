# Generator benchmarks

Current main-based results and validation: [LatestMainProfilingResults.md](LatestMainProfilingResults.md).

Run from this directory with the .NET SDK required by `../../Directory.Build.props` (currently .NET 10).

```sh
dotnet run -c Release -- --list flat
dotnet run -c Release -- --filter '*FullGenerationBenchmark*' '*PostProcessingBenchmark*'
# Execution check only; Dry results are not performance baselines:
dotnet run -c Release -- --filter '*' --job Dry
```

## Workloads

- `FullGenerationBenchmark`: copies `TestProjects/Local/Sample-TypeSpec` into a fresh temporary directory and runs the current **base generator**. Compares the supported `disable-roslyn-reduce` option; main's provider reference-map processing is always used. Includes fixture copying, configuration, generation, output-byte counting, and cleanup. This is not management-plugin generation, process startup, or TypeSpec compilation.
- `PostProcessingBenchmark`: loads saved generated C# from `Sample-TypeSpec/src/Generated`, then measures workspace creation, document loading, and main's document-processing pipeline. Compares Roslyn reduction on/off, with corpus multipliers 1 and 5. The larger corpus uses rewritten namespaces, not independently generated SDKs. It does not measure provider reachability or full generation. Override the saved corpus with `POSTPROCESSING_BENCHMARK_GENERATED_DIR`.
- `CodeWriterBenchmark`, `MethodProviderBenchmark`, and `ModelReaderWriterContextDefinitionBenchmark`: existing focused microbenchmarks. These are not end-to-end generator measurements. Initialization constructs the base generator directly (no test-assembly plugin scan), and the context benchmark uses main's current `MethodBodyStatement` attribute representation.

`Projects/Model/tspCodeModel.json` is a minimal, current-schema namespace fixture for microbenchmark initialization. The writer/method benchmarks construct their measured providers in code; they do not generate the old saved model. The full-generation benchmark still uses the complete, current `Sample-TypeSpec` fixture.

The complete Dry matrix has 47 parameterized cases. Explicit `--job`/`-j` selection uses BenchmarkDotNet's selected job settings rather than the runner's custom default iteration counts.

For timing and allocation comparisons, leave step profiling **off**, use a Release build, and do not run other builds/benchmarks concurrently. BenchmarkDotNet reports and raw logs are written to `BenchmarkDotNet.Artifacts` (ignored). Record the main revision, local profiling changes, SDK/runtime, corpus identity, and job settings with results.

## Optional step attribution

```sh
POSTPROCESSING_BENCHMARK_PROFILE_STEPS=true \
POSTPROCESSING_BENCHMARK_PROFILE_DIR=/tmp/typespec-step-profiles \
dotnet run -c Release -- --filter '*FullGenerationBenchmark*' '*PostProcessingBenchmark*' --job Dry
```

The hooks are disabled unless a benchmark explicitly sets a profile. Enabled profiles retain main's document concurrency; they do not switch to sequential execution. Per-document durations and process-wide allocation deltas can overlap across concurrent documents, and parent/child phases overlap. **Do not sum them or interpret them as exclusive CPU time or allocations.** Use BenchmarkDotNet's unprofiled elapsed time and memory diagnoser for comparisons. Profile emission itself is inside the benchmark invocation and adds overhead.

The full-generation profile separates provider reference-map preparation, C# writing, document processing, and disk writes. The saved-corpus profile attributes document processing only. CSV files include reduction mode and corpus size in their filenames.

## Historical reports

`HotspotProfilingResults.md`, `AppServiceHotspotProfilingResults.md`, and `NativeReductionPlan.md` preserve the earlier investigation and plan. Their measurements used the old branch implementation, including legacy post-processing/shadow modes and sequential step profiling. They are **not a baseline for current main**. In particular, removed `PostProcessor` phase costs do not describe main's provider-based reference-map pipeline. Recollect measurements before using those numbers to prioritize new work.
