// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator
{
    internal sealed class CSharpTypeNameResolver
    {
        private readonly Dictionary<string, TypeResolution> _resolutions;

        private CSharpTypeNameResolver(Dictionary<string, TypeResolution> resolutions)
        {
            _resolutions = resolutions;
        }

        public static CSharpTypeNameResolver Create(IEnumerable<CSharpType> referencedTypes, string? currentNamespace)
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
                if (group.References.Count == 1)
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

            return new CSharpTypeNameResolver(resolutions);
        }

        public bool TryResolve(CSharpType type, out string resolvedName, out string? namespaceToImport)
        {
            resolvedName = string.Empty;
            namespaceToImport = null;

            if (!CanAnalyze(type))
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

        private readonly record struct TypeResolution(string Name, string? NamespaceToImport);

        private sealed class TypeReferenceGroup
        {
            private readonly HashSet<string> _fullNames = new(StringComparer.Ordinal);

            public string SimpleName { get; }
            public List<CSharpType> References { get; } = [];

            public TypeReferenceGroup(string simpleName)
            {
                SimpleName = simpleName;
            }

            public void Add(CSharpType type)
            {
                if (_fullNames.Add(GetFullName(type)))
                {
                    References.Add(type);
                }
            }
        }
    }
}
