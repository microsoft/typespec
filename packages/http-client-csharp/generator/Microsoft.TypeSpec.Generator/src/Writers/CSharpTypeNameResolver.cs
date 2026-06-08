// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator
{
    internal sealed class CSharpTypeNameResolver
    {
        private readonly KnownTypeIndex _knownTypes;
        private readonly HashSet<CSharpType>? _referencedTypes;
        private readonly Dictionary<string, TypeResolution>? _resolutions;

        public static CSharpTypeNameResolver Disabled { get; } = new(false, new KnownTypeIndex([]), null, null);

        private CSharpTypeNameResolver(
            bool isEnabled,
            KnownTypeIndex knownTypes,
            HashSet<CSharpType>? referencedTypes,
            Dictionary<string, TypeResolution>? resolutions)
        {
            IsEnabled = isEnabled;
            _knownTypes = knownTypes;
            _referencedTypes = referencedTypes;
            _resolutions = resolutions;
        }

        public bool IsEnabled { get; }

        public IReadOnlyCollection<CSharpType> ReferencedTypes => _referencedTypes ?? [];

        public static CSharpTypeNameResolver Create(IEnumerable<TypeProvider> providers)
            => new(true, new KnownTypeIndex(EnumerateProviders(providers)), null, null);

        public CSharpTypeNameResolver CreateCollector()
            => IsEnabled
                ? new CSharpTypeNameResolver(true, _knownTypes, new HashSet<CSharpType>(), null)
                : Disabled;

        public CSharpTypeNameResolver CreateResolver(IEnumerable<CSharpType> referencedTypes, string? currentNamespace)
            => IsEnabled
                ? new CSharpTypeNameResolver(true, _knownTypes, null, Analyze(referencedTypes, currentNamespace))
                : Disabled;

        public void AddReference(CSharpType type)
        {
            if (_referencedTypes is null || !CanAnalyze(type))
            {
                return;
            }

            _referencedTypes.Add(type);
        }

        public bool TryResolve(CSharpType type, out string resolvedName, out string? namespaceToImport)
        {
            resolvedName = string.Empty;
            namespaceToImport = null;

            if (!IsEnabled || _resolutions is null || !CanAnalyze(type))
            {
                return false;
            }

            if (!_resolutions.TryGetValue(GetFullName(type), out var resolution))
            {
                return false;
            }

            resolvedName = resolution.Name;
            namespaceToImport = resolution.NamespaceToImport;
            return true;
        }

        private Dictionary<string, TypeResolution> Analyze(IEnumerable<CSharpType> referencedTypes, string? currentNamespace)
        {
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

                var prefixTrie = new NamespacePrefixTrie();
                var namespaceCount = 0;
                foreach (var type in group.References)
                {
                    if (prefixTrie.Add(type.Namespace))
                    {
                        namespaceCount++;
                    }
                }

                namespaceCount += _knownTypes.AddNamespacesForDifferentTypes(group.SimpleName, currentNamespace, group.ReferencedFullNames, prefixTrie);

                var commonPrefix = prefixTrie.GetLongestCommonPrefix(namespaceCount);
                foreach (var type in group.References)
                {
                    var name = BuildQualifiedName(type, commonPrefix);
                    var namespaceToImport = string.IsNullOrEmpty(commonPrefix) ||
                        string.Equals(commonPrefix, currentNamespace, StringComparison.Ordinal)
                            ? null
                            : commonPrefix;
                    resolutions[GetFullName(type)] = new TypeResolution(name, namespaceToImport);
                }
            }

            return resolutions;
        }

        private static string BuildQualifiedName(CSharpType type, string commonPrefix)
        {
            if (string.IsNullOrEmpty(commonPrefix))
            {
                return $"{type.Namespace}.{GetDisplayName(type)}";
            }

            if (string.Equals(type.Namespace, commonPrefix, StringComparison.Ordinal))
            {
                return GetDisplayName(type);
            }

            return $"{type.Namespace.AsSpan(commonPrefix.Length + 1).ToString()}.{GetDisplayName(type)}";
        }

        private static bool CanAnalyze(CSharpType type)
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

        private readonly record struct TypeResolution(string Name, string? NamespaceToImport);

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

            public int AddNamespacesForDifferentTypes(
                string simpleName,
                string? namespaceName,
                IReadOnlySet<string> referencedFullNames,
                NamespacePrefixTrie trie)
            {
                if (namespaceName is null || !_typesBySimpleName.TryGetValue(simpleName, out var knownTypes))
                {
                    return 0;
                }

                var added = 0;
                foreach (var knownType in knownTypes)
                {
                    if (string.Equals(knownType.Namespace, namespaceName, StringComparison.Ordinal) &&
                        !referencedFullNames.Contains(knownType.FullName) &&
                        trie.Add(knownType.Namespace))
                    {
                        added++;
                    }
                }

                return added;
            }

            private readonly record struct KnownType(string Namespace, string FullName);
        }

        private sealed class NamespacePrefixTrie
        {
            private readonly Node _root = new();
            private readonly HashSet<string> _namespaces = new(StringComparer.Ordinal);

            public bool Add(string namespaceName)
            {
                if (!_namespaces.Add(namespaceName))
                {
                    return false;
                }

                var node = _root;
                node.Count++;
                var start = 0;
                while (start < namespaceName.Length)
                {
                    var separator = namespaceName.IndexOf('.', start);
                    var length = separator < 0 ? namespaceName.Length - start : separator - start;
                    var segment = namespaceName.Substring(start, length);
                    node = node.GetOrAdd(segment);
                    node.Count++;
                    if (separator < 0)
                    {
                        break;
                    }
                    start = separator + 1;
                }

                return true;
            }

            public string GetLongestCommonPrefix(int expectedCount)
            {
                if (expectedCount <= 0)
                {
                    return string.Empty;
                }

                var builder = new StringBuilder();
                var node = _root;
                while (node.Children is { Count: 1 })
                {
                    using var enumerator = node.Children.GetEnumerator();
                    enumerator.MoveNext();
                    var child = enumerator.Current.Value;
                    if (child.Count != expectedCount)
                    {
                        break;
                    }

                    if (builder.Length > 0)
                    {
                        builder.Append('.');
                    }
                    builder.Append(enumerator.Current.Key);
                    node = child;
                }

                return builder.ToString();
            }

            private sealed class Node
            {
                public int Count { get; set; }
                public Dictionary<string, Node>? Children { get; private set; }

                public Node GetOrAdd(string segment)
                {
                    Children ??= new Dictionary<string, Node>(StringComparer.Ordinal);
                    if (!Children.TryGetValue(segment, out var child))
                    {
                        child = new Node();
                        Children.Add(segment, child);
                    }

                    return child;
                }
            }
        }
    }
}
