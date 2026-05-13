// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Input;
using NuGet.Configuration;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    /// <summary>
    /// Resolves <see cref="InputExternalTypeMetadata"/> entries to <see cref="Type"/> instances by
    /// looking up the package in the NuGet global cache (or downloading it from configured feeds when
    /// missing) and loading the assembly via reflection. Used by <c>TypeFactory.CreateExternalType</c>
    /// as a fallback after <c>CreateFrameworkType</c> returns <c>null</c>.
    /// </summary>
    /// <remarks>
    /// The cache is process-wide so that a single external type referenced from many input types only
    /// triggers one NuGet probe and one assembly load. <see cref="ResolveAllAsync"/> performs an eager
    /// pre-walk of the input library and registers each resolved assembly as a Roslyn metadata reference
    /// before the generated/custom code workspaces are constructed; <see cref="TryResolve"/> serves as a
    /// synchronous lookup (with on-demand resolution as a defensive fallback) from the type factory.
    /// </remarks>
    internal static class ExternalTypeReferenceResolver
    {
        // Cached resolution per (Package, Identity, MinVersion) key. Value is the loaded Type, or null
        // if resolution was attempted and failed (so we don't keep re-trying).
        private static readonly ConcurrentDictionary<string, Lazy<Type?>> _resolved = new(StringComparer.Ordinal);

        // Tracks assembly file paths that we've already added as Roslyn metadata references, so the
        // same dll isn't registered twice when it contains multiple referenced types.
        private static readonly ConcurrentDictionary<string, byte> _addedAssemblyRefs = new(StringComparer.OrdinalIgnoreCase);

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
            if (generator?.InputLibrary == null)
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

            var key = MakeKey(external);
            var lazy = _resolved.GetOrAdd(key, _ => new Lazy<Type?>(
                () => Task.Run(() => ResolveAsync(external)).GetAwaiter().GetResult(),
                LazyThreadSafetyMode.ExecutionAndPublication));
            return lazy.Value;
        }

        /// <summary>
        /// Test-only: clears all caches so a fresh test can exercise the resolver without leakage from
        /// earlier tests in the same process. Not intended for production use.
        /// </summary>
        internal static void ResetForTests()
        {
            _resolved.Clear();
            _addedAssemblyRefs.Clear();
        }

        private static string MakeKey(InputExternalTypeMetadata external) =>
            $"{external.Package}|{external.Identity}|{external.MinVersion ?? string.Empty}";

        private static async Task<Type?> ResolveAsync(InputExternalTypeMetadata external)
        {
            // Populate the cache slot (creating the Lazy with the value we compute here) so that a
            // concurrent TryResolve doesn't kick off duplicate work for the same key.
            var key = MakeKey(external);
            if (_resolved.TryGetValue(key, out var existing) && existing.IsValueCreated)
            {
                return existing.Value;
            }

            var generator = CodeModelGenerator.Instance;
            var configurationDir = generator?.Configuration?.ProjectDirectory;
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
                generator?.Emitter?.Debug($"Could not load NuGet settings while resolving '{external.Identity}': {ex.Message}");
                CacheResult(key, null);
                return null;
            }

            string? assemblyPath = NugetPackageResolver.FindPackageAssembly(
                globalPackagesFolder, external.Package!, external.MinVersion);

            if (assemblyPath == null)
            {
                try
                {
                    var resolvedVersion = !string.IsNullOrEmpty(external.MinVersion)
                        ? external.MinVersion!
                        : await NugetPackageResolver.ResolveLatestPackageVersion(external.Package!, nugetSettings);

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
                    generator?.Emitter?.Debug(
                        $"Could not download package '{external.Package}' for external type '{external.Identity}': {ex.Message}");
                }
            }

            if (assemblyPath == null || !File.Exists(assemblyPath))
            {
                CacheResult(key, null);
                return null;
            }

            byte[] assemblyBytes;
            try
            {
                assemblyBytes = await File.ReadAllBytesAsync(assemblyPath).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                generator?.Emitter?.Debug(
                    $"Failed to read assembly '{assemblyPath}' for external type '{external.Identity}': {ex.Message}");
                CacheResult(key, null);
                return null;
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
                generator?.Emitter?.Debug(
                    $"Failed to load assembly '{assemblyPath}' for external type '{external.Identity}': {ex.Message}");
                CacheResult(key, null);
                return null;
            }

            if (loadedType == null)
            {
                generator?.Emitter?.Debug(
                    $"Assembly '{assemblyPath}' does not contain external type '{external.Identity}'.");
                CacheResult(key, null);
                return null;
            }

            // Register the dll as a Roslyn metadata reference exactly once per assembly path so that
            // generated and custom code that uses the type compiles inside the workspace.
            // Use CreateFromImage with the in-memory bytes to avoid holding the dll open.
            if (_addedAssemblyRefs.TryAdd(assemblyPath, 0) && generator != null)
            {
                generator.AddMetadataReference(MetadataReference.CreateFromImage(assemblyBytes));
                generator.Emitter?.Debug(
                    $"Added metadata reference for external type '{external.Identity}' from {assemblyPath}");
            }

            CacheResult(key, loadedType);
            return loadedType;
        }

        private static void CacheResult(string key, Type? result)
        {
            // Replace whatever Lazy is in the slot with one that already has the computed value.
            // AddOrUpdate ensures we don't lose a concurrent write.
            var precomputed = new Lazy<Type?>(() => result, LazyThreadSafetyMode.PublicationOnly);
            // Force the value to be materialized so IsValueCreated is true.
            _ = precomputed.Value;
            _resolved.AddOrUpdate(key, precomputed, (_, _) => precomputed);
        }

        private static void CollectExternalTypes(InputLibrary library, IDictionary<string, InputExternalTypeMetadata> collected)
        {
            var visited = new HashSet<InputType>(ReferenceEqualityComparer.Instance);
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
            if (type == null || !visited.Add(type))
            {
                return;
            }

            if (type.External != null
                && !string.IsNullOrEmpty(type.External.Identity)
                && !string.IsNullOrEmpty(type.External.Package))
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
                    VisitType(array.ValueType, visited, collected);
                    break;
                case InputDictionaryType dictionary:
                    VisitType(dictionary.KeyType, visited, collected);
                    VisitType(dictionary.ValueType, visited, collected);
                    break;
                case InputUnionType union:
                    foreach (var variant in union.VariantTypes)
                    {
                        VisitType(variant, visited, collected);
                    }
                    break;
                case InputNullableType nullable:
                    VisitType(nullable.Type, visited, collected);
                    break;
                case InputLiteralType literal:
                    VisitType(literal.ValueType, visited, collected);
                    break;
                case InputEnumType enumType:
                    VisitType(enumType.ValueType, visited, collected);
                    break;
            }
        }

        private sealed class ReferenceEqualityComparer : IEqualityComparer<InputType>
        {
            public static readonly ReferenceEqualityComparer Instance = new();
            public bool Equals(InputType? x, InputType? y) => ReferenceEquals(x, y);
            public int GetHashCode(InputType obj) => System.Runtime.CompilerServices.RuntimeHelpers.GetHashCode(obj);
        }
    }
}
