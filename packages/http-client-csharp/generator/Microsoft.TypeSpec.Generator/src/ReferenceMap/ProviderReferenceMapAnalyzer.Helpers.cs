// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
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
            IsClientProvider(provider) &&
            (!publicOnly ||
                CodeModelGenerator.Instance.SourceInputModel.LastContract == null &&
                provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));

        private static bool IsClientProvider(TypeProvider provider)
        {
            for (var type = provider.GetType(); type != null && type != typeof(TypeProvider); type = type.BaseType)
            {
                if (string.Equals(type.Name, "ClientProvider", StringComparison.Ordinal))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool IsAdditionalRootProvider(TypeProvider provider, HashSet<string> roots, HashSet<string> nodes)
        {
            if (provider.DeclaringTypeProvider != null || !IsKept(provider.Type, roots, nodes))
            {
                return false;
            }

            return provider is not ModelProvider && provider is not EnumProvider;
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

        private static bool IsModelSerializationProviderDeclaration(TypeProvider provider)
        {
            var modelsDirectory = Path.Combine("src", "Generated", "Models");
            var relativeFilePath = provider.RelativeFilePath;
            return relativeFilePath.StartsWith(modelsDirectory + Path.DirectorySeparatorChar, StringComparison.Ordinal) &&
                Path.GetFileNameWithoutExtension(relativeFilePath).Contains(".Serialization", StringComparison.Ordinal);
        }

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
    }
}
