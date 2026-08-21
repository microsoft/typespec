// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Input;
using NuGet.Configuration;
using NuGet.Versioning;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    /// <summary>
    /// Resolves <see cref="InputExternalTypeMetadata"/> entries to <see cref="Type"/> instances by
    /// looking up the package in the NuGet global cache (or downloading it from configured feeds when
    /// missing) and loading the assembly via reflection. Used by <c>TypeFactory.CreateExternalType</c>
    /// as a fallback after <c>CreateFrameworkType</c> returns <c>null</c>.
    /// </summary>
    /// <remarks>
    /// Resolution state is keyed off the active <see cref="CodeModelGenerator"/> instance via a
    /// <see cref="ConditionalWeakTable{TKey, TValue}"/>, so a single external type referenced from many
    /// input types only triggers one NuGet probe and one assembly load per generator, while a fresh
    /// generator (e.g. installed by the next emit) automatically starts with an empty cache.
    /// <see cref="ResolveAllAsync"/> performs an eager pre-walk of the input library and registers each
    /// resolved assembly as a Roslyn metadata reference before the generated/custom code workspaces are
    /// constructed; <see cref="TryResolve"/> serves as a synchronous lookup (with on-demand resolution
    /// as a defensive fallback) from the type factory.
    /// </remarks>
    internal static class ExternalTypeReferenceResolver
    {
        // Per-generator cache state. Using ConditionalWeakTable means a new CodeModelGenerator instance
        // (e.g. a fresh mock installed by the next test) starts with an empty cache automatically, and
        // the entries are released when the generator is collected.
        private static readonly ConditionalWeakTable<CodeModelGenerator, CacheState> _cacheStates = new();

        /// <summary>
        /// Outcome of a single resolution attempt. <see cref="Type"/> is null when resolution failed, in
        /// which case <see cref="FailureReason"/> explains why so callers can report an accurate diagnostic
        /// (a missing package and an unloadable type are very different problems to debug).
        /// </summary>
        private sealed record ResolutionResult(Type? Type, string? FailureReason)
        {
            public static readonly ResolutionResult NotAttempted = new(null, null);
        }

        private sealed class CacheState
        {
            // Cached resolution per (Package, Identity, MinVersion) key. Value carries the loaded Type, or
            // the reason resolution failed (so we don't keep re-trying).
            public readonly ConcurrentDictionary<string, Lazy<ResolutionResult>> Resolved =
                new(StringComparer.Ordinal);

            // Tracks assembly file paths that have already been added as Roslyn metadata references, so
            // the same dll isn't registered twice when it contains multiple referenced types.
            public readonly ConcurrentDictionary<string, byte> AddedAssemblyRefs =
                new(StringComparer.OrdinalIgnoreCase);

            private readonly object _assemblyResolverLock = new();
            private NugetAssemblyResolver? _assemblyResolver;

            /// <summary>
            /// The dependency resolver for this generation run, created on first use and reused for every
            /// external type resolved by the same generator.
            /// </summary>
            public NugetAssemblyResolver GetAssemblyResolver(string globalPackagesFolder, CodeModelGenerator generator)
            {
                lock (_assemblyResolverLock)
                {
                    return _assemblyResolver ??= new NugetAssemblyResolver(
                        globalPackagesFolder,
                        message => generator.Emitter?.Debug(message),
                        generator.AddMetadataReference);
                }
            }
        }

        private static CacheState GetState(CodeModelGenerator generator) =>
            _cacheStates.GetValue(generator, _ => new CacheState());

        /// <summary>
        /// Walks all <see cref="InputType"/> instances reachable from
        /// <see cref="CodeModelGenerator.InputLibrary"/> and resolves any <see cref="InputExternalTypeMetadata"/>
        /// that names a package. Results are cached for use by <see cref="TryResolve"/>; their assemblies
        /// are added to <see cref="CodeModelGenerator.AdditionalMetadataReferences"/> so subsequent Roslyn
        /// workspaces can compile generated code that references the external types.
        /// </summary>
        public static async Task ResolveAllAsync()
        {
            var generator = CodeModelGenerator.Instance;
            if (generator.InputLibrary == null)
            {
                return;
            }

            var collected = new Dictionary<string, InputExternalTypeMetadata>(StringComparer.Ordinal);
            try
            {
                CollectExternalTypes(generator.InputLibrary, collected);
            }
            catch (Exception ex)
            {
                generator.Emitter?.Debug($"External-type pre-walk failed: {ex.Message}");
                return;
            }

            if (collected.Count == 0)
            {
                return;
            }

            // Resolve each external metadata sequentially so that NuGet feed downloads do not all hit
            // the network at once and so that the metadata reference list mutates predictably.
            foreach (var external in collected.Values)
            {
                try
                {
                    await ResolveAsync(external);
                }
                catch (Exception ex)
                {
                    generator.Emitter?.Debug(
                        $"Failed to pre-resolve external type '{external.Identity}' from package '{external.Package}': {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Synchronously returns the resolved <see cref="Type"/> for <paramref name="external"/>, or
        /// <c>null</c> if the metadata is missing a package name or the assembly/type cannot be located.
        /// On a cache miss, performs the NuGet resolution synchronously (a deadlock-free fall-through
        /// for the rare case where <see cref="ResolveAllAsync"/> didn't see this metadata up front).
        /// </summary>
        public static Type? TryResolve(InputExternalTypeMetadata? external)
        {
            if (external == null
                || string.IsNullOrEmpty(external.Identity)
                || string.IsNullOrEmpty(external.Package))
            {
                return null;
            }

            var state = GetState(CodeModelGenerator.Instance);
            var key = MakeKey(external);
            var lazy = state.Resolved.GetOrAdd(key, _ => new Lazy<ResolutionResult>(
                () => Task.Run(() => ResolveResultAsync(external)).GetAwaiter().GetResult(),
                LazyThreadSafetyMode.ExecutionAndPublication));
            return lazy.Value.Type;
        }

        /// <summary>
        /// Returns the reason the most recent resolution attempt for <paramref name="external"/> failed, or
        /// <c>null</c> when it succeeded or was never attempted.
        /// </summary>
        public static string? GetFailureReason(InputExternalTypeMetadata? external)
        {
            if (external == null)
            {
                return null;
            }

            var state = GetState(CodeModelGenerator.Instance);
            return state.Resolved.TryGetValue(MakeKey(external), out var lazy) && lazy.IsValueCreated
                ? lazy.Value.FailureReason
                : null;
        }

        /// <summary>
        /// Clears the cached resolution state for the active <see cref="CodeModelGenerator"/> instance.
        /// </summary>
        internal static void Reset()
        {
            try
            {
                // Drop the entry entirely; the next call rebuilds a fresh CacheState on demand.
                _cacheStates.Remove(CodeModelGenerator.Instance);
            }
            catch (InvalidOperationException)
            {
                // No generator is installed yet, so there is no per-generator state to drop. This happens
                // when Reset runs before the first generator is loaded (e.g. a test fixture's SetUp).
            }

            // The dropped CacheState owned the dependency resolver, so stop routing loads to it. Assemblies
            // it already loaded stay in the default context; they cannot be unloaded.
            NugetAssemblyResolver.Deactivate();
        }

        private static string MakeKey(InputExternalTypeMetadata external) =>
            $"{external.Package}|{external.Identity}|{external.MinVersion ?? string.Empty}";

        private static async Task<Type?> ResolveAsync(InputExternalTypeMetadata external)
            => (await ResolveResultAsync(external)).Type;

        private static async Task<ResolutionResult> ResolveResultAsync(InputExternalTypeMetadata external)
        {
            var generator = CodeModelGenerator.Instance;
            var state = GetState(generator);

            // Populate the cache slot (creating the Lazy with the value we compute here) so that a
            // concurrent TryResolve doesn't kick off duplicate work for the same key.
            var key = MakeKey(external);
            if (state.Resolved.TryGetValue(key, out var existing) && existing.IsValueCreated)
            {
                return existing.Value;
            }

            var configurationDir = generator.Configuration?.ProjectDirectory;
            ISettings nugetSettings;
            string globalPackagesFolder;
            try
            {
                nugetSettings = !string.IsNullOrEmpty(configurationDir) && Directory.Exists(configurationDir)
                    ? Settings.LoadDefaultSettings(configurationDir)
                    : Settings.LoadDefaultSettings(null);
                globalPackagesFolder = SettingsUtility.GetGlobalPackagesFolder(nugetSettings);
            }
            catch (Exception ex)
            {
                generator.Emitter?.Debug($"Could not load NuGet settings while resolving '{external.Identity}': {ex.Message}");
                return CacheResult(state, key, new ResolutionResult(null, $"NuGet settings could not be loaded ({ex.Message})"));
            }

            // The external assembly is loaded into the default AssemblyLoadContext, which cannot see the
            // package's own dependencies. Activate this run's NuGet probing resolver before loading
            // anything so that base types and interfaces declared in dependency packages can be resolved.
            var assemblyResolver = state.GetAssemblyResolver(globalPackagesFolder, generator);
            assemblyResolver.Activate();

            string? assemblyPath = NugetPackageResolver.FindPackageAssembly(
                globalPackagesFolder, external.Package!, external.MinVersion);

            if (assemblyPath == null)
            {
                try
                {
                    string? resolvedVersion;
                    // Search for the compatible version.
                    if (!string.IsNullOrEmpty(external.MinVersion))
                    {
                        // If min version was provided, we
                        // 1. Search if it is in our repositories;
                        // 2. Get the latest one if it is not.
                        // 3. If our version is a pre release, include pre released versions in our search.
                        NuGetVersion minVersion = new(external.MinVersion);
                        IList<NuGetVersion> versions = await NugetPackageResolver.GetAllVersions(external.Package!, nugetSettings, allowPrerelease: minVersion.IsPrerelease);
                        if (versions.Any(x => x == minVersion))
                        {
                            resolvedVersion = external.MinVersion;
                        }
                        else
                        {
                            resolvedVersion = versions.Max()?.ToString();
                        }
                    }
                    else
                    {
                        // If min version was not provided, get the latest stable version.
                        resolvedVersion = await NugetPackageResolver.ResolveLatestPackageVersion(external.Package!, nugetSettings);
                    }
                    if (!string.IsNullOrEmpty(resolvedVersion))
                    {
                        var downloader = new NugetPackageDownloader(external.Package!, resolvedVersion!, null, nugetSettings);
                        var downloadedPath = await downloader.DownloadAndInstallPackage();
                        var downloadedAssembly = Path.Combine(downloadedPath, $"{external.Package}.dll");
                        if (File.Exists(downloadedAssembly))
                        {
                            assemblyPath = downloadedAssembly;
                        }
                    }
                }
                catch (Exception ex)
                {
                    generator.Emitter?.Debug(
                        $"Could not download package '{external.Package}' for external type '{external.Identity}': {ex.Message}");
                }
            }

            if (assemblyPath == null || !File.Exists(assemblyPath))
            {
                var versionQualifier = string.IsNullOrEmpty(external.MinVersion)
                    ? string.Empty
                    : $" (>= {external.MinVersion})";
                return CacheResult(state, key, new ResolutionResult(
                    null,
                    $"package '{external.Package}'{versionQualifier} was not found in the NuGet cache or any configured feed"));
            }

            // Pin every package in this package's dependency closure before loading it, so the resolving
            // hook binds dependencies to the versions NuGet selected rather than guessing from assembly
            // versions (which are routinely lower than the package versions that ship them).
            assemblyResolver.RegisterPackageClosure(assemblyPath);

            byte[] assemblyBytes;
            try
            {
                assemblyBytes = await File.ReadAllBytesAsync(assemblyPath).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                generator.Emitter?.Debug(
                    $"Failed to read assembly '{assemblyPath}' for external type '{external.Identity}': {ex.Message}");
                return CacheResult(state, key, new ResolutionResult(
                    null,
                    $"assembly '{assemblyPath}' could not be read ({ex.Message})"));
            }

            Type? loadedType;
            try
            {
                // Load from the in-memory byte array so we never hold a file handle on the dll
                // (NuGet packages may be cleaned up or replaced; tests need to be able to delete).
                var assembly = Assembly.Load(assemblyBytes);
                loadedType = assembly.GetType(external.Identity, throwOnError: false);
            }
            catch (Exception ex)
            {
                generator.Emitter?.Debug(
                    $"Failed to load assembly '{assemblyPath}' for external type '{external.Identity}': {ex.Message}");
                return CacheResult(state, key, new ResolutionResult(
                    null,
                    $"assembly '{assemblyPath}' could not be loaded ({ex.Message})" +
                    assemblyResolver.DescribeDowngradedDependencies()));
            }

            if (loadedType == null)
            {
                // Either the type genuinely isn't in the assembly, or one of its dependencies could not be
                // satisfied even with the NuGet probing hook installed - GetType reports both as null.
                generator.Emitter?.Debug(
                    $"Assembly '{assemblyPath}' does not declare external type '{external.Identity}', or one of its dependencies could not be resolved.");
                return CacheResult(state, key, new ResolutionResult(
                    null,
                    $"assembly '{assemblyPath}' was loaded but does not declare the type, or one of the type's dependencies could not be resolved" +
                    assemblyResolver.DescribeDowngradedDependencies()));
            }

            // Register the dll as a Roslyn metadata reference exactly once per assembly path so that
            // generated and custom code that uses the type compiles inside the workspace.
            // Use CreateFromImage with the in-memory bytes to avoid holding the dll open.
            if (state.AddedAssemblyRefs.TryAdd(assemblyPath, 0))
            {
                generator.AddMetadataReference(MetadataReference.CreateFromImage(assemblyBytes));
                generator.Emitter?.Debug(
                    $"Added metadata reference for external type '{external.Identity}' from {assemblyPath}");
            }

            return CacheResult(state, key, new ResolutionResult(loadedType, null));
        }

        private static ResolutionResult CacheResult(CacheState state, string key, ResolutionResult result)
        {
            // Replace whatever Lazy is in the slot with one that already has the computed value.
            // AddOrUpdate ensures we don't lose a concurrent write.
            var precomputed = new Lazy<ResolutionResult>(() => result, LazyThreadSafetyMode.PublicationOnly);
            // Force the value to be materialized so IsValueCreated is true.
            _ = precomputed.Value;
            state.Resolved.AddOrUpdate(key, precomputed, (_, _) => precomputed);
            return result;
        }

        private static void CollectExternalTypes(InputLibrary library, IDictionary<string, InputExternalTypeMetadata> collected)
        {
            // InputType uses default reference equality (no Equals/GetHashCode overrides),
            // so the default HashSet comparer is already reference-based and is what we want
            // for cycle detection during the type-graph walk.
            var visited = new HashSet<InputType>();
            var ns = library.InputNamespace;
            if (ns == null)
            {
                return;
            }

            foreach (var model in ns.Models)
            {
                VisitType(model, visited, collected);
            }
            foreach (var enumType in ns.Enums)
            {
                VisitType(enumType, visited, collected);
            }
            foreach (var constant in ns.Constants)
            {
                VisitType(constant, visited, collected);
            }
            foreach (var client in ns.Clients)
            {
                foreach (var method in client.Methods)
                {
                    if (method.Operation == null)
                    {
                        continue;
                    }
                    foreach (var p in method.Operation.Parameters)
                    {
                        VisitType(p.Type, visited, collected);
                    }
                    foreach (var r in method.Operation.Responses)
                    {
                        if (r.BodyType != null)
                        {
                            VisitType(r.BodyType, visited, collected);
                        }
                    }
                }
            }
        }

        private static void VisitType(InputType? type, HashSet<InputType> visited, IDictionary<string, InputExternalTypeMetadata> collected)
        {
            while (true)
            {
                if (type == null || !visited.Add(type))
                {
                    return;
                }

                if (type.External != null && !string.IsNullOrEmpty(type.External.Identity) && !string.IsNullOrEmpty(type.External.Package))
                {
                    var key = $"{type.External.Package}|{type.External.Identity}|{type.External.MinVersion ?? string.Empty}";
                    if (!collected.ContainsKey(key))
                    {
                        collected[key] = type.External;
                    }
                }

                switch (type)
                {
                    case InputModelType model:
                        foreach (var prop in model.Properties)
                        {
                            VisitType(prop.Type, visited, collected);
                        }

                        if (model.AdditionalProperties != null)
                        {
                            VisitType(model.AdditionalProperties, visited, collected);
                        }

                        if (model.BaseModel != null)
                        {
                            VisitType(model.BaseModel, visited, collected);
                        }

                        foreach (var derived in model.DerivedModels)
                        {
                            VisitType(derived, visited, collected);
                        }

                        foreach (var subtype in model.DiscriminatedSubtypes.Values)
                        {
                            VisitType(subtype, visited, collected);
                        }

                        break;
                    case InputArrayType array:
                        type = array.ValueType;
                        continue;
                    case InputStreamingType streaming:
                        type = streaming.ValueType;
                        continue;
                    case InputDictionaryType dictionary:
                        VisitType(dictionary.KeyType, visited, collected);
                        type = dictionary.ValueType;
                        continue;
                    case InputUnionType union:
                        foreach (var variant in union.VariantTypes)
                        {
                            VisitType(variant, visited, collected);
                        }

                        break;
                    case InputNullableType nullable:
                        type = nullable.Type;
                        continue;
                    case InputLiteralType literal:
                        type = literal.ValueType;
                        continue;
                    case InputEnumType enumType:
                        type = enumType.ValueType;
                        continue;
                }

                break;
            }
        }
    }
}
