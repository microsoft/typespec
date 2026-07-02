// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator
{
    internal static partial class ProviderReferenceMapAnalyzer
    {
        private static HashSet<string> GetCustomCodeGeneratedTypeRoots(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            foreach (var customCodeView in GetCustomCodeViews(providers))
            {
                AddCustomCodeViewGeneratedTypeRoot(roots, customCodeView, generatedTypeNames);
                AddCustomCodeViewRoots(roots, customCodeView, generatedTypeNames, publicOnly: false);
            }

            return roots;
        }

        private static HashSet<string> GetCustomCodePublicGeneratedTypeRoots(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            foreach (var customCodeView in GetCustomCodeViews(providers))
            {
                if (!customCodeView.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                {
                    continue;
                }

                AddCustomCodeViewGeneratedTypeRoot(roots, customCodeView, generatedTypeNames);
                AddCustomCodeViewRoots(roots, customCodeView, generatedTypeNames, publicOnly: true);
            }

            return roots;
        }

        private static IEnumerable<TypeProvider> GetCustomCodeViews(IReadOnlyList<TypeProvider> providers)
        {
            var visited = new HashSet<string>(StringComparer.Ordinal);
            var modelFactoryCustomCodeView = CodeModelGenerator.Instance.OutputLibrary.ModelFactory.Value.CustomCodeView;
            if (modelFactoryCustomCodeView != null && visited.Add(GetCustomCodeViewIdentity(modelFactoryCustomCodeView)))
            {
                yield return modelFactoryCustomCodeView;
            }

            foreach (var provider in providers)
            {
                var customCodeView = provider.CustomCodeView;
                if (customCodeView == null || !visited.Add(GetCustomCodeViewIdentity(customCodeView)))
                {
                    continue;
                }

                yield return customCodeView;
            }

            foreach (var customTypeProvider in CodeModelGenerator.Instance.SourceInputModel.GetCustomizationTypeProviders())
            {
                if (visited.Add(GetCustomCodeViewIdentity(customTypeProvider)))
                {
                    yield return customTypeProvider;
                }
            }
        }

        private static string GetCustomCodeViewIdentity(TypeProvider customCodeView) =>
            customCodeView is NamedTypeSymbolProvider namedTypeSymbolProvider
                ? namedTypeSymbolProvider.MetadataName
                : GetProviderTypeName(customCodeView.Type);

        private static void AddCustomRequestHeaderExtensionsRoot(HashSet<string> roots, IReadOnlyList<TypeProvider> providers, HashSet<string> nodes)
        {
            // TODO: Resolve body-level SetDelimited extension calls to PipelineRequestHeadersExtensions so this can be a normal type edge.
            if (!HasCustomRequestHeaderExtensionsReference(providers))
            {
                return;
            }

            AddMatchingNamesWithSimpleNameSuffix(roots, "RequestHeaderExtensions", nodes);
            AddMatchingNamesWithSimpleNameSuffix(roots, "RequestHeadersExtensions", nodes);
        }

        private static void AddCustomCodeExtensionRoots(HashSet<string> roots, IReadOnlyList<TypeProvider> providers, HashSet<string> nodes)
        {
            foreach (var customCodeView in GetCustomCodeViews(providers))
            {
                AddMatchingName(roots, $"{GetCustomCodeViewSimpleName(customCodeView)}Extensions", nodes);
            }
        }

        private static string GetCustomCodeViewSimpleName(TypeProvider customCodeView) =>
            customCodeView is NamedTypeSymbolProvider namedTypeSymbolProvider
                ? namedTypeSymbolProvider.MetadataSimpleName
                : customCodeView.Type.Name;

        private static void AddCustomCodeViewGeneratedTypeRoot(HashSet<string> roots, TypeProvider customCodeView, HashSet<string> generatedTypeNames)
        {
            if (customCodeView is NamedTypeSymbolProvider namedTypeSymbolProvider)
            {
                AddMatchingName(roots, namedTypeSymbolProvider.MetadataSimpleName, generatedTypeNames);
                return;
            }

            AddTypeReference(roots, customCodeView.Type, generatedTypeNames);
        }

        private static void AddCustomizationBackedExtensionRoots(HashSet<string> roots, HashSet<string> nodes)
        {
            foreach (var node in nodes)
            {
                var simpleName = GetSimpleName(node);
                if (!simpleName.EndsWith("Extensions", StringComparison.Ordinal))
                {
                    continue;
                }

                var namespaceName = GetNamespaceName(node);
                if (namespaceName == null)
                {
                    continue;
                }

                var customTypeName = simpleName.Substring(0, simpleName.Length - "Extensions".Length);
                if (CodeModelGenerator.Instance.SourceInputModel.FindForTypeInCustomization(namespaceName, customTypeName) != null)
                {
                    roots.Add(node);
                }
            }
        }

        private static void AddCustomCodeViewRoots(HashSet<string> roots, TypeProvider customCodeView, HashSet<string> generatedTypeNames, bool publicOnly)
        {
            AddTypeReference(roots, customCodeView.BaseType, generatedTypeNames);
            AddProviderBodyDependencyTypes(roots, customCodeView.SignatureDependencyTypes, generatedTypeNames, includeSimpleNameReferences: true);
            if (!publicOnly)
            {
                AddAttributes(roots, customCodeView.Attributes, generatedTypeNames, serializationProviderNamesByType: null, includeArguments: true);
                AddMatchingName(roots, $"{GetCustomCodeViewSimpleName(customCodeView)}Extensions", generatedTypeNames);
            }

            foreach (var implementedType in customCodeView.Implements)
            {
                AddTypeReference(roots, implementedType, generatedTypeNames);
            }

            foreach (var constructor in customCodeView.Constructors)
            {
                if (publicOnly && !IsPublic(constructor.Signature.Modifiers))
                {
                    continue;
                }

                AddSignatureReferences(roots, constructor.Signature, generatedTypeNames, serializationProviderNamesByType: null, includeAttributes: !publicOnly);
            }

            foreach (var method in customCodeView.Methods)
            {
                if (publicOnly && !IsPublic(method.Signature.Modifiers))
                {
                    continue;
                }

                AddSignatureReferences(roots, method.Signature, generatedTypeNames, serializationProviderNamesByType: null, includeAttributes: !publicOnly);
            }

            foreach (var property in customCodeView.Properties)
            {
                if (publicOnly && !IsPublic(property.Modifiers))
                {
                    continue;
                }

                AddTypeReference(roots, property.Type, generatedTypeNames);
                AddTypeReference(roots, property.ExplicitInterface, generatedTypeNames);
                if (!publicOnly)
                {
                    AddAttributes(roots, property.Attributes, generatedTypeNames, serializationProviderNamesByType: null, includeArguments: true);
                }
            }

            foreach (var field in customCodeView.Fields)
            {
                if (publicOnly && !IsPublic(field.Modifiers))
                {
                    continue;
                }

                AddTypeReference(roots, field.Type, generatedTypeNames);
                if (!publicOnly)
                {
                    AddAttributes(roots, field.Attributes, generatedTypeNames, serializationProviderNamesByType: null, includeArguments: true);
                }
            }
        }

        private static HashSet<string> GetApiBaselineGeneratedTypeRoots(HashSet<string> generatedTypeNames)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            var projectDirectory = CodeModelGenerator.Instance.Configuration.ProjectDirectory;
            if (string.IsNullOrEmpty(projectDirectory))
            {
                return roots;
            }

            var apiDirectory = Path.GetFullPath(Path.Combine(projectDirectory, "..", "api"));
            if (!Directory.Exists(apiDirectory))
            {
                return roots;
            }

            var apiText = string.Join("\n", Directory.GetFiles(apiDirectory, "*.cs", SearchOption.AllDirectories).Select(File.ReadAllText));
            var apiDeclaredTypeNames = GetApiDeclaredTypeNames(apiText);
            foreach (var fullName in generatedTypeNames)
            {
                var simpleName = StripGenericArity(GetSimpleName(fullName));
                var normalizedFullName = StripGenericArity(fullName);
                if (!ContainsApiTypeReference(apiText, apiDeclaredTypeNames, normalizedFullName, simpleName))
                {
                    continue;
                }

                roots.Add(fullName);
            }

            return roots;
        }

        private static HashSet<string> GetApiDeclaredTypeNames(string apiText)
        {
            var declaredTypeNames = new HashSet<string>(StringComparer.Ordinal);
            string? currentNamespace = null;
            foreach (var line in apiText.Split('\n'))
            {
                var namespaceMatch = Regex.Match(line, @"^namespace\s+([\w.]+)\s*\{?\s*$");
                if (namespaceMatch.Success)
                {
                    currentNamespace = namespaceMatch.Groups[1].Value;
                    continue;
                }

                if (currentNamespace == null)
                {
                    continue;
                }

                var declarationMatch = Regex.Match(line, @"^    \S.*?\b(class|struct|interface|enum)\s+([A-Za-z_][A-Za-z0-9_]*)(?!\s*<)(?!\w)");
                if (declarationMatch.Success)
                {
                    declaredTypeNames.Add($"{currentNamespace}.{declarationMatch.Groups[2].Value}");
                }
            }

            return declaredTypeNames;
        }

        private static bool ContainsApiTypeReference(string apiText, HashSet<string> apiDeclaredTypeNames, string fullName, string simpleName)
        {
            var fullNamePattern = $@"(?<![\w.]){Regex.Escape(fullName)}(?!\s*<)(?![\w.])";
            if (Regex.IsMatch(apiText, fullNamePattern))
            {
                return true;
            }

            return apiDeclaredTypeNames.Contains(fullName);
        }

        private static HashSet<string> GetCustomCodeInternalGeneratedTypeDeclarations(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var declarations = new HashSet<string>(StringComparer.Ordinal);
            foreach (var customCodeView in GetCustomCodeViews(providers))
            {
                if (!customCodeView.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal))
                {
                    continue;
                }

                if (customCodeView is NamedTypeSymbolProvider namedTypeSymbolProvider)
                {
                    AddMatchingName(declarations, namedTypeSymbolProvider.MetadataSimpleName, generatedTypeNames);
                }
                else
                {
                    AddTypeReference(declarations, customCodeView.Type, generatedTypeNames);
                }
            }

            return declarations;
        }

        private static HashSet<string> GetGeneratedPersistableModelProxyTypeNames(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var proxyTypes = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                if (provider.Attributes.Any(static attribute => IsAttributeNamed(attribute, "PersistableModelProxy")))
                {
                    AddTypeReference(proxyTypes, provider.Type, generatedTypeNames);
                }
            }

            return proxyTypes;
        }

        private static HashSet<string> GetGeneratedInternalTypeDeclarations(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
            => GetGeneratedTypeDeclarationsByLastContractAccessibility(providers, generatedTypeNames, TypeSignatureModifiers.Internal);

        private static HashSet<string> GetGeneratedPublicTypeDeclarations(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
            => GetGeneratedTypeDeclarationsByLastContractAccessibility(providers, generatedTypeNames, TypeSignatureModifiers.Public);

        private static HashSet<string> GetGeneratedTypeDeclarationsByLastContractAccessibility(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> generatedTypeNames,
            TypeSignatureModifiers accessibility)
        {
            var declarations = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                if (provider.LastContractView?.DeclarationModifiers.HasFlag(accessibility) != true)
                {
                    continue;
                }

                AddTypeReference(declarations, provider.Type, generatedTypeNames);
            }

            return declarations;
        }

        private static HashSet<string> GetGeneratedImplementationInternalTypeDeclarations(HashSet<string> generatedInternalDeclarations)
        {
            var implementationDeclarations = new HashSet<string>(StringComparer.Ordinal);
            foreach (var name in generatedInternalDeclarations)
            {
                if (GetSimpleName(name).StartsWith("Internal", StringComparison.Ordinal))
                {
                    implementationDeclarations.Add(name);
                }
            }

            return implementationDeclarations;
        }

        private static HashSet<string> GetSimpleNames(HashSet<string> names)
        {
            var simpleNames = new HashSet<string>(StringComparer.Ordinal);
            foreach (var name in names)
            {
                simpleNames.Add(GetSimpleName(name));
            }

            return simpleNames;
        }
    }
}
