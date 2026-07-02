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

        private static bool IsClientProviderRoot(TypeProvider provider, bool publicOnly) =>
            provider.IsClientProvider &&
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
    }
}
