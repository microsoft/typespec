# Benchmark refresh against latest main

Date: 2026-10-22. Workloads and reproduction details: [README.md](README.md).

## Source and environment

- Main: `721154b2ab55bfc78ab4850e86c40487f66241f2`.
- Merged into `benchmark-native-reducer-plan`, previously `7eae3f31c`.
- Generator implementation and tests taken from main, with opt-in phase/document timing hooks and the new profiling tests. Old legacy/shadow implementations were not carried forward. This is a **main-based instrumentable build**, not an unmodified-main versus candidate comparison.
- Release; .NET SDK **10.0.402**, runtime **10.0.13**, concurrent workstation GC; BenchmarkDotNet **0.13.4**, Roslyn **4.8.0**.
- Linux/WSL2, Intel Xeon Platinum 8370C; 16 logical / 8 physical cores reported. This is not the Codespaces host used for the historical reports.
- Full generation: current `TestProjects/Local/Sample-TypeSpec`, copied into a fresh temporary directory per invocation, preserving its configuration/custom sources/project. Build artifacts are excluded. Uses the base generator, **not the management plugin**.
- Model SHA-256: `d9a6ccce7676fdca5b3cda979540ede872f7e240a830bdbf26f1ae156480305a`.
- Original configuration SHA-256: `519de546b62c923276725163bf695bae0fc9399f65529154d747c724d48432a9`. Only `disable-roslyn-reduce` is overridden in memory for each case.
- Saved generated corpus: **178 C# files / 1,184,088 bytes**. The ×5 case has **890 documents** with rewritten namespaces. Corpus SHA-256: `4651e60f35fff14f3ef94885666ca48783ba92cb4c72844cdef9febeb24d0bc8` (concatenate sorted relative POSIX paths, NUL, then file bytes).

## Unprofiled results

Step profiling was **disabled**. All six cases ran sequentially without concurrent builds. Job: one warmup iteration, 250 ms target iteration time, 15–20 measurement iterations; MemoryDiagnoser enabled. Operations slower than the target still run to completion. Error is BenchmarkDotNet's half-width of the 99.9% confidence interval; allocation units below are binary MiB.

| Workload | Roslyn reduction | Mean | Error | StdDev | Allocated/op |
| --- | --- | ---: | ---: | ---: | ---: |
| Saved corpus ×1 | On | 1,187.2 ms | 226.06 ms | 251.27 ms | 275.31 MiB |
| Saved corpus ×1 | Off | 274.2 ms | 49.32 ms | 56.80 ms | 25.11 MiB |
| Saved corpus ×5 | On | 4,797.4 ms | 279.79 ms | 322.20 ms | 1,090.56 MiB |
| Saved corpus ×5 | Off | 830.8 ms | 36.02 ms | 41.48 ms | 121.69 MiB |
| Full base generation | On | 2,174.9 ms | 61.93 ms | 68.84 ms | 75.88 MiB |
| Full base generation | Off | 2,061.2 ms | 48.34 ms | 53.73 ms | 33.83 MiB |

The unprofiled run completed in **318.88 s**, excluding its preceding build and smoke run.

### Interpretation

- Disabling reduction lowered mean saved-corpus elapsed time by about **77% at ×1** and **83% at ×5**, and allocations by about **91%** and **89%**. These are point estimates for this workload, not a guaranteed replacement speedup.
- Full-generation elapsed time changed by only about **5%**, while allocations fell about **55%**. Separate profiled invocations attribute roughly **1.96 s** to main's project/package-reference setup. That setup is inside the benchmark; do not interpret the full-generation mean as provider processing alone or infer a production bottleneck from this small fixture.
- The ×1 measurements are noisy; BenchmarkDotNet flagged a possible multimodal distribution for a saved-corpus case. Retain the reported error/StdDev rather than treating small changes as significant.
- Turning reduction off changes generated source presentation; it is an attribution control, **not** a validated replacement. The saved corpus excludes handwritten sources and is not a compilation/SDK correctness test. No native reducer, production generator optimization, management SDK regeneration, or pipeline run was performed.
- These data are elapsed-time and managed-allocation measurements, **not method-level on-CPU rankings**. The hardware, input model, saved corpus, and generator pipeline differ from the historical reports, so direct old/new speedup claims would be invalid.

## Validation and benchmark repairs

- Release benchmark build: **0 warnings, 0 errors**.
- Focused tests: **83 passed**, covering `CSharpGenTests`, `ProviderReferenceMapAnalyzerTests`, and the new `ProfilingTests`.
- New tests compare profiled/unprofiled document text and filenames with reduction both enabled and disabled, verify both documents are processed, and verify simplifier profile rows respect the option.
- **All 47 parameterized cases** completed with a real Dry job, including all 36 context-definition combinations, the writer benchmark, four method-provider cases, and six generation/document-processing cases. Dry wall time: **89.76 s**. These cold single-iteration numbers are execution checks, not performance baselines.
- All six unprofiled generation/document-processing cases completed successfully. Long-run timing was not recollected for the 41 microbenchmark cases.
- Fixed stale microbenchmark setup: avoid MEF scanning unrelated test-platform assemblies; initialize the base generator/source-input model directly. Replaced the obsolete PascalCase model JSON with a minimal current-schema namespace fixture because these microbenchmarks construct their measured providers in code.
- Updated the context-definition reflection delegate to main's `IReadOnlyList<MethodBodyStatement>` return type.
- Fixed runner job selection: the custom default settings previously overrode `--job Dry`; explicit CLI jobs now use their own settings. The first attempted smoke run therefore used full iterations with profiling enabled; its numbers are **not** the unprofiled results above.
- Optional profiles preserve main's document concurrency. Their durations/allocations overlap across concurrent documents and nested scopes; never sum them as exclusive costs.

## Reproduction and local evidence

From this directory:

```sh
dotnet build -c Release
dotnet run -c Release --no-build -- --filter '*' --job Dry
# Leave POSTPROCESSING_BENCHMARK_PROFILE_STEPS unset:
dotnet run -c Release --no-build -- \
  --filter '*FullGenerationBenchmark*' '*PostProcessingBenchmark*' \
  --artifacts BenchmarkDotNet.Artifacts/main-baseline
```

Raw local results (ignored):

- `BenchmarkDotNet.Artifacts/main-baseline/results/BenchmarkRun-joined-2026-10-22-15-50-19-report.{csv,html}` and `-report-github.md`.
- `BenchmarkDotNet.Artifacts/final-dry/`: complete execution-check log and reports.

The historical reports remain preserved and explicitly marked historical; use this refresh for the current main-based workloads.
