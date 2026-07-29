// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.Loader;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    /// <summary>
    /// Resolves <see cref="InputExternalTypeMetadata"/> entries to <see cref="Type"/> instances by
    /// loading assemblies from the metadata references registered for the current project. Used by
    /// <c>TypeFactory.CreateExternalType</c> as a fallback after <c>CreateFrameworkType</c> returns <c>null</c>.
    /// </summary>
    /// <remarks>
    /// Resolution state is keyed off the active <see cref="CodeModelGenerator"/> instance via a
    /// <see cref="ConditionalWeakTable{TKey, TValue}"/>, so a single external type referenced from many
    /// input types only triggers one assembly load per generator, while a fresh generator (e.g. installed
    /// by the next emit) automatically starts with an empty cache. <see cref="ResolveAllAsync"/> performs
    /// an eager pre-walk of the input library; <see cref="TryResolve"/> serves as a synchronous lookup
    /// (with on-demand resolution as a defensive fallback) from the type factory.
    /// </remarks>
    internal static class ExternalTypeReferenceResolver
    {
        // Per-generator cache state. Using ConditionalWeakTable means a new CodeModelGenerator instance
        // (e.g. a fresh mock installed by the next test) starts with an empty cache automatically, and
        // the entries are released when the generator is collected.
        private static readonly ConditionalWeakTable<CodeModelGenerator, CacheState> _cacheStates = new();

        private sealed class CacheState
        {
            public CacheState(CodeModelGenerator generator)
            {
                LoadContext = new ReferenceAssemblyLoadContext(generator.AdditionalMetadataReferences);
            }

            // Cached resolution by external identity. Value is the loaded Type, or null if resolution
            // was attempted and failed (so we don't keep re-trying).
            public readonly ConcurrentDictionary<string, Lazy<Type?>> Resolved =
                new(StringComparer.Ordinal);

            public ReferenceAssemblyLoadContext LoadContext { get; }
        }

        private static CacheState GetState(CodeModelGenerator generator) =>
            _cacheStates.GetValue(generator, static generator => new CacheState(generator));

        /// <summary>
        /// Walks all <see cref="InputType"/> instances reachable from
        /// <see cref="CodeModelGenerator.InputLibrary"/> and resolves any <see cref="InputExternalTypeMetadata"/>
        /// entries. Results are cached for use by <see cref="TryResolve"/>.
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

            foreach (var external in collected.Values)
            {
                try
                {
                    await ResolveAsync(external);
                }
                catch (Exception ex)
                {
                    generator.Emitter?.Debug(
                        $"Failed to pre-resolve external type '{external.Identity}': {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Synchronously returns the resolved <see cref="Type"/> for <paramref name="external"/>, or
        /// <c>null</c> if the identity is missing or the type cannot be located in registered metadata
        /// references. On a cache miss, performs the reference scan synchronously (a deadlock-free
        /// fall-through for the rare case where <see cref="ResolveAllAsync"/> did not see this metadata).
        /// </summary>
        public static Type? TryResolve(InputExternalTypeMetadata? external)
        {
            if (external == null
                || string.IsNullOrEmpty(external.Identity))
            {
                return null;
            }

            var state = GetState(CodeModelGenerator.Instance);
            var key = MakeKey(external);
            var lazy = state.Resolved.GetOrAdd(key, _ => new Lazy<Type?>(
                () => Task.Run(() => ResolveAsync(external)).GetAwaiter().GetResult(),
                LazyThreadSafetyMode.ExecutionAndPublication));
            return lazy.Value;
        }

        /// <summary>
        /// Clears the cached resolution state for the active <see cref="CodeModelGenerator"/> instance.
        /// </summary>
        internal static void Reset()
        {
            // Drop the entry entirely; the next call rebuilds a fresh CacheState on demand.
            _cacheStates.Remove(CodeModelGenerator.Instance);
        }

        private static string MakeKey(InputExternalTypeMetadata external) => external.Identity;

        private static async Task<Type?> ResolveAsync(InputExternalTypeMetadata external)
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

            var referencedType = await TryResolveFromRegisteredReference(external, state).ConfigureAwait(false);
            CacheResult(state, key, referencedType);
            return referencedType;
        }

        private static async Task<Type?> TryResolveFromRegisteredReference(
            InputExternalTypeMetadata external,
            CacheState state)
        {
            var assemblyPaths = CodeModelGenerator.Instance.AdditionalMetadataReferences
                .Select(reference => reference.Display)
                .Where(path => !string.IsNullOrEmpty(path) && File.Exists(path))
                .Distinct(StringComparer.OrdinalIgnoreCase);

            foreach (var assemblyPath in assemblyPaths)
            {
                try
                {
                    var assembly = await state.LoadContext
                        .LoadFromPathAsync(assemblyPath!)
                        .ConfigureAwait(false);
                    var resolvedType = assembly.GetType(external.Identity, throwOnError: false);
                    if (resolvedType != null)
                    {
                        return resolvedType;
                    }
                }
                catch (Exception ex)
                {
                    CodeModelGenerator.Instance.Emitter?.Debug(
                        $"Failed to load referenced assembly '{assemblyPath}' for external type '{external.Identity}': {ex.Message}");
                }
            }

            return null;
        }

        private sealed class ReferenceAssemblyLoadContext : AssemblyLoadContext
        {
            private readonly Dictionary<string, string> _assemblyPaths;

            public ReferenceAssemblyLoadContext(IEnumerable<Microsoft.CodeAnalysis.MetadataReference> references)
                : base(isCollectible: true)
            {
                _assemblyPaths = references
                    .Select(reference => reference.Display)
                    .Where(path => !string.IsNullOrEmpty(path) && File.Exists(path))
                    .Select(path => (Path: path!, Name: TryGetAssemblyName(path!)))
                    .Where(reference => reference.Name != null)
                    .GroupBy(reference => reference.Name!.Name!, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(
                        group => group.Key,
                        group => group.First().Path,
                        StringComparer.OrdinalIgnoreCase);
            }

            public async Task<Assembly> LoadFromPathAsync(string assemblyPath)
            {
                var assemblyName = AssemblyName.GetAssemblyName(assemblyPath);
                var loadedAssembly = FindLoadedAssembly(assemblyName);
                if (loadedAssembly != null)
                {
                    return loadedAssembly;
                }

                var assemblyBytes = await File.ReadAllBytesAsync(assemblyPath).ConfigureAwait(false);
                loadedAssembly = FindLoadedAssembly(assemblyName);
                if (loadedAssembly != null)
                {
                    return loadedAssembly;
                }

                try
                {
                    using var stream = new MemoryStream(assemblyBytes);
                    return LoadFromStream(stream);
                }
                catch (FileLoadException) when (FindLoadedAssembly(assemblyName) is { } concurrentlyLoadedAssembly)
                {
                    return concurrentlyLoadedAssembly;
                }
            }

            protected override Assembly? Load(AssemblyName assemblyName)
            {
                var defaultAssembly = Default.Assemblies.FirstOrDefault(
                    assembly => AssemblyName.ReferenceMatchesDefinition(assembly.GetName(), assemblyName));
                if (defaultAssembly != null)
                {
                    return defaultAssembly;
                }

                if (!_assemblyPaths.TryGetValue(assemblyName.Name!, out var assemblyPath))
                {
                    return null;
                }

                return LoadFromPathAsync(assemblyPath).GetAwaiter().GetResult();
            }

            private Assembly? FindLoadedAssembly(AssemblyName assemblyName) =>
                Assemblies.FirstOrDefault(
                    assembly => AssemblyName.ReferenceMatchesDefinition(assembly.GetName(), assemblyName));

            private static AssemblyName? TryGetAssemblyName(string assemblyPath)
            {
                try
                {
                    return AssemblyName.GetAssemblyName(assemblyPath);
                }
                catch (BadImageFormatException)
                {
                    return null;
                }
                catch (FileLoadException)
                {
                    return null;
                }
            }
        }

        private static void CacheResult(CacheState state, string key, Type? result)
        {
            // Replace whatever Lazy is in the slot with one that already has the computed value.
            // AddOrUpdate ensures we don't lose a concurrent write.
            var precomputed = new Lazy<Type?>(() => result, LazyThreadSafetyMode.PublicationOnly);
            // Force the value to be materialized so IsValueCreated is true.
            _ = precomputed.Value;
            state.Resolved.AddOrUpdate(key, precomputed, (_, _) => precomputed);
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
            if (type == null || !visited.Add(type))
            {
                return;
            }

            if (type.External != null
                && !string.IsNullOrEmpty(type.External.Identity))
            {
                var key = type.External.Identity;
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
    }
}
