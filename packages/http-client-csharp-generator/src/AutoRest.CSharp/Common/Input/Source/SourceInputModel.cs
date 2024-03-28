// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using AutoRest.CSharp.AutoRest.Plugins;
using System.Threading.Tasks;
using AutoRest.CSharp.Generation.Types;
using Azure.Core;
using Microsoft.Build.Construction;
using Microsoft.CodeAnalysis;
using NuGet.Configuration;
using AutoRest.CSharp.Common.Input;

namespace AutoRest.CSharp.Input.Source
{
    public class SourceInputModel
    {
        private readonly CompilationInput? _existingCompilation;
        private readonly CodeGenAttributes _codeGenAttributes;
        private readonly Dictionary<string, INamedTypeSymbol> _nameMap = new Dictionary<string, INamedTypeSymbol>(StringComparer.OrdinalIgnoreCase);

        public Compilation Customization { get; }
        public Compilation? PreviousContract { get; }

        public SourceInputModel(Compilation customization, CompilationInput? existingCompilation = null)
        {
            Customization = customization;
            PreviousContract = LoadBaselineContract().GetAwaiter().GetResult();
            _existingCompilation = existingCompilation;

            _codeGenAttributes = new CodeGenAttributes(customization);

            IAssemblySymbol assembly = Customization.Assembly;

            foreach (IModuleSymbol module in assembly.Modules)
            {
                foreach (var type in SourceInputHelper.GetSymbols(module.GlobalNamespace))
                {
                    if (type is INamedTypeSymbol namedTypeSymbol && TryGetName(type, out var schemaName))
                    {
                        _nameMap.Add(schemaName, namedTypeSymbol);
                    }
                }
            }
        }

        public IReadOnlyList<string>? GetServiceVersionOverrides()
        {
            var osvAttributeType = Customization.GetTypeByMetadataName(typeof(CodeGenOverrideServiceVersionsAttribute).FullName!)!;
            var osvAttribute = Customization.Assembly.GetAttributes()
                .FirstOrDefault(a => SymbolEqualityComparer.Default.Equals(a.AttributeClass, osvAttributeType));

            return osvAttribute?.ConstructorArguments[0].Values.Select(v => v.Value).OfType<string>().ToList();
        }

        public ModelTypeMapping? CreateForModel(INamedTypeSymbol? symbol)
        {
            if (symbol == null)
                return null;

            return new ModelTypeMapping(_codeGenAttributes, symbol);
        }

        internal IMethodSymbol? FindMethod(string namespaceName, string typeName, string methodName, IEnumerable<CSharpType> parameters)
        {
            return _existingCompilation?.FindMethod(namespaceName, typeName, methodName, parameters);
        }

        public INamedTypeSymbol? FindForType(string ns, string name, bool includeArmCore = false)
        {
            var fullyQualifiedMetadataName = $"{ns}.{name}";
            if (!_nameMap.TryGetValue(name, out var type) &&
                !_nameMap.TryGetValue(fullyQualifiedMetadataName, out type))
            {
                type = includeArmCore ? Customization.GetTypeByMetadataName(fullyQualifiedMetadataName) : Customization.Assembly.GetTypeByMetadataName(fullyQualifiedMetadataName);
            }

            return type;
        }

        internal bool TryGetClientSourceInput(INamedTypeSymbol type, [NotNullWhen(true)] out ClientSourceInput? clientSourceInput)
        {
            foreach (var attribute in type.GetAttributes())
            {
                var attributeType = attribute.AttributeClass;
                while (attributeType != null)
                {
                    if (SymbolEqualityComparer.Default.Equals(attributeType, _codeGenAttributes.CodeGenClientAttribute))
                    {
                        INamedTypeSymbol? parentClientType = null;
                        foreach ((var argumentName, TypedConstant constant) in attribute.NamedArguments)
                        {
                            if (argumentName == nameof(CodeGenClientAttribute.ParentClient))
                            {
                                parentClientType = (INamedTypeSymbol?)constant.Value;
                            }
                        }

                        clientSourceInput = new ClientSourceInput(parentClientType);
                        return true;
                    }

                    attributeType = attributeType.BaseType;
                }
            }

            clientSourceInput = null;
            return false;
        }

        private bool TryGetName(ISymbol symbol, [NotNullWhen(true)] out string? name)
        {
            name = null;

            foreach (var attribute in symbol.GetAttributes())
            {
                var type = attribute.AttributeClass;
                while (type != null)
                {
                    if (SymbolEqualityComparer.Default.Equals(type, _codeGenAttributes.CodeGenTypeAttribute))
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
            // This can only be used for Mgmt now, because there are custom/hand-written code in HLC can't be loaded into CsharpType such as generic methods
            if (!Configuration.AzureArm)
                return null;

            string fullPath;
            string projectFilePath = Path.GetFullPath(Path.Combine(Configuration.AbsoluteProjectFolder, $"{Configuration.Namespace}.csproj"));
            if (!File.Exists(projectFilePath))
                return null;

            var baselineVersion = ProjectRootElement.Open(projectFilePath).Properties.SingleOrDefault(p => p.Name == "ApiCompatVersion")?.Value;

            if (baselineVersion is not null)
            {
                var nugetGlobalPackageFolder = SettingsUtility.GetGlobalPackagesFolder(new NullSettings());
                var nugetFolder = Path.Combine(nugetGlobalPackageFolder, Configuration.Namespace.ToLowerInvariant(), baselineVersion, "lib", "netstandard2.0");
                fullPath = Path.Combine(nugetFolder, $"{Configuration.Namespace}.dll");
                if (File.Exists(fullPath))
                {
                    return await GeneratedCodeWorkspace.CreatePreviousContractFromDll(Path.Combine(nugetFolder, $"{Configuration.Namespace}.xml"), fullPath);
                }
                else
                {
                    throw new InvalidOperationException($"Can't find Baseline contract assembly ({Configuration.Namespace}@{baselineVersion}) from Nuget Global Package Folder at {fullPath}. " +
                        $"Please make sure the baseline nuget package has been installed properly");
                }
            }
            return null;
        }
    }
}
