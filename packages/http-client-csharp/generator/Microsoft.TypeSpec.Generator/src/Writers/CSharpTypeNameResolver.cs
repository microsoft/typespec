// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator
{
    internal sealed class CSharpTypeNameResolver
    {
        private readonly KnownTypeIndex _knownTypes;

        public static CSharpTypeNameResolver Disabled { get; } = new(false, new KnownTypeIndex([]));

        private CSharpTypeNameResolver(bool isEnabled, KnownTypeIndex knownTypes)
        {
            IsEnabled = isEnabled;
            _knownTypes = knownTypes;
        }

        public bool IsEnabled { get; }

        public static CSharpTypeNameResolver Create(IEnumerable<TypeProvider> providers)
            => new(true, new KnownTypeIndex(EnumerateProviders(providers)));

        public Dictionary<string, TypeResolution> Analyze(IEnumerable<CSharpType> referencedTypes, string? currentNamespace)
        {
            if (!IsEnabled)
            {
                return [];
            }

            var groups = new Dictionary<string, TypeReferenceGroup>(StringComparer.Ordinal);

            foreach (var type in referencedTypes)
            {
                if (!CanAnalyze(type))
                {
                    continue;
                }

                var simpleName = GetLookupName(type);
                if (!groups.TryGetValue(simpleName, out var group))
                {
                    group = new TypeReferenceGroup(simpleName);
                    groups.Add(simpleName, group);
                }

                group.Add(type);
            }

            var resolutions = new Dictionary<string, TypeResolution>(StringComparer.Ordinal);
            foreach (var group in groups.Values)
            {
                var hasCurrentNamespaceShadow = _knownTypes.HasDifferentTypeInNamespace(
                    group.SimpleName,
                    currentNamespace,
                    group.ReferencedFullNames);

                if (group.References.Count == 1 && !hasCurrentNamespaceShadow)
                {
                    var type = group.References[0];
                    var namespaceToImport = string.Equals(type.Namespace, currentNamespace, StringComparison.Ordinal)
                        ? null
                        : type.Namespace;
                    resolutions[GetFullName(type)] = new TypeResolution(GetDisplayName(type), namespaceToImport);
                    continue;
                }

                foreach (var type in group.References)
                {
                    resolutions[GetFullName(type)] = new TypeResolution(GetFullName(type), null);
                }
            }

            return resolutions;
        }

        public bool TryResolve(
            CSharpType type,
            IReadOnlyDictionary<string, TypeResolution>? resolutions,
            out string resolvedName,
            out string? namespaceToImport)
        {
            resolvedName = string.Empty;
            namespaceToImport = null;

            if (!IsEnabled || resolutions is null || !CanAnalyze(type))
            {
                return false;
            }

            if (!resolutions.TryGetValue(GetFullName(type), out var resolution))
            {
                return false;
            }

            resolvedName = resolution.Name;
            namespaceToImport = resolution.NamespaceToImport;
            return true;
        }

        public static bool CanAnalyze(CSharpType type)
            => !string.IsNullOrEmpty(type.Namespace);

        private static string GetLookupName(CSharpType type)
            => type.DeclaringType?.Name ?? type.Name;

        private static string GetDisplayName(CSharpType type)
            => type.DeclaringType is null ? type.Name : $"{type.DeclaringType.Name}.{type.Name}";

        private static string GetFullName(CSharpType type)
            => type.DeclaringType is null
                ? type.FullyQualifiedName
                : $"{type.Namespace}.{type.DeclaringType.Name}.{type.Name}";

        private static IEnumerable<TypeProvider> EnumerateProviders(IEnumerable<TypeProvider> providers)
        {
            foreach (var provider in providers)
            {
                yield return provider;

                foreach (var serializationProvider in EnumerateProviders(provider.SerializationProviders))
                {
                    yield return serializationProvider;
                }

                foreach (var nestedProvider in EnumerateProviders(provider.NestedTypes))
                {
                    yield return nestedProvider;
                }
            }
        }

        public readonly record struct TypeResolution(string Name, string? NamespaceToImport);

        private sealed class TypeReferenceGroup
        {
            private readonly HashSet<string> _fullNames = new(StringComparer.Ordinal);

            public TypeReferenceGroup(string simpleName)
            {
                SimpleName = simpleName;
            }

            public string SimpleName { get; }
            public List<CSharpType> References { get; } = [];
            public IReadOnlySet<string> ReferencedFullNames => _fullNames;

            public void Add(CSharpType type)
            {
                if (_fullNames.Add(GetFullName(type)))
                {
                    References.Add(type);
                }
            }
        }

        private sealed class KnownTypeIndex
        {
            private readonly Dictionary<string, List<KnownType>> _typesBySimpleName = new(StringComparer.Ordinal);

            public KnownTypeIndex(IEnumerable<TypeProvider> providers)
            {
                foreach (var provider in providers)
                {
                    var type = provider.Type;
                    if (string.IsNullOrEmpty(type.Namespace))
                    {
                        continue;
                    }

                    if (!_typesBySimpleName.TryGetValue(type.Name, out var knownTypes))
                    {
                        knownTypes = [];
                        _typesBySimpleName.Add(type.Name, knownTypes);
                    }

                    knownTypes.Add(new KnownType(type.Namespace, GetFullName(type)));
                }
            }

            public bool HasDifferentTypeInNamespace(string simpleName, string? namespaceName, IReadOnlySet<string> referencedFullNames)
            {
                if (namespaceName is null || !_typesBySimpleName.TryGetValue(simpleName, out var knownTypes))
                {
                    return false;
                }

                foreach (var knownType in knownTypes)
                {
                    if (string.Equals(knownType.Namespace, namespaceName, StringComparison.Ordinal) &&
                        !referencedFullNames.Contains(knownType.FullName))
                    {
                        return true;
                    }
                }

                return false;
            }

            private readonly record struct KnownType(string Namespace, string FullName);
        }
    }
}
