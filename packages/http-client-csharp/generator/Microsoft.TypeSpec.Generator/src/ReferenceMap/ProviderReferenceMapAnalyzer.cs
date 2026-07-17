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
    internal static partial class ProviderReferenceMapAnalyzer
    {
        private static ProviderReferenceMapResult? _latestResult;
        private static readonly ConditionalWeakTable<HashSet<string>, Dictionary<string, string[]>> _simpleNameLookupCache = new();
        private static readonly ConditionalWeakTable<HashSet<string>, Dictionary<string, string[]>> _metadataSimpleNameLookupCache = new();
        private static TypeProvider? _preWriteModelFactory;
        private static MethodProvider[]? _preWriteModelFactoryMethods;

        public static ProviderReferenceMapResult? LatestResult => _latestResult;

        public static ProviderReferenceMapSession PrepareForGeneration(IReadOnlyList<TypeProvider> providers)
        {
            ResetPreWriteAccessibility();
            ApplyPreWriteAccessibility(providers);
            Analyze(providers);
            return new ProviderReferenceMapSession();
        }

        public static bool ShouldWriteProvider(TypeProvider provider) =>
            _latestResult?.RemoveCandidates.Contains(GetProviderTypeName(provider.Type)) != true;

        public static bool IsResolvableBuildableType(CSharpType type)
        {
            if (TryGetProvider(type, exact: true, out var provider))
            {
                return IsResolvableBuildableProvider(provider);
            }

            if (MatchesRemovedProvider(type))
            {
                return false;
            }

            return !TryGetProvider(type, exact: false, out provider) ||
                IsResolvableBuildableProvider(provider);
        }

        private static bool IsResolvableBuildableProvider(TypeProvider provider) =>
            provider is not SystemObjectModelProvider &&
            provider is not ModelProvider { IsExternal: true } &&
            ShouldWriteProvider(provider);

        private static bool TryGetProvider(CSharpType type, bool exact, out TypeProvider provider)
        {
            var outputProvider = FindOutputProviderByName(
                CodeModelGenerator.Instance.OutputLibrary.TypeProviders,
                GetProviderTypeName(type));
            if (outputProvider != null)
            {
                provider = outputProvider;
                return true;
            }

            if (!exact && string.IsNullOrEmpty(type.Namespace))
            {
                if (_latestResult != null)
                {
                    var simpleNameLookup = _metadataSimpleNameLookupCache.GetValue(_latestResult.Nodes, BuildMetadataSimpleNameLookup);
                    var simpleName = GetSimpleName(GetProviderTypeName(type));
                    if (!simpleNameLookup.TryGetValue(simpleName, out var matches) ||
                        matches.Length != 1)
                    {
                        provider = null!;
                        return false;
                    }

                    outputProvider = FindOutputProviderByName(
                        CodeModelGenerator.Instance.OutputLibrary.TypeProviders,
                        matches[0]);
                    if (outputProvider != null)
                    {
                        provider = outputProvider;
                        return true;
                    }
                }
                else if (CodeModelGenerator.Instance.TypeFactory.TypeProvidersByName.TryGetValue(type.Name, out var mappedProvider))
                {
                    provider = mappedProvider;
                    return true;
                }
            }

            provider = null!;
            return false;
        }

        private static TypeProvider? FindOutputProviderByName(IEnumerable<TypeProvider> providers, string name)
        {
            foreach (var provider in providers)
            {
                if (string.Equals(GetProviderTypeName(provider.Type), name, StringComparison.Ordinal))
                {
                    return provider;
                }

                var nestedProvider = FindOutputProviderByName(provider.NestedTypes, name);
                if (nestedProvider != null)
                {
                    return nestedProvider;
                }

                var serializationProvider = FindOutputProviderByName(provider.SerializationProviders, name);
                if (serializationProvider != null)
                {
                    return serializationProvider;
                }
            }

            return null;
        }

        private static bool MatchesRemovedProvider(CSharpType type)
        {
            if (_latestResult == null || _latestResult.RemoveCandidates.Count == 0)
            {
                return false;
            }

            var providerName = GetProviderTypeName(type);
            if (_latestResult.RemoveCandidates.Contains(providerName))
            {
                return true;
            }

            return string.IsNullOrEmpty(type.Namespace) &&
                MatchesGeneratedNode(
                    providerName,
                    GetSimpleName(providerName),
                    _latestResult.RemoveCandidates,
                    _latestResult.Nodes,
                    ignoreGenericArity: false);
        }

        public static void ResetPreWriteAccessibility()
        {
            RestorePreWriteModelFactoryMethods();
            _latestResult = null;
        }

        public static void ApplyPreWriteAccessibility(IReadOnlyList<TypeProvider> providers)
        {
            if (Configuration.UnreferencedTypesHandling == Configuration.UnreferencedTypesHandlingOption.KeepAll)
            {
                return;
            }

            // Accessibility has to be adjusted before files are written. Roslyn can remove files
            // later, but it cannot safely change provider declarations or model factory signatures.
            var (internalizeCandidates, publicCandidates, nodes) = GetPreWriteAccessibilityCandidates(providers);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                var providerName = GetProviderTypeName(provider.Type);
                if (internalizeCandidates.Contains(providerName))
                {
                    if (provider.DeclaringTypeProvider is null)
                    {
                        provider.PreserveXmlDocs();
                    }
                    provider.Update(modifiers: MakeInternal(provider.DeclarationModifiers));
                }
                else if (publicCandidates.Contains(providerName) && !IsGeneratedInternalImplementation(provider))
                {
                    provider.Update(modifiers: MakePublic(provider.DeclarationModifiers));
                }
            }

            RemoveMethodsFromModelFactory(internalizeCandidates, nodes);
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

            // Build two graphs from provider metadata: the full implementation graph for removal,
            // and the public-surface graph for accessibility decisions.
            var graph = BuildGraph(generatedProviders);
            var customInternalDeclarations = GetCustomCodeInternalGeneratedTypeDeclarations(generatedProviders, graph.Nodes);
            var generatedInternalDeclarations = GetGeneratedInternalTypeDeclarations(generatedProviders, graph.Nodes);
            var unionItemTypeExclusions = new HashSet<string>(customInternalDeclarations, StringComparer.Ordinal);
            unionItemTypeExclusions.UnionWith(generatedInternalDeclarations);
            AddAbstractModelDeclarations(generatedProviders, unionItemTypeExclusions, graph.Nodes);
            var publicGraph = BuildGraph(generatedProviders, publicOnly: true, unionItemTypeExclusions);

            var customPublicRoots = GetCustomCodePublicGeneratedTypeRoots(generatedProviders, graph.Nodes, unionItemTypeExclusions);
            var customCodeRemovalRoots = GetCustomCodeGeneratedTypeRoots(generatedProviders, graph.Nodes);
            var customRemovalRoots = new HashSet<string>(customCodeRemovalRoots, StringComparer.Ordinal);

            // Helper types are rooted after an initial reachability pass so unused infrastructure
            // such as change-tracking dictionaries can still be removed when no reachable type needs them.
            var generatedDiscriminatorBaseNames = GetGeneratedPersistableModelProxyTypeNames(generatedProviders, publicGraph.Nodes);
            var (internalizeCandidates, publicCandidates, _) = GetAccessibilityCandidates(
                providers,
                generatedProviders,
                graph,
                publicGraph,
                customPublicRoots,
                customInternalDeclarations,
                generatedInternalDeclarations,
                generatedDiscriminatorBaseNames);

            var removeCandidates = new HashSet<string>(StringComparer.Ordinal);
            if (Configuration.UnreferencedTypesHandling == Configuration.UnreferencedTypesHandlingOption.RemoveOrInternalize)
            {
                // Body-only generated dependencies are needed to avoid deleting helper files, but they do
                // not contribute to public API reachability for internalization.
                AddGeneratedBodyReferences(providers, graph);
                removeCandidates = GetRemovalCandidates(
                    providers,
                    generatedProviders,
                    graph,
                    customRemovalRoots,
                    generatedDiscriminatorBaseNames);
            }

            _latestResult = new ProviderReferenceMapResult(
                internalizeCandidates,
                publicCandidates,
                removeCandidates,
                graph.Nodes);
            if (Configuration.UnreferencedTypesHandling == Configuration.UnreferencedTypesHandlingOption.RemoveOrInternalize)
            {
                RemoveMethodsFromModelFactory(removeCandidates, graph.Nodes);
            }
        }

        private static (HashSet<string> InternalizeCandidates, HashSet<string> PublicCandidates, HashSet<string> Nodes) GetPreWriteAccessibilityCandidates(IReadOnlyList<TypeProvider> providers)
        {
            var generatedProviders = GetGeneratedProviders(providers);
            var graph = BuildGraph(generatedProviders);
            var customInternalDeclarations = GetCustomCodeInternalGeneratedTypeDeclarations(generatedProviders, graph.Nodes);
            var generatedInternalDeclarations = GetGeneratedInternalTypeDeclarations(generatedProviders, graph.Nodes);
            var unionItemTypeExclusions = new HashSet<string>(customInternalDeclarations, StringComparer.Ordinal);
            unionItemTypeExclusions.UnionWith(generatedInternalDeclarations);
            AddAbstractModelDeclarations(generatedProviders, unionItemTypeExclusions, graph.Nodes);
            var publicGraph = BuildGraph(generatedProviders, publicOnly: true, unionItemTypeExclusions);
            var customPublicRoots = GetCustomCodePublicGeneratedTypeRoots(generatedProviders, graph.Nodes, unionItemTypeExclusions);
            var generatedDiscriminatorBaseNames = new HashSet<string>(StringComparer.Ordinal);

            var (internalizeCandidates, publicCandidates, _) = GetAccessibilityCandidates(
                providers,
                generatedProviders,
                graph,
                publicGraph,
                customPublicRoots,
                customInternalDeclarations,
                generatedInternalDeclarations,
                generatedDiscriminatorBaseNames);

            return (internalizeCandidates, publicCandidates, graph.Nodes);
        }

        /// <summary>
        /// Computes accessibility changes by traversing public signatures from explicit API roots,
        /// then propagating internal boundaries and determining which reachable declarations must be public.
        /// </summary>
        private static (HashSet<string> InternalizeCandidates, HashSet<string> PublicCandidates, HashSet<string> InternalizeHelperRoots) GetAccessibilityCandidates(
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

            // Build the public API roots and add derived-model edges that are known only after traversal.
            var internalizeRoots = GetRootNames(
                providers,
                graph.Nodes,
                helperRoots: [],
                includeModelFactory: false,
                includeAdditionalRoots: true,
                publicClientRootsOnly: true);

            var generatedPublicReachable = GetReachableTypes(internalizeRoots, internalizeReferences);
            AddDerivedModelReferences(providers, publicGraph.Nodes, internalizeReferences, generatedPublicReachable, generatedDiscriminatorBaseNames);
            internalizeRoots.UnionWith(customPublicRoots);
            var internalizeReachableWithoutHelpers = GetReachableTypes(internalizeRoots, internalizeReferences);
            AddDerivedModelReferences(providers, publicGraph.Nodes, internalizeReferences, internalizeReachableWithoutHelpers, generatedDiscriminatorBaseNames);
            internalizeReachableWithoutHelpers = GetReachableTypes(internalizeRoots, internalizeReferences);
            var publicRoots = new HashSet<string>(internalizeRoots, StringComparer.Ordinal);
            var publicApiReferences = CloneReferences(publicGraph.References);
            var internalizeHelperRoots = GetHelperRootNames(generatedProviders, graph.Nodes, internalizeReachableWithoutHelpers, graph.References);
            internalizeRoots.UnionWith(internalizeHelperRoots);
            var internalizeDeclaredNodes = GetGeneratedDeclaredNodes(generatedProviders, graph.Nodes, publicOnly: true);
            var customInternalBoundaryNodes = GetCustomInternalBoundaryNodes(publicGraph, customInternalDeclarations);
            var publicDeclaredNodes = GetPublicDeclaredNodes(generatedProviders, graph.Nodes);
            var generatedImplementationInternalDeclarations = GetGeneratedImplementationInternalTypeDeclarations(generatedProviders, generatedInternalDeclarations);
            var publicApiTraversalNodes = GetPublicApiTraversalNodes(
                internalizeDeclaredNodes,
                publicDeclaredNodes,
                generatedInternalDeclarations,
                generatedImplementationInternalDeclarations);

            // First determine everything that cannot remain public, including transitive internal-only
            // dependencies and nested types whose declaring type becomes internal.
            var publicReachable = GetReachableTypes(publicRoots, internalizeReferences, publicApiTraversalNodes);
            var internalizeCandidates = GetInternalizeCandidates(
                internalizeDeclaredNodes,
                publicReachable,
                customInternalDeclarations,
                generatedInternalDeclarations,
                customInternalBoundaryNodes,
                customPublicRoots,
                publicRoots,
                graph.Nodes,
                internalizeReferences);
            AddNestedInternalizeCandidates(generatedProviders, internalizeCandidates, graph.Nodes);
            AddInternalOnlyDependencyCandidates(
                internalizeDeclaredNodes,
                internalizeCandidates,
                customInternalDeclarations,
                generatedInternalDeclarations,
                publicRoots,
                internalizeReferences,
                generatedImplementationInternalDeclarations);
            RemovePublicApiExposedCandidates(
                internalizeDeclaredNodes,
                internalizeCandidates,
                customInternalDeclarations,
                internalizeReferences);
            AddNestedInternalizeCandidates(generatedProviders, internalizeCandidates, graph.Nodes);

            // Recompute reachability without internalized roots, then promote only declarations that
            // are still exposed by a public predecessor.
            publicRoots.ExceptWith(internalizeCandidates);
            publicReachable = GetReachableTypes(publicRoots, internalizeReferences, publicApiTraversalNodes);
            var publicRootExclusions = GetRootNames(
                providers,
                graph.Nodes,
                helperRoots: [],
                includeModelFactory: true,
                includeAdditionalRoots: true,
                publicClientRootsOnly: true);
            var publicCandidates = GetPublicCandidates(
                publicDeclaredNodes,
                publicReachable,
                customInternalDeclarations,
                customInternalBoundaryNodes,
                internalizeHelperRoots,
                publicRootExclusions,
                generatedInternalDeclarations,
                publicRoots,
                publicApiReferences,
                internalizeReferences,
                generatedImplementationInternalDeclarations);
            return (internalizeCandidates, publicCandidates, internalizeHelperRoots);
        }

        private static ProviderReferenceGraph BuildGraph(
            IReadOnlyList<TypeProvider> generatedProviders,
            bool publicOnly = false,
            HashSet<string>? unionItemTypeExclusions = null)
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
                var providerNamespace = provider.Type.Namespace;
                AddTypeReference(references[current], provider.Type, nodes, serializationReferenceNamesByType, providerNamespace, unionItemTypeExclusions: unionItemTypeExclusions);
                AddTypeReference(references[current], provider.BaseType, nodes, serializationReferenceNamesByType, providerNamespace, unionItemTypeExclusions: unionItemTypeExclusions);
                AddTypeReference(references[current], provider.DeclaringTypeProvider?.Type, nodes, serializationReferenceNamesByType, providerNamespace, unionItemTypeExclusions: unionItemTypeExclusions);

                if (publicOnly && !provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                {
                    continue;
                }

                if (!publicOnly && IsKept(provider.Type, CodeModelGenerator.Instance.NonRootTypes, nodes))
                {
                    continue;
                }

                // Model factory signatures mention many models, but methods for unreachable models
                // are removed with those models. Only helper dependencies contribute reachability.
                if (IsModelFactoryProvider(provider))
                {
                    continue;
                }

                foreach (var implementedType in provider.Implements)
                {
                    AddTypeReference(references[current], implementedType, nodes, serializationReferenceNamesByType, providerNamespace, unionItemTypeExclusions: unionItemTypeExclusions);
                }

                if (!publicOnly)
                {
                    foreach (var nestedType in provider.NestedTypes)
                    {
                        AddTypeReference(references[current], nestedType.Type, nodes, serializationReferenceNamesByType, providerNamespace);
                    }
                }

                if (!publicOnly)
                {
                    foreach (var serializationProvider in provider.SerializationProviders)
                    {
                        AddTypeReference(references[current], serializationProvider.Type, nodes, serializationReferenceNamesByType, providerNamespace);
                    }
                }

                foreach (var signatureDependency in provider.SignatureDependencyTypes)
                {
                    AddTypeReference(references[current], signatureDependency, nodes, serializationReferenceNamesByType, providerNamespace, unionItemTypeExclusions: unionItemTypeExclusions);
                }

                foreach (var property in provider.Properties)
                {
                    if (publicOnly && !IsPublic(property.Modifiers))
                    {
                        continue;
                    }

                    AddTypeReference(references[current], property.Type, nodes, serializationReferenceNamesByType, providerNamespace, unionItemTypeExclusions: unionItemTypeExclusions);
                    AddTypeReference(references[current], property.ExplicitInterface, nodes, serializationReferenceNamesByType, providerNamespace, unionItemTypeExclusions: unionItemTypeExclusions);
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

                    AddTypeReference(references[current], field.Type, nodes, serializationReferenceNamesByType, providerNamespace, unionItemTypeExclusions: unionItemTypeExclusions);
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

                    AddSignatureReferences(references[current], constructor.Signature, nodes, serializationReferenceNamesByType, includeAttributes: !publicOnly, includeAttributeArguments: false, providerNamespace: providerNamespace, unionItemTypeExclusions: unionItemTypeExclusions);
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

                    AddSignatureReferences(references[current], method.Signature, nodes, serializationReferenceNamesByType, includeAttributes: !publicOnly, includeAttributeArguments: false, providerNamespace: providerNamespace, unionItemTypeExclusions: unionItemTypeExclusions);
                }
            }

            return new ProviderReferenceGraph(nodes, references);
        }

        private static Dictionary<string, string[]> GetSerializationProviderNamesByType(IReadOnlyList<TypeProvider> generatedProviders)
        {
            var namesByType = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);
            foreach (var provider in generatedProviders)
            {
                if (provider.SerializationProviderOwner is { } owner)
                {
                    AddSerializationProviderName(owner.Type, provider.Type);
                }

                if (provider.SerializationProviders.Count == 0)
                {
                    continue;
                }

                foreach (var serializationProvider in provider.SerializationProviders)
                {
                    AddSerializationProviderName(provider.Type, serializationProvider.Type);
                }
            }

            var result = new Dictionary<string, string[]>(StringComparer.Ordinal);
            foreach (var (providerName, serializationProviderNames) in namesByType)
            {
                result.Add(providerName, [.. serializationProviderNames]);
            }

            return result;

            void AddSerializationProviderName(CSharpType ownerType, CSharpType serializationProviderType)
            {
                var ownerName = GetProviderTypeName(ownerType);
                if (!namesByType.TryGetValue(ownerName, out var serializationProviderNames))
                {
                    serializationProviderNames = new HashSet<string>(StringComparer.Ordinal);
                    namesByType.Add(ownerName, serializationProviderNames);
                }

                serializationProviderNames.Add(GetProviderTypeName(serializationProviderType));
            }
        }

        private static bool IsPublic(MethodSignatureModifiers modifiers) => modifiers.HasFlag(MethodSignatureModifiers.Public);
        private static bool IsPublic(FieldModifiers modifiers) => modifiers.HasFlag(FieldModifiers.Public);

        private static TypeSignatureModifiers MakeInternal(TypeSignatureModifiers modifiers)
            => (modifiers & ~(TypeSignatureModifiers.Public | TypeSignatureModifiers.Private | TypeSignatureModifiers.Protected)) | TypeSignatureModifiers.Internal;

        private static TypeSignatureModifiers MakePublic(TypeSignatureModifiers modifiers)
            => (modifiers & ~(TypeSignatureModifiers.Internal | TypeSignatureModifiers.Private | TypeSignatureModifiers.Protected)) | TypeSignatureModifiers.Public;

        private sealed record ProviderReferenceGraph(
            HashSet<string> Nodes,
            Dictionary<string, HashSet<string>> References);
    }
}
