# MTG CPU and allocation hotspot investigation

> Historical pre-main-merge investigation. Measurements and legacy/shadow phase names below do not describe the current generator. See [README.md](README.md) for the updated workloads and measurement caveats.

Date: 2026-10-22. Companion to [NativeReductionPlan.md](NativeReductionPlan.md).

## Conclusions

1. **Replacing `Simplifier.ReduceAsync` is the agreed direction**, confirmed by the user on 2026-10-22. This investigation is not a gate to reconsider that decision; it characterizes replacement requirements and additional hotspots. Roslyn-backed reference discovery/reachability is another substantial cost in the small full-generation workload.
2. **Simplification is the clearest allocation hotspot on the larger saved C# corpus.** Approximately 91–92% of sampled allocated bytes have simplification on their stack. Allocation traffic is about 174 MB per warm 139-document operation and 943 MB at the synthetic 695-document size.
3. **These data do not establish a method-level on-CPU ranking or select Rust over specialized C#.** Linux `perf` is unavailable here. EventPipe thread samples include blocked threads, GC safepoints, and contention. They identify execution contexts, not reliable percentages of CPU cycles. Keep the existing Roslyn path as the comparison baseline/fallback while designing its replacement.
4. Prioritize **avoiding repeated general-purpose semantic work**, then compare a bounded specialized C# implementation with Rust. Do not start by porting Roslyn, the provider object model, or the graph traversal alone.
5. Validate these priorities against **Azure.ResourceManager.AppService** next. The full-generation fixture uses the base generator, not the production management plugin; the saved-corpus test exercises document processing, not full SDK generation.

No generator implementation was changed, no Rust prototype was created, and no SDK generation/pipeline was run for this report.

## Environment and workload provenance

| Item | Value |
| --- | --- |
| TypeSpec revision | `1b0c2382b2bcb208e949093f571ca073c8cbf6c7` |
| Branch | `benchmark-native-reducer-plan` |
| Machine | AMD EPYC 7763; 32 logical / 16 physical cores visible |
| Actual host | Codespaces/container, Debian 13, Linux `6.8.0-1064-azure`, x64 — **not WSL** |
| Generator build | Release; pinned SDK `10.0.103` |
| Measurement runtime | .NET `10.0.11`, concurrent workstation GC |
| Dependencies | Roslyn `4.8.0`; BenchmarkDotNet `0.13.4` |
| Diagnostics | `dotnet-trace 9.0.661903`; TraceEvent `3.1.21` for offline analysis |
| Fixture | `generator/TestProjects/Local/Sample-TypeSpec` |
| Model input | 500,067 bytes; SHA-256 `7c1079d5d992fb2c21cce956f97d439c377ce7beead4d116c56c06212a732e3e` |
| Original configuration | SHA-256 `519de546b62c923276725163bf695bae0fc9399f65529154d747c724d48432a9` |

The entire fixture was copied, preserving custom source and project context, rather than using its two JSON files alone. The original fixture was not edited. The model contains 28 models, 14 enums, and one client; the base-generator result contains **19 generated C# files / 77,002 bytes** with reduction enabled. Its sequential profile records **53 document-processing operations**; that counter is not the number of final output files. An earlier log-tail estimate of 14 output files was incorrect; the preserved output inventory is authoritative.

The separate post-processing benchmark consumes the original **139 saved generated C# files / 890,975 bytes**. Its ×5 case has **695 documents**, with namespaces rewritten by the existing benchmark to make copies distinct. This is a synthetic scaling workload, not five independently generated SDKs.

The build succeeded with two existing assembly-version conflict warnings: `System.Memory.Data` 10.0.0.3 versus 10.0.0.10, and `System.ClientModel` 1.14 versus 1.16. The primary versions selected were 10.0.0.3 and 1.14. These inputs were not upgraded for the experiment.

## Measurement design and interpretation limits

Collections were serial; measured workloads did not overlap builds or other benchmark runs.

- An external runner calls the **existing public benchmark methods**, without modifying their implementation. It records elapsed time, process CPU time, `GC.GetTotalAllocatedBytes`, collection counts, and process-memory counters. EventSource markers delimit each invocation.
- Full-generation comparisons fix `UseProviderReferenceMap=false`. The existing `disable-roslyn-reduce` option is changed only in an external fixture copy. Three process pairs use orders on/off, off/on, on/off; each process runs seven invocations. The first is separated from the six subsequent warm invocations.
- Normal-concurrency sampled-thread and allocation traces are collected **separately**. Warm regions exclude the first invocation using markers. There are 12 / 8 / 3 warm sampled-stack invocations for full generation / corpus ×1 / corpus ×5, and 4 / 3 / 2 warm allocation-trace invocations.
- Sequential step profiles provide attribution, not normal-concurrency timing. Setting `POSTPROCESSING_BENCHMARK_PROFILE_STEPS=true` replaces document `Task.WhenAll` with sequential processing. Full-generation step medians use three warm invocations; corpus step medians use two.
- Step allocation counters are process-wide estimates. Parent/child rows overlap; **do not add nested durations or allocations**. Async sampled stacks may omit an originating phase, so stack buckets are heuristic attribution, not exact phase boundaries.
- The full benchmark includes fixture copying, output byte counting, and cleanup. Its internal profile stopwatch starts after copying and stops before cleanup/profile emission. These scopes differ.
- First-in-process benchmark timing **does not include CLI process startup, plugin discovery, or TypeSpec compilation**. “Warm” below means repeated generation within one process, not merely warmed filesystem caches.

All six traces resolved successfully with **zero reported lost events and zero missing stacks** for analyzed sample/allocation events. Sampled allocation totals were 1.3%, 2.8%, and 2.8% above exact traced-run allocation counters for full generation / corpus ×1 / corpus ×5. This is a useful sampling cross-check, not proof of exact allocation attribution.

## 1. Full-generation phase hotspots

Warm median step-profile values, **reference-map mode off**. MB here means 1,000,000 bytes.

| Phase | Elapsed ms | Allocated MB | Interpretation |
| --- | ---: | ---: | --- |
| `Generation.PostProcessAsync` | 941.085 | 34.008 | Parent containing reference discovery, internalization, and removal |
| `PostProcessor.Remove.BuildAllReferenceMapAsync` | 479.555 | 13.067 | Child: all-reference map construction |
| `PostProcessor.Internalize.BuildPublicReferenceMapAsync` | 236.475 | 12.783 | Child: public-reference map construction |
| `Generation.WriteGeneratedFilesToDisk` | 274.340 | 15.581 | Parent includes deferred document processing, **not just disk I/O** |
| `Roslyn.Simplifier.ReduceAsync` | 259.569 | 14.899 | Document-processing child; 53 operations |
| `Generation.WriteTypeProviders` | 73.218 | 6.272 | Provider-to-C# writing |
| `Generation.CreateSourceInputModel` | 42.063 | 1.466 | Source-input setup |
| `Generation.BuildTypeProviders` | 30.077 | 4.873 | Provider construction |
| `Generation.ResolveExternalTypeReferences` | 26.898 | 9.178 | Smaller elapsed cost but material allocations |

The expensive reference-map work includes Roslyn symbol/reference discovery. By comparison, `PostProcessor.Internalize.VisitSymbolsFromRoot` measured only **0.483 ms** in this profile. This does **not** support a native graph-traversal rewrite as the first target; discovering semantic edges is different from traversing an already-built compact graph.

Source landmarks:

- [`ReferenceMapBuilder.cs`](../src/PostProcessing/ReferenceMapBuilder.cs): public/all-reference discovery and Roslyn symbol queries.
- [`PostProcessor.cs`](../src/PostProcessing/PostProcessor.cs): internalization, removal, and invalid-reference cleanup.
- [`GeneratedCodeWorkspace.cs`](../src/PostProcessing/GeneratedCodeWorkspace.cs): semantic-model acquisition and `Simplifier.ReduceAsync`.
- [`CSharpGen.cs`](../src/CSharpGen.cs): phase orchestration and deferred generated-file enumeration.

### Clean reduction-on/off experiment

Each row compares the median of six warm invocations **within that process**. Reference-map mode stays off.

| Pair | Reduction on ms | Reduction off ms | Wall reduction | Allocation reduction |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1,260.172 | 1,130.202 | 10.3% | 22.9% |
| 2, reversed order | 1,218.413 | 943.034 | 22.6% | 22.9% |
| 3 | 1,298.262 | 1,114.900 | 14.1% | 23.0% |

Wall results are noisy; the allocation difference is more repeatable. For completeness, pooling all 18 warm observations per mode gives medians of **1,280.415 versus 1,001.874 ms**, **3,801.146 versus 1,772.671 ms process CPU**, and **70.853 versus 54.466 MiB allocated**. Pooled medians and medians of process medians are different aggregations; do not mix them to manufacture one headline speedup.

The median first-in-process durations across the three launches were **3,719.920 / 3,352.849 ms** on/off, excluding CLI startup.

**This is an experimental bound, not a safe optimization.** Disabling reduction retains earlier semantic-model work and changes output: 13 of the 19 generated C# files differ; generated-source bytes change from 77,002 to 81,369. The benchmark's broader file-byte result changes from 102,732 to 107,099. Observed transformations include removing global qualifications and redundant parentheses; the workload is not exclusively namespace trimming. No binding-equivalence claim is made for the disabled mode.

### Official BenchmarkDotNet cross-check

The repository's `FullGenerationBenchmark`, normal concurrency and reduction enabled, was also run independently with MemoryDiagnoser: one launch, one warmup, five requested measured iterations, one invocation/unroll. BDN removed one outlier in the false case, leaving four retained observations; true retained five. Confidence intervals are wide, so this is a small cross-check, not a performance acceptance result.

| Existing reference-map mode | Mean ms | Median ms | StdDev ms | Managed allocation, MiB/op |
| --- | ---: | ---: | ---: | ---: |
| `false` | 990.276 | 1,011.326 | 59.236 | 71.57 |
| `true` | 499.880 | 498.381 | 19.329 | 49.29 |

This existing C# mode is a **different experiment** from turning simplification off. Its observation reinforces investigating how reference discovery is performed, but output/behavior equivalence was not independently established by this profiling run. Do not combine its numbers with the reducer experiment or infer a Rust benefit.

## 2. Larger-corpus CPU and memory evidence

Normal-concurrency, uninstrumented runner results. Corpus setup is outside the measured benchmark method; file parsing/workspace processing within that method remains included.

| Workload | Warm observations | Median wall ms | Median process CPU ms | Allocated MB/op | Observed process peak RSS, MiB |
| --- | ---: | ---: | ---: | ---: | ---: |
| 139 documents | 6 | 1,419.551 | 19,481.552 | 173.695 | 381.6 |
| 695 documents, synthetic ×5 | 4 | 2,974.685 | 27,833.030 | 942.666 | 511.6 |

The RSS column is the maximum recorded process-peak counter, **including the first invocation**; it is not a warm per-operation median. For ×5, the maximum comes from iteration 0.

Process CPU time sums work across all threads, so it can exceed elapsed time on this 32-logical-CPU host. This shows substantial process CPU consumption, but does not assign that CPU to individual methods. GC/scheduling/parallelism contribute. The synthetic ×5 case is not a linear production-service scaling model.

Sequential attribution cross-check:

| Workload | `ReduceAsync` ms | Process-document parent ms | `ReduceAsync` allocated MB |
| --- | ---: | ---: | ---: |
| 139 documents | 1,699.196 | 1,759.043 | 158.423 |
| 695 documents | 3,102.631 | 3,320.862 | 800.787 |

Do not subtract these sequential numbers from the concurrent timings to estimate speedup. They do show simplification dominating document-processing work in this isolated corpus benchmark, which does **not** run the full-generation reference-map/internalization pipeline.

### Allocation-stack attribution

Percentages are sampled allocated-byte weights in warm regions. The analyzer uses mutually exclusive, precedence-ordered **stack-presence buckets**; they are not exact measured phase budgets.

| Stack bucket | Full generation | Corpus ×1 | Corpus ×5 |
| --- | ---: | ---: | ---: |
| Reachability/reference analysis | 36.94% | — | — |
| Roslyn simplification | 23.52% | 91.42% | 92.13% |
| Other Roslyn | 18.31% | 8.54% | 7.86% |
| Input/JSON-related stacks | 12.14% | — | — |
| MTG writing | 4.23% | — | — |
| MTG providers | 3.91% | — | — |

Full-generation allocation types include `System.String` (13.35%) and `System.Char[]` (6.77%), but their presence does not make all string processing an appropriate native boundary. The corpus runs prominently allocate `NodeOrTokenToReduce[]` (9.24% / 8.72%), Roslyn symbols, closures, tasks, and strings. Inclusive stacks repeatedly include `CSharpNameReducer.SimplifyName`, `CSharpSemanticModel.GetSymbolInfo`, and simplification rewriters. Parent method percentages overlap and must not be summed.

**Allocation is not retention.** Hundreds of MB of allocation traffic per invocation do not mean that amount remains live. RSS includes runtime/JIT/native/mapped pages and is not the managed live heap. No heap-root/type-retention snapshot was collected, and these runs establish neither a leak nor a retained-object ranking.

## 3. What the thread samples can—and cannot—say

| Warm trace | Managed observations | External observations |
| --- | ---: | ---: |
| Full generation | 18,669 | 443,864 |
| Corpus ×1 | 69,349 | 248,562 |
| Corpus ×5 | 84,956 | 212,506 |

External observations are largely waits. Including them in a “CPU percentage” denominator would be misleading. Filtering to `Type=Managed` still does **not** yield an on-CPU profile: approximately 43–50% of managed leaf observations are `Thread.PollGC`; monitor/reader-writer-lock paths and other waits also appear. Safepoint/wait samples are not proof that these methods burn that share of CPU.

For contextual evidence only, full-generation managed-stack buckets contain simplification in 35.58% and reference analysis in 35.04% of observations. Corpus simplification appears in 85.68% / 82.76%. These support the phase/allocation findings, but **must not be presented as CPU-time fractions**, GC CPU percentages, or an Amdahl-law bound.

A native/kernel CPU profile is still required to distinguish actual on-CPU work in binding, hashing, traversal, GC, JIT, and synchronization. The current shortlist is based on timed phases, process CPU, and allocation evidence—not a verified native instruction-level profile.

## 4. Rust candidate assessment

| Priority | Candidate | Evidence and boundary decision |
| --- | --- | --- |
| Established replacement target | Bounded name/type reduction | Replacing Roslyn reduction is already agreed. A conservative generator-aware reducer could avoid general semantic work. Define the supported transformations and compare specialized C# and Rust under identical rules, including custom code, collisions, aliases, and fallback. |
| Additional hotspot | Reduce semantic reference-discovery work | Expensive public/all-reference map phases in full generation. Examine reuse of generator-owned identities/edges and repeated Roslyn queries in C#. A compact native graph kernel is only useful if graph computation itself, rather than extracting/discovering edges, becomes material. |
| 3 | Concurrency/allocation policy in Roslyn processing | High process CPU and safepoint/lock observations warrant a separate controlled C# scheduling/allocation experiment. This is not evidence that translating code to Rust removes contention. Sequential step profiling is not a clean concurrency comparison. |
| Lower for now | General CodeWriter/string processing, provider construction, input JSON | Present but smaller than Roslyn/reference discovery in these workloads. No current evidence warrants rewriting broad modules. |

Applying already-proven-safe edits in Rust is a small semantic boundary, but cannot eliminate the measured upstream Roslyn binding by itself. Exporting the whole Roslyn/provider graph introduces copying, extraction, ownership, and interop costs. A native parser alone cannot preserve C# name binding.

Before any prototype, follow the correctness and three-way comparison gates in the planning document. Keep C# orchestration and extensions; include normal-concurrency end-to-end time, FFI/encoding/copying, fallback, native allocations, and platform packaging. These data do not establish that Rust beats specialized C#.

## 5. Missing tooling and manual WSL actions

**Available here:** .NET 10 and `dotnet-trace`, used via `$HOME/.dotnet/tools/dotnet-trace` because that directory is not on this session's PATH. No host tools or kernel settings were installed/changed.

**Needed for the requested WSL/native CPU follow-up:**

1. Run in the intended WSL distro/host. This session is not WSL.
2. Install a usable Linux `perf` binary for that distro/kernel. WSL kernels may not have a matching `linux-tools-$(uname -r)` package; a distro tools package alone can leave an unusable wrapper. Verify the actual executable, or build `tools/perf` from the appropriate kernel source if required.
3. Have the administrator allow performance events / provide the necessary capabilities. Here `perf_event_paranoid=4` and container restrictions prevent assuming access. Changing only the container's tool installation may not be sufficient.
4. Smoke-test software events first; hardware PMU counters can remain unavailable under virtualization:

   ```sh
   uname -r
   perf --version
   perf stat -e task-clock -- true
   perf stat -e cycles,instructions -- true  # only when supported
   ```

5. Build before profiling, then profile the **actual generator/runner**, not a build or the BenchmarkDotNet parent process. For example, after adapting paths to the WSL checkout:

   ```sh
   DOTNET_PerfMapEnabled=3 perf record -F 199 -e cpu-clock:u -g --call-graph dwarf \
     -o mtg.perf.data -- dotnet /path/to/Runner.dll 13 false /tmp/metrics.jsonl
   perf report -i mtg.perf.data
   ```

   Confirm resolved managed names and useful mixed stacks before trusting attribution. Perf maps alone do not guarantee complete native/managed unwinding.

**Optional for retained-memory attribution:** install `dotnet-gcdump` (not installed here), e.g. `dotnet tool install --global dotnet-gcdump`, and collect a separately labeled heap snapshot. `dotnet-dump` is another absent, optional diagnostic tool; neither was needed for the allocation-stack results above. Heap collection can induce GC/pauses and must not overlap clean timings.

References: [.NET Linux profiling](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/trace-perfcollect-lttng), [dotnet-trace](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/dotnet-trace), [perf-map configuration](https://learn.microsoft.com/en-us/dotnet/core/runtime-config/debugging-profiling).

## 6. Reproduction and local artifacts

Stable local evidence and the exact investigation harness/parser sources are saved under:

```text
/workspaces/typespec/.pi/benchmarks/mtg-20261022/
```

This contains `input-manifest.json`, `binary-manifest.json`, `commands.json`, `environment.txt`, `summary.json`, per-invocation JSONL metrics, step CSVs, six stack-analysis JSON files, the output manifest/diff, BDN reports/log, and `runner/` / `analyze/` source projects. `.pi` is local/untracked; it is not a published artifact store.

Original raw `.nettrace` / resolved `.etlx` files and preserved generated trees remain at **`/tmp/mtg-hotspots-20261022/`** (about 599 MB including all artifacts). `/tmp` is ephemeral; preserve those separately if auditing these exact traces later. They are not required to generate new traces.

Build target, from `packages/http-client-csharp/generator`:

```sh
dotnet build Microsoft.TypeSpec.Generator/perf/Microsoft.TypeSpec.Generator.Tests.Perf.csproj \
  -c Release --no-restore
```

To reconstruct this local investigation layout after losing `/tmp`, from the TypeSpec root at the recorded revision (scripts currently contain these checkout paths):

```sh
mkdir -p /tmp/mtg-hotspots-20261022
cp -R .pi/benchmarks/mtg-20261022/runner .pi/benchmarks/mtg-20261022/analyze /tmp/mtg-hotspots-20261022/
cp .pi/benchmarks/mtg-20261022/{prepare.py,run_suite.py,summarize.py} /tmp/mtg-hotspots-20261022/
python3 /tmp/mtg-hotspots-20261022/prepare.py
dotnet build /tmp/mtg-hotspots-20261022/runner/Runner.csproj -c Release
dotnet build /tmp/mtg-hotspots-20261022/analyze/Analyze.csproj -c Release
python3 /tmp/mtg-hotspots-20261022/run_suite.py measure
python3 /tmp/mtg-hotspots-20261022/run_suite.py profile
python3 /tmp/mtg-hotspots-20261022/run_suite.py post
python3 /tmp/mtg-hotspots-20261022/run_suite.py inventory
python3 /tmp/mtg-hotspots-20261022/run_suite.py analyze
python3 /tmp/mtg-hotspots-20261022/summarize.py
```

These commands use separate child processes per collection, fixed reference-map mode, explicit EventPipe markers, and full fixture copies. Do not run the suites concurrently. Existing package restore/build prerequisites still apply.

Official BDN command, from this `perf` directory:

```sh
dotnet ../../artifacts/bin/Microsoft.TypeSpec.Generator.Tests.Perf/Release/net10.0/Microsoft.TypeSpec.Generator.Tests.Perf.dll \
  --filter '*FullGenerationBenchmark*' --artifacts /tmp/mtg-hotspots-20261022/bdn \
  --iterationCount 5 --warmupCount 1 --launchCount 1 --invocationCount 1 --unrollFactor 1
```

For an individual trace, the recorded commands use `dotnet-trace collect --profile dotnet-sampled-thread-time` or `--profile gc-verbose`, plus `--providers MTG-Profile:0xFFFFFFFFFFFFFFFF:4 --buffersize 512`, launching the compiled runner after `--`. Do not instead trace the BDN host and assume its benchmark child is included.

## Next: AppService production-service validation

The requested service is `sdk/websites/Azure.ResourceManager.AppService` in sibling `/workspaces/azure-sdk-for-net`, observed at `97b9032786d85215b83d87ea8f2859f44bd10662`. Its spec pin is `a61a447dd6ecb9063b7ec7da5b9cd74c4d4b4e6a`, `specification/web/resource-manager/Microsoft.Web/AppService`.

Use the official scoped local management-generator workflow with exact `-Services Azure.ResourceManager.AppService -Parallel 1 -SaveInputs`; never omit `-Services` because the default regenerates all management SDKs. Snapshot existing service files, restore locked dependencies first (installed September packages currently differ from the October lockfile), preserve fresh saved inputs plus custom/back-compat context, then profile Release generator-only replay separately from TypeSpec/build work. Restore only benchmark-created changes after preserving evidence.

Record the **actual resolved core and management generator versions**: the SDK's local management-generator build normally uses its pinned MTG dependencies, not automatically this sibling TypeSpec source. Reusing the profiling method does not make differing generator versions a valid direct A/B. Treat AppService as a separate workload/report. Before actual generation, the repository's TypeSpec-to-SDK workflow requests a high-level plan and yes/no confirmation; that confirmation has been requested. No AppService generation or dependency restore has started yet.
