// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
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
                AddCustomCodeViewRoots(roots, customCodeView, generatedTypeNames, providers, publicOnly: false);
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
                AddCustomCodeViewRoots(roots, customCodeView, generatedTypeNames, providers, publicOnly: true);
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

        private static void AddCustomCodeViewGeneratedTypeRoot(HashSet<string> roots, TypeProvider customCodeView, HashSet<string> generatedTypeNames)
        {
            if (customCodeView is NamedTypeSymbolProvider namedTypeSymbolProvider)
            {
                AddExactMetadataNameMatch(roots, namedTypeSymbolProvider.MetadataName, generatedTypeNames);
                return;
            }

            AddTypeReference(roots, customCodeView.Type, generatedTypeNames);
        }

        private static void AddCustomCodeViewRoots(
            HashSet<string> roots,
            TypeProvider customCodeView,
            HashSet<string> generatedTypeNames,
            IReadOnlyList<TypeProvider> generatedProviders,
            bool publicOnly)
        {
            AddTypeReference(roots, customCodeView.BaseType, generatedTypeNames);
            AddProviderBodyDependencyTypes(roots, customCodeView.SignatureDependencyTypes, generatedTypeNames, includeUnqualifiedSimpleNameReferences: true);
            if (!publicOnly)
            {
                AddProviderBodyDependencyTypes(roots, customCodeView.BodyDependencyTypes, generatedTypeNames);
                AddUniqueExtensionMethodProviderRoots(roots, customCodeView.BodyDependencyTypes, generatedProviders, generatedTypeNames);
                AddCustomCodeViewNamespaceBodyDependencyTypes(roots, customCodeView, generatedTypeNames);
                AddAttributes(roots, customCodeView.Attributes, generatedTypeNames, serializationProviderNamesByType: null, includeArguments: true);
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

        private static void AddUniqueExtensionMethodProviderRoots(
            HashSet<string> roots,
            IReadOnlyList<CSharpType> dependencies,
            IReadOnlyList<TypeProvider> generatedProviders,
            HashSet<string> generatedTypeNames)
        {
            foreach (var dependency in dependencies)
            {
                if (string.IsNullOrEmpty(dependency.Namespace))
                {
                    var match = FindUniqueExtensionMethodProvider(new(dependency.Name, ReceiverType: null), generatedProviders);
                    if (match != null)
                    {
                        AddTypeReference(roots, match.Type, generatedTypeNames);
                    }
                }

                AddUniqueExtensionMethodProviderRoots(roots, dependency.Arguments, generatedProviders, generatedTypeNames);
            }
        }

        private static void AddCustomCodeViewNamespaceBodyDependencyTypes(HashSet<string> roots, TypeProvider customCodeView, HashSet<string> generatedTypeNames)
        {
            var customNamespace = customCodeView.Type.Namespace;
            if (string.IsNullOrEmpty(customNamespace))
            {
                return;
            }

            var customMemberNames = GetCustomCodeViewMemberNames(customCodeView);
            foreach (var dependency in customCodeView.BodyDependencyTypes)
            {
                AddNamespaceBodyDependencyType(roots, dependency, customNamespace, customMemberNames, generatedTypeNames);
            }
        }

        private static void AddNamespaceBodyDependencyType(HashSet<string> roots, CSharpType? dependency, string customNamespace, HashSet<string> customMemberNames, HashSet<string> generatedTypeNames)
        {
            if (dependency == null)
            {
                return;
            }

            var dependencyName = GetProviderTypeName(dependency);
            var simpleDependencyName = StripGenericArity(GetSimpleName(dependencyName));
            if (string.IsNullOrEmpty(dependency.Namespace) &&
                !customMemberNames.Contains(simpleDependencyName))
            {
                for (var namespaceCandidate = customNamespace; namespaceCandidate != null; namespaceCandidate = GetNamespaceName(namespaceCandidate))
                {
                    AddExactMetadataNameMatch(roots, $"{namespaceCandidate}.{dependencyName}", generatedTypeNames);
                    if (!string.Equals(simpleDependencyName, dependencyName, StringComparison.Ordinal))
                    {
                        AddExactMetadataNameMatch(roots, $"{namespaceCandidate}.{simpleDependencyName}", generatedTypeNames);
                    }
                }
            }

            foreach (var argument in dependency.Arguments)
            {
                AddNamespaceBodyDependencyType(roots, argument, customNamespace, customMemberNames, generatedTypeNames);
            }
        }

        private static HashSet<string> GetCustomCodeViewMemberNames(TypeProvider customCodeView)
        {
            var memberNames = new HashSet<string>(StringComparer.Ordinal);
            foreach (var property in customCodeView.Properties)
            {
                memberNames.Add(property.Name);
            }

            foreach (var field in customCodeView.Fields)
            {
                memberNames.Add(field.Name);
            }

            foreach (var method in customCodeView.Methods)
            {
                memberNames.Add(method.Signature.Name);
            }

            return memberNames;
        }

        /// <summary>
        /// Matches internal custom declarations to the generated provider identities whose accessibility
        /// they constrain. Metadata names preserve nested-type identity when available.
        /// </summary>
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
                    AddExactMetadataNameMatch(declarations, namedTypeSymbolProvider.MetadataName, generatedTypeNames);
                }
                else
                {
                    AddTypeReference(declarations, customCodeView.Type, generatedTypeNames);
                }
            }

            return declarations;
        }

        private static void AddExactMetadataNameMatch(HashSet<string> target, string metadataName, HashSet<string> generatedTypeNames)
        {
            var normalizedName = NormalizeMetadataTypeName(metadataName);
            if (!string.IsNullOrEmpty(normalizedName) && generatedTypeNames.Contains(normalizedName))
            {
                target.Add(normalizedName);
            }
        }

        private static string NormalizeMetadataTypeName(string metadataName)
        {
            var arrayIndex = metadataName.IndexOf('[', StringComparison.Ordinal);
            if (arrayIndex > 0)
            {
                metadataName = metadataName.Substring(0, arrayIndex);
            }

            return metadataName;
        }

        private static HashSet<string> GetGeneratedPersistableModelProxyTypeNames(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var proxyTypes = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                if (!provider.ShouldAnalyzeAttributesInReferenceMap)
                {
                    continue;
                }

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

        private static HashSet<string> GetGeneratedPublicTypeDeclarationsFromLastContract(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
            => GetGeneratedPublicTypeDeclarations(providers, generatedTypeNames);

        private static HashSet<string> GetGeneratedTypeDeclarationsByLastContractAccessibility(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> generatedTypeNames,
            TypeSignatureModifiers accessibility)
        {
            var declarations = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                var lastContractView = CodeModelGenerator.Instance.SourceInputModel.FindForTypeInLastContractIncludingInternal(
                    provider.Type.Namespace,
                    GetSimpleName(GetProviderTypeName(provider.Type)),
                    provider.DeclaringTypeProvider is { } declaringTypeProvider
                        ? GetSimpleName(GetProviderTypeName(declaringTypeProvider.Type))
                        : null);
                if (lastContractView?.DeclarationModifiers.HasFlag(accessibility) != true)
                {
                    continue;
                }

                AddTypeReference(declarations, provider.Type, generatedTypeNames);
            }

            return declarations;
        }

        private static HashSet<string> GetGeneratedImplementationInternalTypeDeclarations(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> generatedInternalDeclarations)
        {
            var implementationDeclarations = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                if (!provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Static) &&
                    !IsGeneratedInternalImplementation(provider))
                {
                    continue;
                }

                AddTypeReference(implementationDeclarations, provider.Type, generatedInternalDeclarations);
            }

            return implementationDeclarations;
        }

        private static bool IsGeneratedInternalImplementation(TypeProvider provider)
            => provider.RelativeFilePath.Contains(
                $"{Path.DirectorySeparatorChar}Generated{Path.DirectorySeparatorChar}Internal{Path.DirectorySeparatorChar}",
                StringComparison.Ordinal);

        private static HashSet<string> GetSimpleNames(HashSet<string> names)
        {
            var simpleNames = new HashSet<string>(StringComparer.Ordinal);
            foreach (var name in names)
            {
                simpleNames.Add(StripGenericArity(GetSimpleName(name)));
            }

            return simpleNames;
        }
    }
}
