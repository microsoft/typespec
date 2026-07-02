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
        private static HashSet<string> GetRootNames(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> nodes,
            HashSet<string> helperRoots,
            bool includeModelFactory,
            bool includeAdditionalRoots,
            bool includeUnionVariantRoots,
            bool includeModelFactorySignatureRoots,
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

            if (includeModelFactorySignatureRoots)
            {
                AddLastContractModelFactorySignatureRoots(providers, roots, nodes);
            }

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
                if (provider is not ModelProvider ||
                    !unionVariantTypesToKeep.Contains(provider.Type.Name) ||
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
    }
}
