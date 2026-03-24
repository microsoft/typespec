// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.SourceInput
{
    public class SourceInputModel
    {
        public Compilation? Customization { get; }
        public Compilation? LastContract { get; }

        private readonly Lazy<IReadOnlyDictionary<string, INamedTypeSymbol>> _nameMap;
        private readonly Lazy<IReadOnlyDictionary<string, string>> _namespaceOverrides;

        public SourceInputModel(Compilation? customization, Compilation? lastContract)
        {
            Customization = customization;
            LastContract = lastContract;

            _nameMap = new(PopulateNameMap);
            _namespaceOverrides = new(PopulateNamespaceOverrides);
        }

        private IReadOnlyDictionary<string, INamedTypeSymbol> PopulateNameMap()
        {
            var nameMap = new Dictionary<string, INamedTypeSymbol>();
            if (Customization == null)
            {
                return nameMap;
            }
            IAssemblySymbol assembly = Customization.Assembly;

            foreach (IModuleSymbol module in assembly.Modules)
            {
                foreach (var type in SourceInputHelper.GetSymbols(module.GlobalNamespace))
                {
                    if (type is INamedTypeSymbol namedTypeSymbol && TryGetName(type, out var schemaName))
                    {
                        nameMap.Add(schemaName, namedTypeSymbol);
                    }
                }
            }

            return nameMap;
        }

        public TypeProvider? FindForTypeInCustomization(string ns, string name, string? declaringTypeName = null)
        {
            return FindTypeInCustomization(Customization, ns, name, false, declaringTypeName);
        }

        /// <summary>
        /// Gets the namespace override for a type if one was specified via [assembly: CodeGenNamespace] in custom code.
        /// </summary>
        public string? GetNamespaceOverride(string typeName)
        {
            return _namespaceOverrides.Value.TryGetValue(typeName, out var ns) ? ns : null;
        }

        public TypeProvider? FindForTypeInLastContract(string ns, string name, string? declaringTypeName = null)
        {
            return FindTypeInCompilation(LastContract, ns, name, true, declaringTypeName, includeInternal: false);
        }

        private TypeProvider? FindTypeInCompilation(
            Compilation? compilation,
            string ns,
            string name,
            bool includeReferencedAssemblies,
            string? declaringTypeName,
            bool includeInternal = true)
        {
            if (compilation == null)
            {
                return null;
            }
            string fullyQualifiedMetadataName = GetFullyQualifiedMetadataName(ns, name, declaringTypeName);

            var type = FindNamedTypeSymbol(compilation, includeReferencedAssemblies, fullyQualifiedMetadataName);
            if (!includeInternal && type != null && type.DeclaredAccessibility != Accessibility.Public)
            {
                type = null;
            }

            return type != null ? new NamedTypeSymbolProvider(type, compilation) : null;
        }

        private static INamedTypeSymbol? FindNamedTypeSymbol(Compilation compilation, bool includeReferencedAssemblies, string fullyQualifiedMetadataName)
            => includeReferencedAssemblies
                ? compilation.GetTypeByMetadataName(fullyQualifiedMetadataName)
                : compilation.Assembly.GetTypeByMetadataName(fullyQualifiedMetadataName);

        private static string GetFullyQualifiedMetadataName(string ns, string name, string? declaringTypeName)
            => declaringTypeName != null
                ? $"{ns}.{declaringTypeName}+{name}"
                : $"{ns}.{name}";

        private TypeProvider? FindTypeInCustomization(
            Compilation? compilation,
            string ns,
            string name,
            bool includeReferencedAssemblies,
            string? declaringTypeName = null)
        {
            if (compilation == null)
            {
                return null;
            }

            var fullyQualifiedMetadataName = GetFullyQualifiedMetadataName(ns, name, declaringTypeName);

            // Either find by the CodeGenType attribute or by the actual type name.
            if (!_nameMap.Value.TryGetValue(name, out var type))
            {
                type = FindNamedTypeSymbol(compilation, includeReferencedAssemblies, fullyQualifiedMetadataName);
            }

            return type != null ? new NamedTypeSymbolProvider(type, compilation) : null;
        }

        private IReadOnlyDictionary<string, string> PopulateNamespaceOverrides()
        {
            var overrides = new Dictionary<string, string>();
            if (Customization == null)
            {
                return overrides;
            }

            foreach (var attribute in Customization.Assembly.GetAttributes())
            {
                if (attribute.AttributeClass?.Name == CodeGenAttributes.CodeGenNamespaceAttributeName
                    && attribute.ConstructorArguments.Length >= 2
                    && attribute.ConstructorArguments[0].Value is string typeName
                    && attribute.ConstructorArguments[1].Value is string @namespace)
                {
                    overrides[typeName] = @namespace;
                }
            }

            return overrides;
        }

        private bool TryGetName(ISymbol symbol, [NotNullWhen(true)] out string? name)
        {
            name = null;

            foreach (var attribute in symbol.GetAttributes())
            {
                INamedTypeSymbol? type = attribute.AttributeClass;
                while (type != null)
                {
                    if (type.ToDisplayString(SymbolDisplayFormat.MinimallyQualifiedFormat) == CodeGenAttributes.CodeGenTypeAttributeName)
                    {
                        if (attribute?.ConstructorArguments.Length > 0)
                        {
                            name = attribute.ConstructorArguments[0].Value as string;
                            break;
                        }
                    }

                    type = type.BaseType;
                }
            }

            return name != null;
        }
    }
}
