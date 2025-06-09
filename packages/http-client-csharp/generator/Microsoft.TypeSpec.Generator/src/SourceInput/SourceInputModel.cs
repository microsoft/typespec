// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Build.Construction;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Providers;
using NuGet.Configuration;

namespace Microsoft.TypeSpec.Generator.SourceInput
{
    public class SourceInputModel
    {
        public Compilation? Customization { get; }
        public Compilation? LastContract { get; }

        private readonly Lazy<IReadOnlyDictionary<string, INamedTypeSymbol>> _nameMap;

        public SourceInputModel(Compilation? customization, Compilation? lastContract)
        {
            Customization = customization;
            LastContract = lastContract;

            _nameMap = new(PopulateNameMap);
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
            return FindTypeInCompilation(Customization, ns, name, false, declaringTypeName);
        }

        public TypeProvider? FindForTypeInLastContract(string ns, string name, string? declaringTypeName = null)
        {
            return FindTypeInCompilation(LastContract, ns, name, true, declaringTypeName);
        }

        private TypeProvider? FindTypeInCompilation(
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

            var fullyQualifiedMetadataName = declaringTypeName != null
                ? $"{ns}.{declaringTypeName}+{name}"
                : $"{ns}.{name}";
            if (!_nameMap.Value.TryGetValue(name, out var type) &&
                !_nameMap.Value.TryGetValue(fullyQualifiedMetadataName, out type))
            {
                type = includeReferencedAssemblies
                    ? compilation.GetTypeByMetadataName(fullyQualifiedMetadataName)
                    : compilation.Assembly.GetTypeByMetadataName(fullyQualifiedMetadataName);
            }

            return type != null ? new NamedTypeSymbolProvider(type) : null;
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
