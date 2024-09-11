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
using Microsoft.Generator.CSharp.Providers;
using NuGet.Configuration;

namespace Microsoft.Generator.CSharp.SourceInput
{
    public class SourceInputModel
    {
        public Compilation? Customization { get; }
        private Lazy<Compilation?> _previousContract;
        public Compilation? PreviousContract => _previousContract.Value;

        private readonly Lazy<IReadOnlyDictionary<string, INamedTypeSymbol>> _nameMap;

        public SourceInputModel(Compilation? customization)
        {
            Customization = customization;
            _previousContract = new(() => LoadBaselineContract().GetAwaiter().GetResult());

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

        public TypeProvider? FindForType(string ns, string name)
        {
            if (Customization == null)
            {
                return null;
            }
            var fullyQualifiedMetadataName = $"{ns}.{name}";
            if (!_nameMap.Value.TryGetValue(name, out var type) &&
                !_nameMap.Value.TryGetValue(fullyQualifiedMetadataName, out type))
            {
                type = Customization.Assembly.GetTypeByMetadataName(fullyQualifiedMetadataName);
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

        private async Task<Compilation?> LoadBaselineContract()
        {
            string fullPath;
            string projectFilePath = Path.GetFullPath(Path.Combine(CodeModelPlugin.Instance.Configuration.ProjectDirectory, $"{CodeModelPlugin.Instance.Configuration.RootNamespace}.csproj"));
            if (!File.Exists(projectFilePath))
                return null;

            var baselineVersion = ProjectRootElement.Open(projectFilePath).Properties.SingleOrDefault(p => p.Name == "ApiCompatVersion")?.Value;

            if (baselineVersion is not null)
            {
                var nugetGlobalPackageFolder = SettingsUtility.GetGlobalPackagesFolder(new NullSettings());
                var nugetFolder = Path.Combine(nugetGlobalPackageFolder, CodeModelPlugin.Instance.Configuration.RootNamespace.ToLowerInvariant(), baselineVersion, "lib", "netstandard2.0");
                fullPath = Path.Combine(nugetFolder, $"{CodeModelPlugin.Instance.Configuration.RootNamespace}.dll");
                if (File.Exists(fullPath))
                {
                    return await GeneratedCodeWorkspace.CreatePreviousContractFromDll(Path.Combine(nugetFolder, $"{CodeModelPlugin.Instance.Configuration.RootNamespace}.xml"), fullPath);
                }
                else
                {
                    throw new InvalidOperationException($"Can't find Baseline contract assembly ({CodeModelPlugin.Instance.Configuration.RootNamespace}@{baselineVersion}) from Nuget Global Package Folder at {fullPath}. " +
                        $"Please make sure the baseline nuget package has been installed properly");
                }
            }
            return null;
        }
    }
}
