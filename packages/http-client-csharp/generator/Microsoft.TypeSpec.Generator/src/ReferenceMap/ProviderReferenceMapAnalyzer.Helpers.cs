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
        private static bool IsKept(CSharpType type, HashSet<string> roots, HashSet<string> nodes)
        {
            var providerName = GetProviderTypeName(type);
            return IsKeptName(providerName, type.Name, roots, nodes);
        }

        private static bool IsKeptName(string providerName, HashSet<string> roots, HashSet<string> nodes)
        {
            return IsKeptName(providerName, StripGenericArity(GetSimpleName(providerName)), roots, nodes);
        }

        private static bool IsKeptName(string providerName, string simpleName, HashSet<string> roots, HashSet<string> nodes)
        {
            return MatchesGeneratedNode(providerName, simpleName, roots, nodes);
        }

        private static bool MatchesGeneratedNode(
            string providerName,
            string simpleName,
            HashSet<string> candidateNames,
            HashSet<string> nodes,
            bool ignoreGenericArity = true)
        {
            if (candidateNames.Contains(providerName) && nodes.Contains(providerName))
            {
                return true;
            }

            var simpleNameLookup = ignoreGenericArity
                ? _simpleNameLookupCache.GetValue(nodes, BuildSimpleNameLookup)
                : _metadataSimpleNameLookupCache.GetValue(nodes, BuildMetadataSimpleNameLookup);
            if (!simpleNameLookup.TryGetValue(simpleName, out var matches) || matches.Length != 1)
            {
                return false;
            }

            var matchingNode = matches[0];
            return (string.Equals(providerName, simpleName, StringComparison.Ordinal) ||
                    string.Equals(providerName, matchingNode, StringComparison.Ordinal)) &&
                (candidateNames.Contains(matchingNode) || candidateNames.Contains(simpleName));
        }

        private static bool IsClientProviderRoot(TypeProvider provider, bool publicOnly) =>
            provider.IsClientProvider &&
            (!publicOnly || provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));

        private static bool IsAdditionalRootProvider(TypeProvider provider, HashSet<string> roots, HashSet<string> nodes)
        {
            return provider.DeclaringTypeProvider == null && IsKept(provider.Type, roots, nodes);
        }

        private static bool IsModelFactoryProvider(TypeProvider provider)
            => provider is ModelFactoryProvider;

        private static bool IsGeneratedInternalHelperDeclaration(TypeProvider provider)
        {
            if (provider is ModelProvider ||
                provider is EnumProvider ||
                IsModelFactoryProvider(provider) ||
                provider.DeclaringTypeProvider != null ||
                provider.SerializationProviders.Count > 0 ||
                IsModelSerializationProviderDeclaration(provider))
            {
                return false;
            }

            return !string.Equals(provider.RelativeFilePath, Path.Combine("src", "Generated", "Models", $"{provider.Name}.cs"), StringComparison.Ordinal);
        }

        private static bool IsModelSerializationProviderDeclaration(TypeProvider provider) =>
            provider.SerializationProviderOwner != null;

        private static HashSet<string> GetHelperRootNames(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> nodes,
            HashSet<string> reachableTypes,
            IReadOnlyDictionary<string, HashSet<string>>? references = null,
            bool includeModelSerializationProviders = false)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            var generatedHelperNames = references == null ? null : GetGeneratedHelperNames(providers, nodes, includeModelSerializationProviders);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                var providerName = GetProviderTypeName(provider.Type);
                var isModelFactory = IsModelFactoryProvider(provider);
                if (!reachableTypes.Contains(providerName) && !isModelFactory)
                {
                    continue;
                }

                AddHelperDependencies(roots, provider.HelperDependencyTypes, nodes, references == null ? null : references[providerName], provider.Type.Namespace);
                if (references != null)
                {
                    AddReferencedHelperRoots(roots, references[providerName], generatedHelperNames!);
                }

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

        private static HashSet<string> GetGeneratedHelperNames(IReadOnlyList<TypeProvider> providers, HashSet<string> nodes, bool includeModelSerializationProviders)
        {
            var helpers = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                if (!IsGeneratedInternalHelperDeclaration(provider) &&
                    (!includeModelSerializationProviders || !IsModelSerializationProviderDeclaration(provider)))
                {
                    continue;
                }

                var providerName = GetProviderTypeName(provider.Type);
                if (nodes.Contains(providerName))
                {
                    helpers.Add(providerName);
                }
            }

            return helpers;
        }

        private static void AddReferencedHelperRoots(HashSet<string> roots, HashSet<string> referencedNames, HashSet<string> generatedHelperNames)
        {
            foreach (var referencedName in referencedNames)
            {
                if (generatedHelperNames.Contains(referencedName))
                {
                    roots.Add(referencedName);
                }
            }
        }

        private static void AddParameterValidationHelperRoot(HashSet<string> roots, ParameterProvider parameter, HashSet<string> nodes)
        {
            if (parameter.Validation != ParameterValidationType.None)
            {
                AddTypeReference(roots, new ArgumentDefinition().Type, nodes);
            }
        }

        private static void AddHelperDependencies(
            HashSet<string> roots,
            IReadOnlyList<CSharpType> dependencies,
            HashSet<string> nodes,
            HashSet<string>? referencedNames,
            string? providerNamespace)
        {
            foreach (var dependency in dependencies)
            {
                var matches = new HashSet<string>(StringComparer.Ordinal);
                AddTypeReference(matches, dependency, nodes);
                AddProviderNamespaceDependencyMatches(matches, dependency, providerNamespace, nodes);
                foreach (var match in matches)
                {
                    roots.Add(match);
                }
            }
        }

        private static void AddProviderNamespaceDependencyMatches(HashSet<string> matches, CSharpType? dependency, string? providerNamespace, HashSet<string> nodes)
        {
            if (dependency == null || string.IsNullOrEmpty(providerNamespace))
            {
                return;
            }

            AddNamespaceBodyDependencyName(matches, providerNamespace, dependency, nodes);
            foreach (var argument in dependency.Arguments)
            {
                AddProviderNamespaceDependencyMatches(matches, argument, providerNamespace, nodes);
            }
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

        private static void AddUnambiguousMatchingName(HashSet<string> target, string name, HashSet<string> nodes)
        {
            if (nodes.Contains(name))
            {
                target.Add(name);
                return;
            }

            var simpleNameLookup = _simpleNameLookupCache.GetValue(nodes, BuildSimpleNameLookup);
            if (simpleNameLookup.TryGetValue(name, out var matches) && matches.Length == 1)
            {
                target.Add(matches[0]);
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
            => BuildSimpleNameLookup(nodes, ignoreGenericArity: true);

        private static Dictionary<string, string[]> BuildMetadataSimpleNameLookup(HashSet<string> nodes)
            => BuildSimpleNameLookup(nodes, ignoreGenericArity: false);

        private static Dictionary<string, string[]> BuildSimpleNameLookup(
            HashSet<string> nodes,
            bool ignoreGenericArity)
        {
            var lookup = new Dictionary<string, List<string>>(StringComparer.Ordinal);
            foreach (var node in nodes)
            {
                if (IsNestedNode(node, nodes))
                {
                    continue;
                }

                var simpleName = GetSimpleName(node);
                if (ignoreGenericArity)
                {
                    simpleName = StripGenericArity(simpleName);
                }
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

        private static bool IsNestedNode(string node, HashSet<string> nodes)
        {
            var dotIndex = node.IndexOf('.');
            while (dotIndex >= 0)
            {
                if (nodes.Contains(node.Substring(0, dotIndex)))
                {
                    return true;
                }

                dotIndex = node.IndexOf('.', dotIndex + 1);
            }

            return false;
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
            HashSet<string> publicReachable,
            HashSet<string> generatedImplementationInternalDeclarations)
            => HasPublicApiPredecessor(name, references, publicReachable, excludedPredecessors: null, generatedImplementationInternalDeclarations);

        private static bool HasPublicApiPredecessor(
            string name,
            IReadOnlyDictionary<string, HashSet<string>> references,
            HashSet<string> publicReachable,
            HashSet<string>? excludedPredecessors,
            HashSet<string> generatedImplementationInternalDeclarations)
        {
            foreach (var (owner, children) in references)
            {
                if (!publicReachable.Contains(owner) ||
                    string.Equals(owner, name, StringComparison.Ordinal) ||
                    excludedPredecessors?.Contains(owner) == true ||
                    generatedImplementationInternalDeclarations.Contains(owner) ||
                    !children.Contains(name))
                {
                    continue;
                }

                return true;
            }

            return false;
        }

        private static HashSet<string> GetRootNames(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> nodes,
            HashSet<string> helperRoots,
            bool includeModelFactory,
            bool includeAdditionalRoots,
            bool publicClientRootsOnly)
        {
            var generator = CodeModelGenerator.Instance;
            var roots = new HashSet<string>(StringComparer.Ordinal);
            var modelFactoryName = GetProviderTypeName(generator.OutputLibrary.ModelFactory.Value.Type);

            foreach (var provider in providers)
            {
                var name = GetProviderTypeName(provider.Type);
                if (IsClientProviderRoot(provider, publicClientRootsOnly) ||
                    includeAdditionalRoots && IsAdditionalRootProvider(provider, generator.AdditionalRootTypes, nodes) ||
                    includeModelFactory && string.Equals(name, modelFactoryName, StringComparison.Ordinal) ||
                    includeModelFactory && helperRoots.Contains(name))
                {
                    roots.Add(name);
                }
            }

            return roots;
        }

        private static HashSet<string> GetLastContractPublicRoots(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> nodes)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in providers)
            {
                if (!IsPublicInLastContract(provider))
                {
                    continue;
                }

                var providerName = GetProviderTypeName(provider.Type);
                if (nodes.Contains(providerName))
                {
                    roots.Add(providerName);
                }
            }

            return roots;
        }

        private static bool IsPublicInLastContract(TypeProvider provider)
        {
            for (TypeProvider? current = provider; current != null; current = current.DeclaringTypeProvider)
            {
                if (current.LastContractView is not { } lastContractView ||
                    !lastContractView.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                {
                    return false;
                }
            }

            return true;
        }

        private static void RemoveMethodsFromModelFactory(HashSet<string> namesToRemove, HashSet<string> nodes)
        {
            if (namesToRemove.Count == 0)
            {
                return;
            }

            var modelFactory = CodeModelGenerator.Instance.OutputLibrary.ModelFactory.Value;
            _preWriteModelFactory = modelFactory;
            _preWriteModelFactoryMethods ??= [.. modelFactory.Methods];
            var removedLeadingMethod = false;
            var methodsToKeep = new List<MethodProvider>();
            for (int i = 0; i < modelFactory.Methods.Count; i++)
            {
                var method = modelFactory.Methods[i];
                if (!ShouldRemoveModelFactoryMethod(method, namesToRemove, nodes))
                {
                    methodsToKeep.Add(method);
                    continue;
                }

                if (i == 0)
                {
                    removedLeadingMethod = true;
                }
            }

            if (removedLeadingMethod && methodsToKeep.Count > 0)
            {
                modelFactory.PreserveLeadingMethodSeparator = true;
            }

            modelFactory.Update(methods: methodsToKeep);
        }

        private static bool ShouldRemoveModelFactoryMethod(
            MethodProvider method,
            HashSet<string> namesToRemove,
            HashSet<string> nodes)
        {
            if (method.Signature.ReturnType == null)
            {
                return MatchesGeneratedNode(
                    method.Signature.Name,
                    method.Signature.Name,
                    namesToRemove,
                    nodes);
            }

            var returnTypeName = GetProviderTypeName(method.Signature.ReturnType);
            return MatchesGeneratedNode(
                returnTypeName,
                StripGenericArity(GetSimpleName(returnTypeName)),
                namesToRemove,
                nodes);
        }

        private static HashSet<string> GetGeneratedDeclaredNodes(IReadOnlyList<TypeProvider> providers, HashSet<string> nodes, bool publicOnly)
        {
            var generator = CodeModelGenerator.Instance;
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
                if (!nodes.Contains(name))
                {
                    continue;
                }

                declaredNodes.Add(name);
            }

            return declaredNodes;
        }

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

        private static HashSet<string> GetCustomCodePublicGeneratedTypeRoots(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> generatedTypeNames,
            HashSet<string> unionItemTypeExclusions)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            foreach (var customCodeView in GetCustomCodeViews(providers))
            {
                if (!customCodeView.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                {
                    continue;
                }

                AddCustomCodeViewGeneratedTypeRoot(roots, customCodeView, generatedTypeNames);
                AddCustomCodeViewRoots(roots, customCodeView, generatedTypeNames, publicOnly: true, unionItemTypeExclusions);
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

            foreach (var customTypeProvider in CodeModelGenerator.Instance.SourceInputModel.CustomizationTypeProviders)
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
            bool publicOnly,
            HashSet<string>? unionItemTypeExclusions = null)
        {
            var containingProviderTypeName = NormalizeMetadataTypeName(GetCustomCodeViewIdentity(customCodeView));
            var contextualTypeExclusions = customCodeView.Type.Arguments
                .Select(argument => argument.Name)
                .ToHashSet(StringComparer.Ordinal);
            AddTypeReference(roots, customCodeView.BaseType, generatedTypeNames, unionItemTypeExclusions: unionItemTypeExclusions);
            AddProviderBodyDependencyTypes(roots, customCodeView.SignatureDependencyTypes, generatedTypeNames, includeUnqualifiedSimpleNameReferences: true);
            if (!publicOnly)
            {
                AddProviderBodyDependencyTypes(roots, customCodeView.BodyDependencyTypes, generatedTypeNames);
                AddCustomCodeViewNamespaceBodyDependencyTypes(roots, customCodeView, generatedTypeNames);
                AddAttributes(roots, customCodeView.Attributes, generatedTypeNames, serializationProviderNamesByType: null, includeArguments: true);
            }

            foreach (var implementedType in customCodeView.Implements)
            {
                AddTypeReference(roots, implementedType, generatedTypeNames, unionItemTypeExclusions: unionItemTypeExclusions);
            }

            foreach (var constructor in customCodeView.Constructors)
            {
                if (publicOnly && !IsPublic(constructor.Signature.Modifiers))
                {
                    continue;
                }

                AddSignatureReferences(
                    roots,
                    constructor.Signature,
                    generatedTypeNames,
                    serializationProviderNamesByType: null,
                    includeAttributes: !publicOnly,
                    containingProviderTypeName: containingProviderTypeName,
                    contextualTypeExclusions: contextualTypeExclusions,
                    unionItemTypeExclusions: unionItemTypeExclusions);
            }

            foreach (var method in customCodeView.Methods)
            {
                if (publicOnly && !IsPublic(method.Signature.Modifiers))
                {
                    continue;
                }

                AddSignatureReferences(
                    roots,
                    method.Signature,
                    generatedTypeNames,
                    serializationProviderNamesByType: null,
                    includeAttributes: !publicOnly,
                    containingProviderTypeName: containingProviderTypeName,
                    contextualTypeExclusions: contextualTypeExclusions,
                    unionItemTypeExclusions: unionItemTypeExclusions);
            }

            foreach (var property in customCodeView.Properties)
            {
                if (publicOnly && !IsPublic(property.Modifiers))
                {
                    continue;
                }

                AddTypeReference(
                    roots,
                    property.Type,
                    generatedTypeNames,
                    containingProviderTypeName: containingProviderTypeName,
                    contextualTypeExclusions: contextualTypeExclusions,
                    unionItemTypeExclusions: unionItemTypeExclusions);
                AddTypeReference(roots, property.ExplicitInterface, generatedTypeNames, unionItemTypeExclusions: unionItemTypeExclusions);
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

                AddTypeReference(
                    roots,
                    field.Type,
                    generatedTypeNames,
                    containingProviderTypeName: containingProviderTypeName,
                    contextualTypeExclusions: contextualTypeExclusions,
                    unionItemTypeExclusions: unionItemTypeExclusions);
                if (!publicOnly)
                {
                    AddAttributes(roots, field.Attributes, generatedTypeNames, serializationProviderNamesByType: null, includeArguments: true);
                }
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

        private static bool AddExactMetadataNameMatch(HashSet<string> target, string metadataName, HashSet<string> generatedTypeNames)
        {
            var normalizedName = NormalizeMetadataTypeName(metadataName);
            if (!string.IsNullOrEmpty(normalizedName) && generatedTypeNames.Contains(normalizedName))
            {
                target.Add(normalizedName);
                return true;
            }

            return false;
        }

        private static string NormalizeMetadataTypeName(string metadataName)
        {
            var arrayIndex = metadataName.IndexOf('[', StringComparison.Ordinal);
            if (arrayIndex > 0)
            {
                metadataName = metadataName.Substring(0, arrayIndex);
            }

            return metadataName.Replace('+', '.');
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

        private static HashSet<string> GetGeneratedInternalTypeDeclarations(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> generatedTypeNames)
        {
            var declarations = new HashSet<string>(StringComparer.Ordinal);
            var nonInternalDeclarations = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                if (IsModelSerializationProviderDeclaration(provider))
                {
                    continue;
                }

                if (provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal))
                {
                    AddTypeReference(declarations, provider.Type, generatedTypeNames);
                }
                else
                {
                    AddTypeReference(nonInternalDeclarations, provider.Type, generatedTypeNames);
                }
            }

            declarations.ExceptWith(nonInternalDeclarations);
            return declarations;
        }

        private static void AddAbstractModelDeclarations(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> unionItemTypeExclusions,
            HashSet<string> generatedTypeNames)
        {
            foreach (var abstractModel in GetGeneratedProviders(providers)
                .OfType<ModelProvider>()
                .Where(provider => provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)))
            {
                AddTypeReference(unionItemTypeExclusions, abstractModel.Type, generatedTypeNames);
            }
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
    }
}
