// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator
{
    internal static class ProviderReferenceMapAnalyzer
    {
        private static ProviderReferenceMapResult? _latestResult;
        private static readonly ConditionalWeakTable<HashSet<string>, Dictionary<string, string[]>> _simpleNameLookupCache = new();
        private static TypeProvider? _preWriteModelFactory;
        private static MethodProvider[]? _preWriteModelFactoryMethods;

        public static ProviderReferenceMapResult? LatestResult => _latestResult;
        public static bool PreWriteAccessibilityApplied { get; private set; }

        public static bool ShouldWriteProvider(TypeProvider provider) =>
            _latestResult?.RemoveCandidates.Contains(GetProviderTypeName(provider.Type)) != true;

        public static void ResetPreWriteAccessibility()
        {
            RestorePreWriteModelFactoryMethods();
            _latestResult = null;
            PreWriteAccessibilityApplied = false;
        }

        public static void ApplyPreWriteAccessibility(IReadOnlyList<TypeProvider> providers)
        {
            PreWriteAccessibilityApplied = false;
            if (Configuration.UnreferencedTypesHandling == Configuration.UnreferencedTypesHandlingOption.KeepAll)
            {
                return;
            }

            var (internalizeCandidates, publicizeCandidates) = GetPreWriteAccessibilityCandidates(providers);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                var providerName = GetProviderTypeName(provider.Type);
                if (internalizeCandidates.Contains(providerName))
                {
                    provider.PreserveXmlDocs();
                    provider.Update(modifiers: MakeInternal(provider.DeclarationModifiers));
                }
                else if (publicizeCandidates.Contains(providerName))
                {
                    provider.Update(modifiers: MakePublic(provider.DeclarationModifiers));
                }
            }

            RemoveMethodsFromModelFactory(GetSimpleNames(internalizeCandidates));
            PreWriteAccessibilityApplied = true;
        }

        public static void RestorePreWriteModelFactoryMethods()
        {
            if (_preWriteModelFactory == null || _preWriteModelFactoryMethods == null)
            {
                return;
            }

            _preWriteModelFactory.Update(methods: _preWriteModelFactoryMethods);
            _preWriteModelFactory = null;
            _preWriteModelFactoryMethods = null;
        }

        public static void Analyze(IReadOnlyList<TypeProvider> providers)
        {
            var generatedProviders = GetGeneratedProviders(providers);
            var graph = BuildGraph(generatedProviders);
            var publicGraph = BuildGraph(generatedProviders, publicOnly: true);

            var customPublicRoots = GetCustomCodePublicGeneratedTypeRoots(generatedProviders, graph.Nodes);
            var apiBaselineGeneratedTypeRoots = GetApiBaselineGeneratedTypeRoots(graph.Nodes);
            customPublicRoots.UnionWith(apiBaselineGeneratedTypeRoots);
            var generatedPublicDeclarations = GetGeneratedPublicTypeDeclarations(generatedProviders, graph.Nodes);
            customPublicRoots.UnionWith(generatedPublicDeclarations);
            var customCodeRemovalRoots = GetCustomCodeGeneratedTypeRoots(generatedProviders, graph.Nodes);
            var customRemovalRoots = new HashSet<string>(customCodeRemovalRoots, StringComparer.Ordinal);
            customRemovalRoots.UnionWith(apiBaselineGeneratedTypeRoots);
            customRemovalRoots.UnionWith(generatedPublicDeclarations);
            var customInternalDeclarations = GetCustomCodeInternalGeneratedTypeDeclarations(generatedProviders, graph.Nodes);
            var generatedInternalDeclarations = GetGeneratedInternalTypeDeclarations(generatedProviders, graph.Nodes);

            // Helper types are rooted after an initial reachability pass so unused infrastructure
            // such as change-tracking dictionaries can still be removed when no reachable type needs them.
            var generatedDiscriminatorBaseNames = GetGeneratedPersistableModelProxyTypeNames(generatedProviders, publicGraph.Nodes);
            var (internalizeCandidates, publicizeCandidates, _) = GetAccessibilityCandidates(
                providers,
                generatedProviders,
                graph,
                publicGraph,
                customPublicRoots,
                customInternalDeclarations,
                generatedInternalDeclarations,
                generatedDiscriminatorBaseNames);

            // Body-only generated dependencies are needed to avoid deleting helper files, but they do
            // not contribute to public API reachability for internalization.
            AddGeneratedBodyReferences(providers, graph);
            var removeCandidates = GetRemovalCandidates(
                providers,
                generatedProviders,
                graph,
                customRemovalRoots,
                generatedDiscriminatorBaseNames);

            _latestResult = new ProviderReferenceMapResult(
                internalizeCandidates,
                publicizeCandidates,
                removeCandidates);
            RemoveMethodsFromModelFactory(GetSimpleNames(removeCandidates));
        }

        private static (HashSet<string> InternalizeCandidates, HashSet<string> PublicizeCandidates) GetPreWriteAccessibilityCandidates(IReadOnlyList<TypeProvider> providers)
        {
            var generatedProviders = GetGeneratedProviders(providers);
            var graph = BuildGraph(generatedProviders);
            var publicGraph = BuildGraph(generatedProviders, publicOnly: true);
            var customPublicRoots = GetCustomCodePublicGeneratedTypeRoots(generatedProviders, graph.Nodes);
            var apiBaselineGeneratedTypeRoots = GetApiBaselineGeneratedTypeRoots(graph.Nodes);
            customPublicRoots.UnionWith(apiBaselineGeneratedTypeRoots);
            var generatedPublicDeclarations = GetGeneratedPublicTypeDeclarations(generatedProviders, graph.Nodes);
            customPublicRoots.UnionWith(generatedPublicDeclarations);
            var customInternalDeclarations = GetCustomCodeInternalGeneratedTypeDeclarations(generatedProviders, graph.Nodes);
            var generatedInternalDeclarations = GetGeneratedInternalTypeDeclarations(generatedProviders, graph.Nodes);
            var generatedDiscriminatorBaseNames = new HashSet<string>(StringComparer.Ordinal);

            var (internalizeCandidates, publicizeCandidates, _) = GetAccessibilityCandidates(
                providers,
                generatedProviders,
                graph,
                publicGraph,
                customPublicRoots,
                customInternalDeclarations,
                generatedInternalDeclarations,
                generatedDiscriminatorBaseNames);

            return (internalizeCandidates, publicizeCandidates);
        }

        private static (HashSet<string> InternalizeCandidates, HashSet<string> PublicizeCandidates, HashSet<string> InternalizeHelperRoots) GetAccessibilityCandidates(
            IReadOnlyList<TypeProvider> providers,
            IReadOnlyList<TypeProvider> generatedProviders,
            ProviderReferenceGraph graph,
            ProviderReferenceGraph publicGraph,
            HashSet<string> customPublicRoots,
            HashSet<string> customInternalDeclarations,
            HashSet<string> generatedInternalDeclarations,
            HashSet<string> generatedDiscriminatorBaseNames)
        {
            var internalizeReferences = CloneReferences(publicGraph.References);
            var internalizeRoots = GetRootNames(providers, graph.Nodes, helperRoots: [], includeModelFactory: false, includeAdditionalRoots: true, includeUnionVariantRoots: false, publicClientRootsOnly: true);
            if (ShouldUseUnionVariantFallbackRoots())
            {
                AddUnionVariantRoots(internalizeRoots, providers, graph.Nodes);
            }

            var generatedPublicReachable = GetReachableTypes(internalizeRoots, internalizeReferences);
            AddDerivedModelReferences(providers, publicGraph.Nodes, internalizeReferences, generatedPublicReachable, generatedDiscriminatorBaseNames);
            internalizeRoots.UnionWith(customPublicRoots);
            var internalizeReachableWithoutHelpers = GetReachableTypes(internalizeRoots, internalizeReferences);
            AddDerivedModelReferences(providers, publicGraph.Nodes, internalizeReferences, internalizeReachableWithoutHelpers, generatedDiscriminatorBaseNames);
            internalizeReachableWithoutHelpers = GetReachableTypes(internalizeRoots, internalizeReferences);
            var publicizeRoots = new HashSet<string>(internalizeRoots, StringComparer.Ordinal);
            var internalizeHelperRoots = GetHelperRootNames(generatedProviders, graph.Nodes, internalizeReachableWithoutHelpers);
            internalizeRoots.UnionWith(internalizeHelperRoots);
            var internalizeDeclaredNodes = GetPostProcessorDeclaredNodes(generatedProviders, graph.Nodes, publicOnly: true);
            var customInternalBoundaryNodes = GetCustomInternalBoundaryNodes(publicGraph, customInternalDeclarations);
            var publicizeDeclaredNodes = GetPublicizeDeclaredNodes(generatedProviders, graph.Nodes, internalizeDeclaredNodes);
            var generatedImplementationInternalDeclarations = GetGeneratedImplementationInternalTypeDeclarations(generatedInternalDeclarations);
            var publicApiTraversalNodes = GetPublicApiTraversalNodes(
                internalizeDeclaredNodes,
                publicizeDeclaredNodes,
                generatedInternalDeclarations,
                generatedImplementationInternalDeclarations);
            var publicizeReachable = GetReachableTypes(publicizeRoots, internalizeReferences, publicApiTraversalNodes);
            var internalizeCandidates = GetInternalizeCandidates(
                internalizeDeclaredNodes,
                publicizeReachable,
                customInternalDeclarations,
                customInternalBoundaryNodes,
                publicizeRoots);
            var publicizeRootExclusions = GetRootNames(
                providers,
                graph.Nodes,
                helperRoots: [],
                includeModelFactory: true,
                includeAdditionalRoots: true,
                includeUnionVariantRoots: true,
                publicClientRootsOnly: true);
            var publicizeCandidates = GetPublicizeCandidates(
                publicizeDeclaredNodes,
                publicizeReachable,
                customInternalDeclarations,
                customInternalBoundaryNodes,
                internalizeHelperRoots,
                publicizeRootExclusions,
                generatedInternalDeclarations,
                publicizeRoots,
                internalizeReferences,
                generatedImplementationInternalDeclarations);

            return (internalizeCandidates, publicizeCandidates, internalizeHelperRoots);
        }

        private static HashSet<string> GetCustomInternalBoundaryNodes(
            ProviderReferenceGraph publicGraph,
            HashSet<string> customInternalDeclarations)
        {
            var boundaryNodes = new HashSet<string>(StringComparer.Ordinal);
            foreach (var node in publicGraph.Nodes)
            {
                if (!publicGraph.References.TryGetValue(node, out var references))
                {
                    continue;
                }

                if (references.Overlaps(customInternalDeclarations))
                {
                    boundaryNodes.Add(node);
                }
            }

            return boundaryNodes;
        }

        private static HashSet<string> GetPublicizeDeclaredNodes(
            IReadOnlyList<TypeProvider> generatedProviders,
            HashSet<string> nodes,
            HashSet<string> internalizeDeclaredNodes)
        {
            var publicizeDeclaredNodes = GetPostProcessorDeclaredNodes(generatedProviders, nodes, publicOnly: false);
            publicizeDeclaredNodes.ExceptWith(internalizeDeclaredNodes);
            return publicizeDeclaredNodes;
        }

        private static HashSet<string> GetPublicApiTraversalNodes(
            HashSet<string> internalizeDeclaredNodes,
            HashSet<string> publicizeDeclaredNodes,
            HashSet<string> generatedInternalDeclarations,
            HashSet<string> generatedImplementationInternalDeclarations)
        {
            var traversalNodes = new HashSet<string>(StringComparer.Ordinal);
            foreach (var node in internalizeDeclaredNodes)
            {
                if (generatedInternalDeclarations.Contains(node) ||
                    generatedImplementationInternalDeclarations.Contains(node))
                {
                    continue;
                }

                traversalNodes.Add(node);
            }

            foreach (var node in publicizeDeclaredNodes)
            {
                if (!generatedImplementationInternalDeclarations.Contains(node))
                {
                    traversalNodes.Add(node);
                }
            }

            return traversalNodes;
        }

        private static HashSet<string> GetInternalizeCandidates(
            HashSet<string> internalizeDeclaredNodes,
            HashSet<string> publicizeReachable,
            HashSet<string> customInternalDeclarations,
            HashSet<string> customInternalBoundaryNodes,
            HashSet<string> publicizeRoots)
        {
            var candidates = new HashSet<string>(StringComparer.Ordinal);
            foreach (var node in internalizeDeclaredNodes)
            {
                if (!publicizeReachable.Contains(node) ||
                    customInternalDeclarations.Contains(node) ||
                    customInternalBoundaryNodes.Contains(node) && !publicizeRoots.Contains(node))
                {
                    candidates.Add(node);
                }
            }

            return candidates;
        }

        private static HashSet<string> GetPublicizeCandidates(
            HashSet<string> publicizeDeclaredNodes,
            HashSet<string> publicizeReachable,
            HashSet<string> customInternalDeclarations,
            HashSet<string> customInternalBoundaryNodes,
            HashSet<string> internalizeHelperRoots,
            HashSet<string> publicizeRootExclusions,
            HashSet<string> generatedInternalDeclarations,
            HashSet<string> publicizeRoots,
            Dictionary<string, HashSet<string>> internalizeReferences,
            HashSet<string> generatedImplementationInternalDeclarations)
        {
            var candidates = new HashSet<string>(StringComparer.Ordinal);
            foreach (var node in publicizeDeclaredNodes)
            {
                if (customInternalDeclarations.Contains(node) ||
                    customInternalBoundaryNodes.Contains(node) ||
                    internalizeHelperRoots.Contains(node) ||
                    publicizeRootExclusions.Contains(node) ||
                    !publicizeReachable.Contains(node))
                {
                    continue;
                }

                if (generatedInternalDeclarations.Contains(node) && !publicizeRoots.Contains(node))
                {
                    continue;
                }

                if (!publicizeRoots.Contains(node) &&
                    !HasPublicApiPredecessor(node, internalizeReferences, publicizeReachable, generatedImplementationInternalDeclarations))
                {
                    continue;
                }

                candidates.Add(node);
            }

            return candidates;
        }

        private static HashSet<string> GetRemovalCandidates(
            IReadOnlyList<TypeProvider> providers,
            IReadOnlyList<TypeProvider> generatedProviders,
            ProviderReferenceGraph graph,
            HashSet<string> customRemovalRoots,
            HashSet<string> generatedDiscriminatorBaseNames)
        {
            var removeRoots = GetRootNames(
                providers,
                graph.Nodes,
                helperRoots: [],
                includeModelFactory: true,
                includeAdditionalRoots: true,
                includeUnionVariantRoots: false,
                publicClientRootsOnly: false);

            removeRoots.UnionWith(customRemovalRoots);
            AddMatchingNamesWithSimpleNameSuffix(removeRoots, "ReferenceType", graph.Nodes);
            AddCustomCodeExtensionRoots(removeRoots, generatedProviders, graph.Nodes);
            AddCustomizationBackedExtensionRoots(removeRoots, graph.Nodes);
            AddCustomRequestHeaderExtensionsRoot(removeRoots, generatedProviders, graph.Nodes);
            RemoveUnusedRequestHeaderExtensionsRoot(removeRoots, graph.References, providers);

            var removeReachableWithoutHelpers = GetReachableTypes(removeRoots, graph.References);
            AddDerivedModelReferences(providers, graph.Nodes, graph.References, removeReachableWithoutHelpers, generatedDiscriminatorBaseNames);
            removeReachableWithoutHelpers = GetReachableTypes(removeRoots, graph.References);
            AddBasePreservedReferences(generatedProviders, graph.Nodes, graph.References, removeReachableWithoutHelpers);

            var removeHelperRoots = GetHelperRootNames(generatedProviders, graph.Nodes, removeReachableWithoutHelpers, graph.References);
            removeRoots.UnionWith(removeHelperRoots);

            var removeReachable = GetReachableTypes(removeRoots, graph.References);
            AddBasePreservedReferences(generatedProviders, graph.Nodes, graph.References, removeReachable);

            var removeDeclaredNodes = GetPostProcessorDeclaredNodes(generatedProviders, graph.Nodes, publicOnly: false);
            removeDeclaredNodes.ExceptWith(removeReachable);
            return removeDeclaredNodes;
        }

        private static HashSet<string> GetCustomCodeGeneratedTypeRoots(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            foreach (var customCodeView in GetCustomCodeViews(providers))
            {
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

                if (customCodeView is NamedTypeSymbolProvider namedTypeSymbolProvider)
                {
                    AddMatchingName(roots, namedTypeSymbolProvider.MetadataSimpleName, generatedTypeNames);
                }

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

        private static ProviderReferenceGraph BuildGraph(IReadOnlyList<TypeProvider> generatedProviders, bool publicOnly = false)
        {
            // Each generated provider becomes a node, and provider metadata supplies the edges:
            // inheritance, signatures, properties, fields, nested/serialization providers, attributes,
            // and selected implementation dependencies. This avoids parsing generated C# just to
            // rediscover generated-to-generated references.
            var serializationProviderNamesByType = GetSerializationProviderNamesByType(generatedProviders);
            IReadOnlyDictionary<string, string[]>? serializationReferenceNamesByType = publicOnly ? null : serializationProviderNamesByType;
            var nodes = new HashSet<string>(StringComparer.Ordinal);
            var references = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);
            foreach (var provider in generatedProviders)
            {
                var providerName = GetProviderTypeName(provider.Type);
                if (nodes.Add(providerName))
                {
                    references.Add(providerName, new HashSet<string>(StringComparer.Ordinal));
                }
            }

            foreach (var provider in generatedProviders)
            {
                var current = GetProviderTypeName(provider.Type);
                AddTypeReference(references[current], provider.Type, nodes, serializationReferenceNamesByType);
                AddTypeReference(references[current], provider.BaseType, nodes, serializationReferenceNamesByType);
                AddTypeReference(references[current], provider.DeclaringTypeProvider?.Type, nodes, serializationReferenceNamesByType);

                if (IsKept(provider.Type, CodeModelGenerator.Instance.NonRootTypes, nodes))
                {
                    continue;
                }

                // Model factory signatures mention many models. The existing Roslyn post-processor
                // removes factory methods for unreachable models, so model factory should only
                // contribute helper dependencies, not model reachability edges.
                if (IsModelFactoryProvider(provider))
                {
                    continue;
                }

                foreach (var implementedType in provider.Implements)
                {
                    AddTypeReference(references[current], implementedType, nodes, serializationReferenceNamesByType);
                }

                if (!publicOnly)
                {
                    foreach (var nestedType in provider.NestedTypes)
                    {
                        AddTypeReference(references[current], nestedType.Type, nodes, serializationReferenceNamesByType);
                    }
                }

                if (!publicOnly)
                {
                    foreach (var serializationProvider in provider.SerializationProviders)
                    {
                        AddTypeReference(references[current], serializationProvider.Type, nodes, serializationReferenceNamesByType);
                    }
                }

                foreach (var property in provider.Properties)
                {
                    if (publicOnly && !IsPublic(property.Modifiers))
                    {
                        continue;
                    }

                    AddTypeReference(references[current], property.Type, nodes, serializationReferenceNamesByType);
                    AddTypeReference(references[current], property.ExplicitInterface, nodes, serializationReferenceNamesByType);
                    if (!publicOnly)
                    {
                        AddAttributes(references[current], property.Attributes, nodes, serializationReferenceNamesByType, includeArguments: false);
                    }
                }

                foreach (var field in provider.Fields)
                {
                    if (publicOnly && !field.Modifiers.HasFlag(FieldModifiers.Public))
                    {
                        continue;
                    }

                    AddTypeReference(references[current], field.Type, nodes, serializationReferenceNamesByType);
                    if (!publicOnly)
                    {
                        AddAttributes(references[current], field.Attributes, nodes, serializationReferenceNamesByType, includeArguments: false);
                    }
                }

                foreach (var constructor in provider.Constructors)
                {
                    if (publicOnly && !IsPublic(constructor.Signature.Modifiers))
                    {
                        continue;
                    }

                    AddSignatureReferences(references[current], constructor.Signature, nodes, serializationReferenceNamesByType, includeAttributes: !publicOnly, includeAttributeArguments: false);
                }

                foreach (var method in provider.Methods)
                {
                    if (method.IsMethodSuppressed())
                    {
                        continue;
                    }

                    if (publicOnly && !IsPublic(method.Signature.Modifiers))
                    {
                        continue;
                    }

                    AddSignatureReferences(references[current], method.Signature, nodes, serializationReferenceNamesByType, includeAttributes: !publicOnly, includeAttributeArguments: false);
                    if (!publicOnly)
                    {
                        AddTypeReference(references[current], GetCollectionDefinitionType(method), nodes, serializationReferenceNamesByType);
                    }
                }
            }

            return new ProviderReferenceGraph(nodes, references);
        }

        private static Dictionary<string, string[]> GetSerializationProviderNamesByType(IReadOnlyList<TypeProvider> generatedProviders)
        {
            var namesByType = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);
            foreach (var provider in generatedProviders)
            {
                if (provider.SerializationProviders.Count == 0)
                {
                    continue;
                }

                var providerName = GetProviderTypeName(provider.Type);
                if (!namesByType.TryGetValue(providerName, out var serializationProviderNames))
                {
                    serializationProviderNames = new HashSet<string>(StringComparer.Ordinal);
                    namesByType.Add(providerName, serializationProviderNames);
                }

                foreach (var serializationProvider in provider.SerializationProviders)
                {
                    serializationProviderNames.Add(GetProviderTypeName(serializationProvider.Type));
                }
            }

            var result = new Dictionary<string, string[]>(StringComparer.Ordinal);
            foreach (var (providerName, serializationProviderNames) in namesByType)
            {
                result.Add(providerName, [.. serializationProviderNames]);
            }

            return result;
        }

        private static CSharpType? GetCollectionDefinitionType(MethodProvider method)
        {
            var property = method.GetType().GetProperty("CollectionDefinition");
            return property?.GetValue(method) is TypeProvider collectionDefinition
                ? collectionDefinition.Type
                : null;
        }

        private static bool IsPublic(MethodSignatureModifiers modifiers) => modifiers.HasFlag(MethodSignatureModifiers.Public);
        private static bool IsPublic(FieldModifiers modifiers) => modifiers.HasFlag(FieldModifiers.Public);

        private static TypeSignatureModifiers MakeInternal(TypeSignatureModifiers modifiers)
            => (modifiers & ~(TypeSignatureModifiers.Public | TypeSignatureModifiers.Private | TypeSignatureModifiers.Protected)) | TypeSignatureModifiers.Internal;

        private static TypeSignatureModifiers MakePublic(TypeSignatureModifiers modifiers)
            => (modifiers & ~(TypeSignatureModifiers.Internal | TypeSignatureModifiers.Private | TypeSignatureModifiers.Protected)) | TypeSignatureModifiers.Public;

        private static Dictionary<string, HashSet<string>> CloneReferences(IReadOnlyDictionary<string, HashSet<string>> references)
        {
            var clone = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);
            foreach (var (name, referencedNames) in references)
            {
                clone.Add(name, new HashSet<string>(referencedNames, StringComparer.Ordinal));
            }

            return clone;
        }

        private static void AddDerivedModelReferences(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> nodes,
            Dictionary<string, HashSet<string>> references,
            HashSet<string> publicBaseModels,
            HashSet<string> generatedDiscriminatorBaseNames)
        {
            var modelProviders = new List<ModelProvider>();
            var discriminatorProviders = new List<ModelProvider>();
            var discriminatorBaseNames = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in providers)
            {
                if (provider is not ModelProvider modelProvider ||
                    !modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                {
                    continue;
                }

                modelProviders.Add(modelProvider);

                if (modelProvider.DiscriminatorProperty != null)
                {
                    discriminatorBaseNames.Add(GetProviderTypeName(modelProvider.Type));
                }

                if (!modelProvider.IsUnknownDiscriminatorModel &&
                    (modelProvider.DiscriminatorProperty != null || modelProvider.DiscriminatorValue != null))
                {
                    discriminatorProviders.Add(modelProvider);
                }
            }

            discriminatorBaseNames.UnionWith(generatedDiscriminatorBaseNames);
            var addedReference = true;
            while (addedReference)
            {
                addedReference = false;
                foreach (var provider in discriminatorProviders)
                {
                    var providerName = GetProviderTypeName(provider.Type);
                    if (!nodes.Contains(providerName))
                    {
                        continue;
                    }

                    if (!publicBaseModels.Contains(providerName))
                    {
                        continue;
                    }

                    foreach (var derivedModel in provider.DerivedModels)
                    {
                        if (derivedModel.IsUnknownDiscriminatorModel ||
                            !derivedModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                        {
                            continue;
                        }

                        var before = references[providerName].Count;
                        AddTypeReference(references[providerName], derivedModel.Type, nodes);
                        var derivedName = GetProviderTypeName(derivedModel.Type);
                        if (nodes.Contains(derivedName) && publicBaseModels.Add(derivedName) || references[providerName].Count != before)
                        {
                            addedReference = true;
                        }
                    }
                }

                foreach (var provider in modelProviders)
                {
                    if (provider.IsUnknownDiscriminatorModel ||
                        !provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                    {
                        continue;
                    }

                    var providerName = GetProviderTypeName(provider.Type);
                    if (!nodes.Contains(providerName))
                    {
                        continue;
                    }

                    var baseTypeName = provider.BaseType == null ? null : GetProviderTypeName(provider.BaseType);
                    if (baseTypeName == null ||
                        !discriminatorBaseNames.Contains(baseTypeName) ||
                        !nodes.Contains(baseTypeName) ||
                        !publicBaseModels.Contains(baseTypeName))
                    {
                        continue;
                    }

                    var before = references[baseTypeName].Count;
                    references[baseTypeName].Add(providerName);
                    if (publicBaseModels.Add(providerName) || references[baseTypeName].Count != before)
                    {
                        addedReference = true;
                    }
                }
            }
        }

        private static void AddBasePreservedReferences(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, HashSet<string>> references,
            HashSet<string> reachableTypes)
        {
            var basePreservedRoots = new HashSet<string>(StringComparer.Ordinal);
            var addedRoot = true;
            while (addedRoot)
            {
                addedRoot = false;
                foreach (var provider in GetGeneratedProviders(providers))
                {
                    var providerName = GetProviderTypeName(provider.Type);
                    if (!nodes.Contains(providerName) || reachableTypes.Contains(providerName) || basePreservedRoots.Contains(providerName))
                    {
                        continue;
                    }

                    var baseTypeName = provider.BaseType == null ? null : GetProviderTypeName(provider.BaseType);
                    if (baseTypeName == null || !reachableTypes.Contains(baseTypeName))
                    {
                        continue;
                    }

                    if (basePreservedRoots.Add(providerName))
                    {
                        addedRoot = true;
                    }
                }

                if (addedRoot)
                {
                    reachableTypes.UnionWith(GetReachableTypes(basePreservedRoots, references));
                }
            }
        }

        private static IReadOnlyList<TypeProvider> GetGeneratedProviders(IReadOnlyList<TypeProvider> providers)
        {
            var generatedProviders = new List<TypeProvider>();
            foreach (var provider in providers)
            {
                AddGeneratedProvider(generatedProviders, provider);
            }

            return generatedProviders;
        }

        private static void AddGeneratedProvider(List<TypeProvider> generatedProviders, TypeProvider provider)
        {
            generatedProviders.Add(provider);
            foreach (var nestedType in provider.NestedTypes)
            {
                AddGeneratedProvider(generatedProviders, nestedType);
            }

            foreach (var serializationProvider in provider.SerializationProviders)
            {
                AddGeneratedProvider(generatedProviders, serializationProvider);
            }
        }

        private static void AddGeneratedBodyReferences(IReadOnlyList<TypeProvider> providers, ProviderReferenceGraph graph)
        {
            foreach (var (provider, isSerializationProvider) in GetBodyReferenceProviders(providers))
            {
                if (IsModelFactoryProvider(provider) ||
                    !IsGeneratedBodyReferenceCandidate(provider, isSerializationProvider))
                {
                    continue;
                }

                var providerName = GetProviderTypeName(provider.Type);
                if (!graph.Nodes.Contains(providerName))
                {
                    continue;
                }
                AddProviderBodyDependencyTypes(
                    graph.References[providerName],
                    GetNonEnumStructuredBodyReferenceTypes(provider, graph.Nodes),
                    graph.Nodes);
                AddProviderBodyDependencyTypes(graph.References[providerName], provider.BodyDependencyTypes, graph.Nodes);
                AddProviderInfrastructureReferences(graph.References[providerName], provider, graph.Nodes);
                AddHelperDependencies(graph.References[providerName], provider.HelperDependencyTypes, graph.Nodes, graph.References[providerName]);
            }
        }

        private static IReadOnlyList<CSharpType> GetNonEnumStructuredBodyReferenceTypes(TypeProvider provider, HashSet<string> nodes)
        {
            var references = new List<CSharpType>();
            foreach (var dependency in CollectStructuredBodyReferenceTypes(provider))
            {
                if (!IsEnumProviderDependency(dependency, nodes))
                {
                    references.Add(dependency);
                }
            }

            return references;
        }

        private static void AddProviderInfrastructureReferences(HashSet<string> references, TypeProvider provider, HashSet<string> nodes)
        {
            AddMatchingName(references, "ProviderConstants", nodes);
            AddMatchingName(references, "TypeFormatters", nodes);

            if (provider.SerializationProviders.Count > 0)
            {
                AddSerializationExtensionReferences(references, provider, nodes);
            }

            if (IsSerializationProvider(provider))
            {
                AddMatchingName(references, "Optional", nodes);
                AddMatchingName(references, "Utf8JsonRequestContent", nodes);
                AddMatchingName(references, "ModelSerializationExtensions", nodes);
                AddSerializationExtensionReferences(references, provider, nodes);
            }

            foreach (var method in provider.Methods)
            {
                if (method.IsMethodSuppressed())
                {
                    continue;
                }

                AddMethodInfrastructureReferences(references, method, nodes);
            }
        }

        private static void AddSerializationExtensionReferences(HashSet<string> references, TypeProvider provider, HashSet<string> nodes)
        {
            AddSerializationExtensionReferences(references, provider.Type, nodes);
            AddSerializationExtensionReferences(references, provider.BaseType, nodes);
            foreach (var implementedType in provider.Implements)
            {
                AddSerializationExtensionReferences(references, implementedType, nodes);
            }

            foreach (var property in provider.Properties)
            {
                AddSerializationExtensionReferences(references, property.Type, nodes);
            }

            foreach (var field in provider.Fields)
            {
                AddSerializationExtensionReferences(references, field.Type, nodes);
            }

            foreach (var constructor in provider.Constructors)
            {
                AddSerializationExtensionReferences(references, constructor.Signature.ReturnType, nodes);
                foreach (var parameter in constructor.Signature.Parameters)
                {
                    AddSerializationExtensionReferences(references, parameter.Type, nodes);
                }
            }

            foreach (var method in provider.Methods)
            {
                if (method.IsMethodSuppressed())
                {
                    continue;
                }

                AddSerializationExtensionReferences(references, method.Signature.ReturnType, nodes);
                foreach (var parameter in method.Signature.Parameters)
                {
                    AddSerializationExtensionReferences(references, parameter.Type, nodes);
                }
            }
        }

        private static void AddSerializationExtensionReferences(HashSet<string> references, CSharpType? type, HashSet<string> nodes)
        {
            if (type == null)
            {
                return;
            }

            AddMatchingName(references, $"{type.Name}Extensions", nodes);
            foreach (var argument in type.Arguments)
            {
                AddSerializationExtensionReferences(references, argument, nodes);
            }
        }

        private static void AddMethodInfrastructureReferences(HashSet<string> references, MethodProvider method, HashSet<string> nodes)
        {
            AddReturnTypeInfrastructureReferences(references, method.Signature.ReturnType, nodes);
        }

        private static void AddReturnTypeInfrastructureReferences(HashSet<string> references, CSharpType? returnType, HashSet<string> nodes)
        {
            var type = UnwrapTask(returnType);
            if (type == null)
            {
                return;
            }

            var typeName = StripGenericArity(type.Name);
            if (string.Equals(typeName, "Pageable", StringComparison.Ordinal))
            {
                AddMatchingName(references, "PageableWrapper", nodes);
            }
            else if (string.Equals(typeName, "AsyncPageable", StringComparison.Ordinal))
            {
                AddMatchingName(references, "AsyncPageableWrapper", nodes);
            }
            else if (string.Equals(typeName, "ArmOperation", StringComparison.Ordinal))
            {
                AddMatchingNamesWithSimpleNameSuffix(references, "ArmOperation", nodes);
                AddMatchingNamesWithSimpleNameSuffix(references, "OperationSource", nodes);
                if (type.Arguments.Count > 0)
                {
                    AddMatchingName(references, $"{BuildOperationSourceTypeName(type.Arguments[0])}OperationSource", nodes);
                }
            }
        }

        private static CSharpType? UnwrapTask(CSharpType? type)
        {
            var typeName = type == null ? null : StripGenericArity(type.Name);
            if ((string.Equals(typeName, "Task", StringComparison.Ordinal) ||
                string.Equals(typeName, "ValueTask", StringComparison.Ordinal)) &&
                type?.Arguments.Count > 0)
            {
                return type.Arguments[0];
            }

            return type;
        }

        private static string BuildOperationSourceTypeName(CSharpType type)
        {
            var argumentNames = string.Join("", type.Arguments.Select(BuildOperationSourceTypeName));
            return $"{type.Name}{(argumentNames.Length > 0 ? "Of" : string.Empty)}{argumentNames}";
        }

        private static IReadOnlyList<CSharpType> CollectStructuredBodyReferenceTypes(TypeProvider provider)
        {
            var references = new HashSet<CSharpType>();
            var visited = new HashSet<object>(ReferenceEqualityComparer.Instance);

            foreach (var field in provider.Fields)
            {
                CollectStructuredBodyReferenceTypes(field.InitializationValue, references, visited);
            }

            foreach (var property in provider.Properties)
            {
                CollectStructuredBodyReferenceTypes(property.Body, references, visited);
            }

            foreach (var constructor in provider.Constructors)
            {
                CollectStructuredBodyReferenceTypes(constructor.BodyExpression, references, visited);
                CollectStructuredBodyReferenceTypes(constructor.BodyStatements, references, visited);
            }

            foreach (var method in provider.Methods)
            {
                if (method.IsMethodSuppressed())
                {
                    continue;
                }

                CollectStructuredBodyReferenceTypes(method.BodyExpression, references, visited);
                CollectStructuredBodyReferenceTypes(method.BodyStatements, references, visited);
            }

            return [.. references];
        }

        private static void CollectStructuredBodyReferenceTypes(object? value, HashSet<CSharpType> references, HashSet<object> visited)
        {
            switch (value)
            {
                case null:
                case string:
                case FormattableString:
                    return;
            }

            if (!value.GetType().IsValueType && !visited.Add(value))
            {
                return;
            }

            switch (value)
            {
                case CSharpType type:
                    references.Add(type);
                    return;
                case Type type:
                    references.Add(type);
                    return;
                case ParameterProvider parameter:
                    references.Add(parameter.Type);
                    CollectStructuredBodyReferenceTypes(parameter.DefaultValue, references, visited);
                    CollectStructuredBodyReferenceTypes(parameter.InitializationValue, references, visited);
                    return;
                case MethodSignatureBase signature:
                    CollectStructuredBodyReferenceTypes(signature.ReturnType, references, visited);
                    CollectStructuredBodyReferenceTypes(signature.Parameters, references, visited);
                    return;
                case KeyValuePair<string, ValueExpression> positionalArgument:
                    CollectStructuredBodyReferenceTypes(positionalArgument.Value, references, visited);
                    return;
                case FieldProvider field:
                    references.Add(field.Type);
                    CollectStructuredBodyReferenceTypes(field.InitializationValue, references, visited);
                    return;
            }

            if (IsStructuredBodyReferenceObject(value))
            {
                foreach (var property in value.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance))
                {
                    if (property.GetIndexParameters().Length > 0)
                    {
                        continue;
                    }

                    CollectStructuredBodyReferenceTypes(property.GetValue(value), references, visited);
                }

                return;
            }

            if (value is not IEnumerable values)
            {
                return;
            }

            foreach (var item in values)
            {
                CollectStructuredBodyReferenceTypes(item, references, visited);
            }
        }

        private static bool IsEnumProviderDependency(CSharpType dependency, HashSet<string> nodes)
        {
            var providerName = GetProviderTypeName(dependency);
            if (!nodes.Contains(providerName))
            {
                return false;
            }

            foreach (var provider in CodeModelGenerator.Instance.OutputLibrary.TypeProviders)
            {
                if (provider is EnumProvider &&
                    string.Equals(GetProviderTypeName(provider.Type), providerName, StringComparison.Ordinal))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool IsStructuredBodyReferenceObject(object value) =>
            value is ValueExpression ||
            value is MethodBodyStatement ||
            value is PropertyBody;

        private static void AddProviderBodyDependencyTypes(
            HashSet<string> references,
            IReadOnlyList<CSharpType> dependencies,
            HashSet<string> nodes,
            bool includeSimpleNameReferences = false)
        {
            foreach (var dependency in dependencies)
            {
                AddProviderBodyDependencyType(references, dependency, nodes, includeSimpleNameReferences);
            }
        }

        private static void AddProviderBodyDependencyType(
            HashSet<string> references,
            CSharpType? dependency,
            HashSet<string> nodes,
            bool includeSimpleNameReferences)
        {
            if (dependency == null)
            {
                return;
            }

            AddTypeReference(references, dependency, nodes);
            if (includeSimpleNameReferences)
            {
                AddMatchingName(references, dependency.Name, nodes);
            }
            if (nodes.Contains(GetProviderTypeName(dependency)))
            {
                AddMatchingName(references, $"{dependency.Name}Extensions", nodes);
            }
            else if (string.Equals(dependency.Name, "RequestContext", StringComparison.Ordinal))
            {
                AddMatchingName(references, "RequestContextExtensions", nodes);
            }

            foreach (var argument in dependency.Arguments)
            {
                AddProviderBodyDependencyType(references, argument, nodes, includeSimpleNameReferences);
            }
        }

        private static IReadOnlyList<(TypeProvider Provider, bool IsSerializationProvider)> GetBodyReferenceProviders(IReadOnlyList<TypeProvider> providers)
        {
            var bodyReferenceProviders = new List<(TypeProvider Provider, bool IsSerializationProvider)>();
            foreach (var provider in providers)
            {
                bodyReferenceProviders.Add((provider, false));
                foreach (var serializationProvider in provider.SerializationProviders)
                {
                    bodyReferenceProviders.Add((serializationProvider, true));
                }
            }

            return bodyReferenceProviders;
        }

        private static bool IsGeneratedBodyReferenceCandidate(TypeProvider provider, bool isSerializationProvider)
        {
            if (provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Static))
            {
                return true;
            }

            return provider.IsReferenceMapRoot ||
                isSerializationProvider ||
                provider.IncludeGeneratedBodyReferences ||
                provider.HelperDependencyTypes.Count > 0 ||
                provider.BodyDependencyTypes.Count > 0;
        }

        private static HashSet<string> GetRootNames(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> nodes,
            HashSet<string> helperRoots,
            bool includeModelFactory,
            bool includeAdditionalRoots,
            bool includeUnionVariantRoots,
            bool publicClientRootsOnly)
        {
            var generator = CodeModelGenerator.Instance;
            var roots = new HashSet<string>(StringComparer.Ordinal);
            var modelFactoryName = GetProviderTypeName(generator.OutputLibrary.ModelFactory.Value.Type);

            foreach (var provider in providers)
            {
                var name = GetProviderTypeName(provider.Type);
                if (IsReferenceMapRootProvider(provider, publicClientRootsOnly) ||
                    includeAdditionalRoots && IsAdditionalRootProvider(provider, generator.AdditionalRootTypes, nodes) ||
                    includeModelFactory && string.Equals(name, modelFactoryName, StringComparison.Ordinal) ||
                    includeModelFactory && helperRoots.Contains(name))
                {
                    roots.Add(name);
                }
            }

            AddLastContractModelFactorySignatureRoots(providers, roots, nodes);

            if (!includeUnionVariantRoots)
            {
                return roots;
            }

            AddUnionVariantRoots(roots, providers, nodes);

            return roots;
        }

        private static void AddLastContractModelFactorySignatureRoots(IReadOnlyList<TypeProvider> providers, HashSet<string> roots, HashSet<string> nodes)
        {
            foreach (var provider in providers)
            {
                if (!IsModelFactoryProvider(provider))
                {
                    continue;
                }

                foreach (var method in provider.LastContractView?.Methods ?? [])
                {
                    if (!method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) ||
                        IsImplementationOnlyModelFactoryMethod(method))
                    {
                        continue;
                    }

                    AddTypeReference(roots, method.Signature.ReturnType, nodes);
                    foreach (var parameter in method.Signature.Parameters)
                    {
                        AddTypeReference(roots, parameter.Type, nodes);
                    }
                }
            }
        }

        private static void AddUnionVariantRoots(HashSet<string> roots, IReadOnlyList<TypeProvider> providers, HashSet<string> nodes)
        {
            var unionVariantTypesToKeep = CodeModelGenerator.Instance.TypeFactory.UnionVariantTypesToKeep;
            foreach (var provider in GetGeneratedProviders(providers))
            {
                if (!unionVariantTypesToKeep.Contains(provider.Type.Name) ||
                    string.Equals(provider.Type.Namespace, "TypeSpec.Http", StringComparison.Ordinal))
                {
                    continue;
                }

                AddMatchingName(roots, GetProviderTypeName(provider.Type), nodes);
            }
        }

        private static bool ShouldUseUnionVariantFallbackRoots() =>
            !HasApiBaselineDirectory() &&
            CodeModelGenerator.Instance.SourceInputModel.LastContract == null;

        private static bool IsImplementationOnlyModelFactoryMethod(MethodProvider method)
        {
            var returnType = method.Signature.ReturnType;
            if (returnType == null)
            {
                return true;
            }

            var returnTypeName = GetSimpleName(GetProviderTypeName(returnType));
            return returnTypeName.StartsWith("Paged", StringComparison.Ordinal) ||
                returnTypeName.EndsWith("Request", StringComparison.Ordinal);
        }

        private static void RemoveMethodsFromModelFactory(HashSet<string> namesToRemove)
        {
            if (namesToRemove.Count == 0)
            {
                return;
            }

            var modelFactory = CodeModelGenerator.Instance.OutputLibrary.ModelFactory.Value;
            _preWriteModelFactory = modelFactory;
            _preWriteModelFactoryMethods ??= [.. modelFactory.Methods];
            var methodsToKeep = new List<MethodProvider>();
            foreach (var method in modelFactory.Methods)
            {
                if (!namesToRemove.Contains(method.Signature.Name))
                {
                    methodsToKeep.Add(method);
                }
            }

            modelFactory.Update(methods: methodsToKeep);
        }

        private static HashSet<string> GetPostProcessorDeclaredNodes(IReadOnlyList<TypeProvider> providers, HashSet<string> nodes, bool publicOnly)
        {
            var generator = CodeModelGenerator.Instance;
            var excludedNames = generator.NonRootTypes;
            var declaredNodes = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                if (IsModelFactoryProvider(provider))
                {
                    continue;
                }

                if (publicOnly && !provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                {
                    continue;
                }

                var name = GetProviderTypeName(provider.Type);
                if (!nodes.Contains(name) ||
                    excludedNames.Contains(name) ||
                    excludedNames.Contains(GetSimpleName(name)))
                {
                    continue;
                }

                declaredNodes.Add(name);
            }

            return declaredNodes;
        }

        private static bool IsKept(CSharpType type, HashSet<string> roots, HashSet<string> nodes)
        {
            var providerName = GetProviderTypeName(type);
            if (roots.Contains(providerName) && nodes.Contains(providerName))
            {
                return true;
            }

            if (!roots.Contains(type.Name))
            {
                return false;
            }

            var simpleNameLookup = _simpleNameLookupCache.GetValue(nodes, BuildSimpleNameLookup);
            return simpleNameLookup.TryGetValue(type.Name, out var matches) &&
                matches.Length == 1 &&
                string.Equals(matches[0], providerName, StringComparison.Ordinal);
        }

        private static bool IsReferenceMapRootProvider(TypeProvider provider, bool publicOnly) =>
            provider.IsReferenceMapRoot &&
            (!publicOnly || !HasApiBaselineDirectory() && provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));

        private static bool IsAdditionalRootProvider(TypeProvider provider, HashSet<string> roots, HashSet<string> nodes)
        {
            if (provider.DeclaringTypeProvider != null || !IsKept(provider.Type, roots, nodes))
            {
                return false;
            }

            return provider is not ModelProvider && provider is not EnumProvider;
        }

        private static bool HasApiBaselineDirectory()
        {
            var projectDirectory = CodeModelGenerator.Instance.Configuration.ProjectDirectory;
            return !string.IsNullOrEmpty(projectDirectory) &&
                Directory.Exists(Path.GetFullPath(Path.Combine(projectDirectory, "..", "api")));
        }

        private static bool IsModelFactoryProvider(TypeProvider provider)
            => provider is ModelFactoryProvider;

        private static HashSet<string> GetHelperRootNames(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> nodes,
            HashSet<string> reachableTypes,
            IReadOnlyDictionary<string, HashSet<string>>? references = null)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                var providerName = GetProviderTypeName(provider.Type);
                var isModelFactory = IsModelFactoryProvider(provider);
                if (!reachableTypes.Contains(providerName) && !isModelFactory)
                {
                    continue;
                }

                AddHelperDependencies(roots, provider.HelperDependencyTypes, nodes, references == null ? null : references[providerName]);

                foreach (var property in provider.Properties)
                {
                    AddInitializationHelperRoot(roots, property.Type, nodes);
                    AddParameterValidationHelperRoot(roots, property.AsParameter, nodes);
                }

                foreach (var field in provider.Fields)
                {
                    AddParameterValidationHelperRoot(roots, field.AsParameter, nodes);
                }

                foreach (var constructor in provider.Constructors)
                {
                    foreach (var parameter in constructor.Signature.Parameters)
                    {
                        AddParameterValidationHelperRoot(roots, parameter, nodes);
                    }
                }

                foreach (var method in provider.Methods)
                {
                    // Only factory methods for reachable models can instantiate collection helpers.
                    if (isModelFactory &&
                        (method.Signature.ReturnType == null || !reachableTypes.Contains(GetProviderTypeName(method.Signature.ReturnType))))
                    {
                        continue;
                    }

                    foreach (var parameter in method.Signature.Parameters)
                    {
                        AddParameterValidationHelperRoot(roots, parameter, nodes);
                        if (isModelFactory)
                        {
                            AddModelFactoryCollectionInitializationHelperRoot(roots, parameter.Type, nodes);
                        }
                    }
                }
            }

            return roots;
        }

        private static void AddParameterValidationHelperRoot(HashSet<string> roots, ParameterProvider parameter, HashSet<string> nodes)
        {
            if (parameter.Validation != ParameterValidationType.None)
            {
                AddMatchingName(roots, "Argument", nodes);
            }
        }

        private static void AddHelperDependencies(
            HashSet<string> roots,
            IReadOnlyList<CSharpType> dependencies,
            HashSet<string> nodes,
            HashSet<string>? referencedNames)
        {
            foreach (var dependency in dependencies)
            {
                if (referencedNames == null)
                {
                    AddTypeReference(roots, dependency, nodes);
                    continue;
                }

                var matches = new HashSet<string>(StringComparer.Ordinal);
                AddTypeReference(matches, dependency, nodes);
                foreach (var match in matches)
                {
                    if (referencedNames.Contains(match))
                    {
                        roots.Add(match);
                    }
                }
            }
        }

        private static void RemoveUnusedRequestHeaderExtensionsRoot(
            HashSet<string> roots,
            IReadOnlyDictionary<string, HashSet<string>> references,
            IReadOnlyList<TypeProvider> providers)
        {
            var hasCustomReference = HasCustomRequestHeaderExtensionsReference(providers);
            if (hasCustomReference)
            {
                return;
            }

            var unusedRequestHeaderExtensions = new List<string>();
            foreach (var root in roots)
            {
                if (IsRequestHeadersExtensionsRoot(root) &&
                    !HasExternalReference(root, references))
                {
                    unusedRequestHeaderExtensions.Add(root);
                }
            }

            roots.ExceptWith(unusedRequestHeaderExtensions);
        }

        private static bool HasExternalReference(string root, IReadOnlyDictionary<string, HashSet<string>> references)
        {
            foreach (var (source, sourceReferences) in references)
            {
                if (!string.Equals(source, root, StringComparison.Ordinal) &&
                    sourceReferences.Contains(root))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool IsRequestHeadersExtensionsRoot(string root) =>
            root.EndsWith(".RequestHeaderExtensions", StringComparison.Ordinal) ||
            root.EndsWith(".RequestHeadersExtensions", StringComparison.Ordinal);

        private static bool HasCustomRequestHeaderExtensionsReference(IReadOnlyList<TypeProvider> providers)
        {
            foreach (var customCodeView in GetCustomCodeViews(providers))
            {
                if (customCodeView is NamedTypeSymbolProvider)
                {
                    if (HasRequestHeaderExtensionsDependency(customCodeView.HelperDependencyTypes) ||
                        HasRequestHeaderExtensionsDependency(customCodeView.BodyDependencyTypes) ||
                        HasRequestHeaderExtensionsDependency(customCodeView.SignatureDependencyTypes))
                    {
                        return true;
                    }

                    continue;
                }

                if (HasRequestHeaderExtensionsDependency(customCodeView.HelperDependencyTypes) ||
                    HasRequestHeaderExtensionsDependency(customCodeView.BodyDependencyTypes) ||
                    HasRequestHeaderExtensionsMethodDependency(customCodeView.Methods) ||
                    HasRequestHeaderExtensionsPropertyDependency(customCodeView.Properties) ||
                    HasRequestHeaderExtensionsFieldDependency(customCodeView.Fields))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool HasRequestHeaderExtensionsDependency(IEnumerable<CSharpType> dependencies)
        {
            foreach (var dependency in dependencies)
            {
                if (IsRequestHeaderExtensionsDependency(dependency))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool HasRequestHeaderExtensionsMethodDependency(IReadOnlyList<MethodProvider> methods)
        {
            foreach (var method in methods)
            {
                if (IsRequestHeaderExtensionsDependency(method.Signature.ReturnType))
                {
                    return true;
                }

                foreach (var parameter in method.Signature.Parameters)
                {
                    if (IsRequestHeaderExtensionsDependency(parameter.Type))
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        private static bool HasRequestHeaderExtensionsPropertyDependency(IReadOnlyList<PropertyProvider> properties)
        {
            foreach (var property in properties)
            {
                if (IsRequestHeaderExtensionsDependency(property.Type))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool HasRequestHeaderExtensionsFieldDependency(IReadOnlyList<FieldProvider> fields)
        {
            foreach (var field in fields)
            {
                if (IsRequestHeaderExtensionsDependency(field.Type))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool IsRequestHeaderExtensionsDependency(string name)
            => string.Equals(name, "RequestHeaderExtensions", StringComparison.Ordinal) ||
                string.Equals(name, "SetDelimited", StringComparison.Ordinal);

        private static bool IsRequestHeaderExtensionsDependency(CSharpType? type)
        {
            if (type == null)
            {
                return false;
            }

            if (IsRequestHeaderExtensionsDependency(type.Name))
            {
                return true;
            }

            foreach (var argument in type.Arguments)
            {
                if (IsRequestHeaderExtensionsDependency(argument))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool IsSerializationProvider(TypeProvider provider)
        {
            var relativePath = provider.RelativeFilePath.Replace('\\', '/');
            return relativePath.EndsWith(".Serialization.cs", StringComparison.Ordinal) ||
                relativePath.EndsWith(".Serialization.Multipart.cs", StringComparison.Ordinal);
        }

        private static void AddInitializationHelperRoot(HashSet<string> roots, CSharpType? type, HashSet<string> nodes)
        {
            if (type == null)
            {
                return;
            }

            var initializationType = type.PropertyInitializationType;
            if (!string.Equals(initializationType.FullyQualifiedName, type.FullyQualifiedName, StringComparison.Ordinal))
            {
                AddMatchingName(roots, initializationType.Name, nodes);
            }

            if (type is { IsList: true, IsReadOnlyMemory: false })
            {
                AddTypeReference(roots, CodeModelGenerator.Instance.TypeFactory.ListInitializationType, nodes);
            }

            if (type.IsDictionary)
            {
                AddTypeReference(roots, CodeModelGenerator.Instance.TypeFactory.DictionaryInitializationType, nodes);
            }

            foreach (var argument in type.Arguments)
            {
                AddInitializationHelperRoot(roots, argument, nodes);
            }
        }

        private static void AddModelFactoryCollectionInitializationHelperRoot(HashSet<string> roots, CSharpType? type, HashSet<string> nodes)
        {
            if (type == null)
            {
                return;
            }

            if (type is { IsList: true, IsReadOnlyMemory: false })
            {
                AddTypeReference(roots, CodeModelGenerator.Instance.TypeFactory.ListInitializationType, nodes);
            }

            if (type.IsDictionary)
            {
                AddTypeReference(roots, CodeModelGenerator.Instance.TypeFactory.DictionaryInitializationType, nodes);
            }

            foreach (var argument in type.Arguments)
            {
                AddModelFactoryCollectionInitializationHelperRoot(roots, argument, nodes);
            }
        }

        private static void AddMatchingName(HashSet<string> target, string name, HashSet<string> nodes)
        {
            if (nodes.Contains(name))
            {
                target.Add(name);
                return;
            }

            var simpleNameLookup = _simpleNameLookupCache.GetValue(nodes, BuildSimpleNameLookup);
            if (!simpleNameLookup.TryGetValue(name, out var matches))
            {
                return;
            }

            foreach (var match in matches)
            {
                target.Add(match);
            }
        }

        private static void AddMatchingNamesWithSimpleNameSuffix(HashSet<string> target, string suffix, HashSet<string> nodes)
        {
            foreach (var node in nodes)
            {
                if (GetSimpleName(node).EndsWith(suffix, StringComparison.Ordinal))
                {
                    target.Add(node);
                }
            }
        }

        private static Dictionary<string, string[]> BuildSimpleNameLookup(HashSet<string> nodes)
        {
            var lookup = new Dictionary<string, List<string>>(StringComparer.Ordinal);
            foreach (var node in nodes)
            {
                var simpleName = StripGenericArity(GetSimpleName(node));
                if (!lookup.TryGetValue(simpleName, out var matchingNodes))
                {
                    matchingNodes = [];
                    lookup.Add(simpleName, matchingNodes);
                }

                matchingNodes.Add(node);
            }

            var result = new Dictionary<string, string[]>(StringComparer.Ordinal);
            foreach (var (simpleName, matchingNodes) in lookup)
            {
                result.Add(simpleName, [.. matchingNodes]);
            }

            return result;
        }

        private static HashSet<string> GetReachableTypes(HashSet<string> roots, IReadOnlyDictionary<string, HashSet<string>> references)
        {
            return GetReachableTypes(roots, references, expandableNodes: null);
        }

        private static HashSet<string> GetReachableTypes(
            HashSet<string> roots,
            IReadOnlyDictionary<string, HashSet<string>> references,
            HashSet<string>? expandableNodes)
        {
            var reachable = new HashSet<string>(StringComparer.Ordinal);
            var queue = new Queue<string>(roots);
            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                if (!reachable.Add(current))
                {
                    continue;
                }

                if (expandableNodes != null && !expandableNodes.Contains(current))
                {
                    continue;
                }

                if (!references.TryGetValue(current, out var children))
                {
                    continue;
                }

                foreach (var child in children)
                {
                    queue.Enqueue(child);
                }
            }

            return reachable;
        }

        private static bool HasPublicApiPredecessor(
            string name,
            IReadOnlyDictionary<string, HashSet<string>> references,
            HashSet<string> publicizeReachable,
            HashSet<string> generatedImplementationInternalDeclarations)
        {
            foreach (var (owner, children) in references)
            {
                if (!publicizeReachable.Contains(owner) ||
                    string.Equals(owner, name, StringComparison.Ordinal) ||
                    generatedImplementationInternalDeclarations.Contains(owner) ||
                    !children.Contains(name))
                {
                    continue;
                }

                return true;
            }

            return false;
        }

        private static void AddSignatureReferences(
            HashSet<string> references,
            MethodSignatureBase signature,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, string[]>? serializationProviderNamesByType,
            bool includeAttributes = true,
            bool includeAttributeArguments = true)
        {
            AddTypeReference(references, signature.ReturnType, nodes, serializationProviderNamesByType);
            if (includeAttributes)
            {
                AddAttributes(references, signature.Attributes, nodes, serializationProviderNamesByType, includeAttributeArguments);
            }

            foreach (var parameter in signature.Parameters)
            {
                AddTypeReference(references, parameter.Type, nodes, serializationProviderNamesByType);
                if (includeAttributes)
                {
                    AddAttributes(references, parameter.Attributes, nodes, serializationProviderNamesByType, includeAttributeArguments);
                }
            }

            if (signature is MethodSignature methodSignature)
            {
                AddTypeReference(references, methodSignature.ExplicitInterface, nodes, serializationProviderNamesByType);
                if (methodSignature.GenericArguments != null)
                {
                    foreach (var genericArgument in methodSignature.GenericArguments)
                    {
                        AddTypeReference(references, genericArgument, nodes, serializationProviderNamesByType);
                    }
                }

                if (methodSignature.GenericParameterConstraints != null)
                {
                    foreach (var constraint in methodSignature.GenericParameterConstraints)
                    {
                        AddTypeReference(references, constraint.Type, nodes, serializationProviderNamesByType);
                    }
                }
            }

            if (signature is ConstructorSignature constructorSignature)
            {
                AddTypeReference(references, constructorSignature.Type, nodes, serializationProviderNamesByType);
            }
        }

        private static void AddAttributes(
            HashSet<string> references,
            IReadOnlyList<AttributeStatement> attributes,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, string[]>? serializationProviderNamesByType,
            bool includeArguments)
        {
            foreach (var attribute in attributes)
            {
                AddTypeReference(references, attribute.Type, nodes, serializationProviderNamesByType);
                if (!includeArguments)
                {
                    continue;
                }

                foreach (var argument in attribute.Arguments)
                {
                    AddAttributeArgumentReference(references, argument, nodes, serializationProviderNamesByType);
                }

                foreach (var (_, argument) in attribute.PositionalArguments)
                {
                    AddAttributeArgumentReference(references, argument, nodes, serializationProviderNamesByType);
                }
            }
        }

        private static bool IsAttributeNamed(AttributeStatement attribute, string name)
            => string.Equals(attribute.Type.Name, name, StringComparison.Ordinal) ||
                string.Equals(attribute.Type.Name, $"{name}Attribute", StringComparison.Ordinal);

        private static void AddAttributeArgumentReference(
            HashSet<string> references,
            ValueExpression argument,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, string[]>? serializationProviderNamesByType)
        {
            if (argument is TypeOfExpression typeOf)
            {
                AddTypeReference(references, typeOf.Type, nodes, serializationProviderNamesByType);
                AddMatchingName(references, typeOf.Type.Name, nodes);
            }
        }

        private static void AddTypeReference(
            HashSet<string> references,
            CSharpType? type,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, string[]>? serializationProviderNamesByType = null)
        {
            if (type == null)
            {
                return;
            }

            if (type.IsArray)
            {
                AddTypeReference(references, type.ElementType, nodes, serializationProviderNamesByType);
                return;
            }

            var providerTypeName = GetProviderTypeName(type);
            if (nodes.Contains(providerTypeName))
            {
                references.Add(providerTypeName);
                if (serializationProviderNamesByType != null && serializationProviderNamesByType.TryGetValue(providerTypeName, out var serializationProviderNames))
                {
                    foreach (var serializationProviderName in serializationProviderNames)
                    {
                        references.Add(serializationProviderName);
                    }
                }
            }

            AddTypeReference(references, type.BaseType, nodes, serializationProviderNamesByType);
            AddTypeReference(references, type.DeclaringType, nodes, serializationProviderNamesByType);
            foreach (var argument in type.Arguments)
            {
                AddTypeReference(references, argument, nodes, serializationProviderNamesByType);
            }
        }

        private static string GetSimpleName(string fullyQualifiedName)
        {
            var lastDot = fullyQualifiedName.LastIndexOf('.');
            return lastDot < 0 ? fullyQualifiedName : fullyQualifiedName.Substring(lastDot + 1);
        }

        private static string? GetNamespaceName(string fullyQualifiedName)
        {
            var lastDot = fullyQualifiedName.LastIndexOf('.');
            return lastDot < 0 ? null : fullyQualifiedName.Substring(0, lastDot);
        }

        private static string GetProviderTypeName(CSharpType type)
        {
            var name = type.Arguments.Count > 0 && !type.Name.Contains('`', StringComparison.Ordinal)
                ? $"{type.Name}`{type.Arguments.Count}"
                : type.Name;
            return string.IsNullOrEmpty(type.Namespace) ? name : $"{type.Namespace}.{name}";
        }

        private static string StripGenericArity(string name)
        {
            var tick = name.IndexOf('`');
            return tick < 0 ? name : name.Substring(0, tick);
        }

        private sealed record ProviderReferenceGraph(
            HashSet<string> Nodes,
            Dictionary<string, HashSet<string>> References);
    }
}
