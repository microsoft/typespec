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

        /// <summary>
        /// The set of intentional, already-accepted breaking changes recorded in the ApiCompat
        /// baseline file for this library. The backward-compatibility system consults this to avoid
        /// regenerating compatibility shims for members whose removal has already been accepted.
        /// </summary>
        public ApiCompatBaseline ApiCompatBaseline { get; }

        private readonly Lazy<IReadOnlyDictionary<string, INamedTypeSymbol>> _nameMap;
        private readonly Lazy<IReadOnlyList<TypeProvider>> _customizationTypeProviders;

        public SourceInputModel(Compilation? customization, Compilation? lastContract)
            : this(customization, lastContract, ApiCompatBaseline.Empty)
        {
        }

        public SourceInputModel(Compilation? customization, Compilation? lastContract, ApiCompatBaseline apiCompatBaseline)
        {
            Customization = customization;
            LastContract = lastContract;
            ApiCompatBaseline = apiCompatBaseline ?? ApiCompatBaseline.Empty;

            _nameMap = new(PopulateNameMap);
            _customizationTypeProviders = new(PopulateCustomizationTypeProviders);
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

        public TypeProvider? FindForTypeInCustomization(string ns, string name, string? declaringTypeName = null, bool includeReferencedAssemblies = false)
        {
            return FindTypeInCustomization(Customization, ns, name, includeReferencedAssemblies, declaringTypeName);
        }

        public TypeProvider? FindForTypeInLastContract(string ns, string name, string? declaringTypeName = null)
        {
            return FindTypeInCustomization(LastContract, ns, name, true, declaringTypeName, includeInternal: false);
        }

        internal TypeProvider? FindForTypeInLastContractIncludingInternal(string ns, string name, string? declaringTypeName = null)
        {
            return FindTypeInCustomization(LastContract, ns, name, true, declaringTypeName);
        }

        private IReadOnlyList<TypeProvider> PopulateCustomizationTypeProviders()
        {
            var providers = new List<TypeProvider>();
            if (Customization == null)
            {
                return providers;
            }

            foreach (IModuleSymbol module in Customization.Assembly.Modules)
            {
                foreach (var type in SourceInputHelper.GetSymbols(module.GlobalNamespace))
                {
                    if (type is INamedTypeSymbol namedTypeSymbol)
                    {
                        providers.Add(new NamedTypeSymbolProvider(namedTypeSymbol, Customization));
                    }
                }
            }

            return providers;
        }

        internal IReadOnlyList<TypeProvider> GetCustomizationTypeProviders() => _customizationTypeProviders.Value;

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
            string? declaringTypeName = null,
            bool includeInternal = true)
        {
            if (compilation == null)
            {
                return null;
            }

            var fullyQualifiedMetadataName = GetFullyQualifiedMetadataName(ns, name, declaringTypeName);

            // Either find by the CodeGenType attribute in customization or by the actual type name.
            INamedTypeSymbol? type = null;
            if (ReferenceEquals(compilation, Customization) &&
                _nameMap.Value.TryGetValue(name, out var mappedType) &&
                IsContainingTypeMatch(mappedType, ns, declaringTypeName))
            {
                type = mappedType;
            }

            if (type == null)
            {
                type = FindNamedTypeSymbol(compilation, includeReferencedAssemblies, fullyQualifiedMetadataName);
                type ??= FindNestedNamedTypeSymbol(compilation, ns, name, declaringTypeName);
            }

            if (!includeInternal && type != null && type.DeclaredAccessibility != Accessibility.Public)
            {
                type = null;
            }

            return type != null ? new NamedTypeSymbolProvider(type, compilation) : null;
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

        private static INamedTypeSymbol? FindNestedNamedTypeSymbol(Compilation compilation, string ns, string name, string? declaringTypeName)
        {
            if (declaringTypeName == null)
            {
                return null;
            }

            foreach (var module in compilation.Assembly.Modules)
            {
                foreach (var type in SourceInputHelper.GetSymbols(module.GlobalNamespace))
                {
                    if (type is not INamedTypeSymbol namedTypeSymbol ||
                        !string.Equals(namedTypeSymbol.Name, name, StringComparison.Ordinal) ||
                        !string.Equals(GetContainingTypeName(namedTypeSymbol), declaringTypeName, StringComparison.Ordinal) ||
                        !string.Equals(namedTypeSymbol.ContainingNamespace.ToDisplayString(), ns, StringComparison.Ordinal))
                    {
                        continue;
                    }

                    return namedTypeSymbol;
                }
            }

            return null;
        }

        private static string? GetContainingTypeName(INamedTypeSymbol symbol)
        {
            if (symbol.ContainingType is null)
            {
                return null;
            }

            var parentName = GetContainingTypeName(symbol.ContainingType);
            return parentName is null
                ? symbol.ContainingType.MetadataName
                : $"{parentName}+{symbol.ContainingType.MetadataName}";
        }

        private static bool IsContainingTypeMatch(INamedTypeSymbol symbol, string ns, string? declaringTypeName)
            => string.Equals(GetContainingTypeName(symbol), declaringTypeName, StringComparison.Ordinal);
    }
}
