# AppService production SDK hotspot profiling

> Historical pre-main-merge investigation. Measurements and legacy/shadow phase names below do not describe the current generator. See [README.md](README.md) for the updated workloads and measurement caveats.

Date: 2026-10-22.

## Status: blocked before SDK generation

**No AppService performance measurements have been collected.** This file records the setup attempt and the tooling blocker; it must not be read as a completed production-service profile. The separate [fixture profiling report](HotspotProfilingResults.md) is unchanged and does not contain AppService results.

The user approved generation and profiling of **only `Azure.ResourceManager.AppService`**, using the sibling local Azure SDK for .NET repository. Replacing Roslyn `Simplifier.ReduceAsync` is already the agreed direction; the production profile will characterize replacement requirements and additional CPU/allocation hotspots, not reopen that decision.

## Recorded inputs

| Item | Value |
| --- | --- |
| SDK repository | `/workspaces/azure-sdk-for-net` |
| SDK revision | `97b9032786d85215b83d87ea8f2859f44bd10662` |
| Service | `sdk/websites/Azure.ResourceManager.AppService` |
| Service version | `1.6.0-beta.1`; `ApiCompatVersion` `1.5.0` |
| Pinned specs | `Azure/azure-rest-api-specs` at `a61a447dd6ecb9063b7ec7da5b9cd74c4d4b4e6a` |
| Spec directory | `specification/web/resource-manager/Microsoft.Web/AppService` |
| Actual environment | Codespaces/container Linux, not WSL |
| Required SDK | `.NET SDK 10.0.401`, from the SDK repo's `global.json`; `rollForward: feature` |
| Installed SDKs | `10.0.103`, `10.0.400` — neither satisfies that pin |

The management emitter's existing lockfile was restored successfully using `npm ci --no-audit --no-fund` (488 packages, approximately 21 seconds reported by npm). No dependency versions or lockfile contents were changed. This replaces stale installed September packages with the existing October lockfile inputs; actual loaded generator assembly versions will be recorded after a successful build, not inferred from package names.

## Attempted official scoped workflow

From `eng/packages/http-client-csharp-mgmt`:

```sh
npm ci --no-audit --no-fund
pwsh -NoProfile -File ./eng/scripts/RegenSdkLocal.ps1 \
  -Services Azure.ResourceManager.AppService -Parallel 1 -SaveInputs
```

The emitter build succeeded. The management-generator .NET build then failed because the pinned SDK could not be resolved:

```text
Requested SDK version: 10.0.401
Installed SDKs: 10.0.103, 10.0.400
global.json file: /workspaces/azure-sdk-for-net/global.json
A compatible .NET SDK was not found.
```

The wrapper failed during build step 1, before service generation. No TypeSpec service compilation, new saved-input generation, generator replay, or performance trace was completed. A stale pre-existing generator binary was not substituted, and `global.json` was not relaxed or edited.

## Required manual tooling action

Install **.NET SDK 10.0.401**, preferably alongside the existing SDKs, and verify that it is visible to `dotnet --list-sdks`. A user-local installation is also usable; provide its path so the generation command can explicitly select it without changing repository files.

For example, using the official [dotnet-install script](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-install-script):

```sh
# After obtaining dotnet-install.sh from the official .NET distribution:
bash dotnet-install.sh --version 10.0.401 --install-dir "$HOME/.dotnet-sdk-10.0.401"
"$HOME/.dotnet-sdk-10.0.401/dotnet" --list-sdks
```

No host SDK or kernel settings were installed/changed by this investigation. The installed `powershell-yaml` 0.4.12 satisfies the script's minimum 0.4.7 requirement.

For the later native/on-CPU profile, Linux `perf` is still missing and `perf_event_paranoid=4` remains restrictive. Kernel-matched perf tools and appropriate WSL/host permissions are a **separate** manual requirement. Managed EventPipe collection can proceed once the .NET SDK build blocker is removed. `dotnet-gcdump` remains optional for retained-heap/root attribution; allocation traces alone do not establish retained memory or leaks.

## Safety checks and local evidence

Before running the workflow, all **2,677 original service files / 31,407,964 bytes** were hashed and archived. After the failure, the complete service file manifest matched the original exactly. Tracked package/lock/global/spec inputs also remained unchanged, and SDK `git status --short` still showed only its pre-existing local `.pi/` directory.

Raw setup evidence and prepared replay/analyzer scripts are at:

```text
/tmp/mtg-appservice-20261022/
```

Important files include:

- `original-service.tar.gz`, `original-service-manifest.json`
- `dependency-input-manifest.json`, `blocked-status.json`
- `npm-ci.log`, `regeneration.log`, regeneration start/end timestamps
- `capture_and_restore.py`, `profile_appservice.py`, `analyze/`

A stable local copy of the small evidence/scripts and original archive is saved under:

```text
/workspaces/typespec/.pi/benchmarks/appservice-20261022/
```

Both locations are local artifacts, not published attachments; `/tmp` is ephemeral.

## Resume after SDK installation

1. Revalidate the SDK/service state and reuse the existing original snapshot; do not overwrite it.
2. Rerun the exact official scoped regeneration command, selecting the installed SDK. Keep `-Services Azure.ResourceManager.AppService`; omitting the filter would regenerate all management SDKs and is outside scope.
3. Preserve the complete fresh result, saved inputs, custom code, and ancestor NuGet/ApiCompat context. Restore only investigation-created changes to the original service after preserving evidence.
4. Build the local management generator in Release and record actual core/plugin dependency versions and binary hashes. Its pinned MTG dependency is not automatically the sibling TypeSpec source used by the fixture benchmark.
5. Validate generator-only replay output against the freshly generated C# inventory before trusting measurements. Use the actual `ManagementClientGenerator` export and exclude TypeSpec compilation/build activity from profiling.
6. Run separate repeated CLI timing/process-memory measurements, EventPipe sampled-thread collection, and GC/allocation-stack collection. New CLI processes are not warm in-process generation. Do not interpret blocked/safepoint samples as CPU percentages or allocation traffic as retained heap.
7. Replace this blocked-status report with the completed AppService findings, keeping the fixture report separate. No full regeneration pipeline, generator implementation changes, commits, or pushes are authorized by this profiling task.
