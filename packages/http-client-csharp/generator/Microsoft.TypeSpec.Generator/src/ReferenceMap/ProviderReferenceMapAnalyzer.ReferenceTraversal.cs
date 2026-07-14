// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator
{
    internal static partial class ProviderReferenceMapAnalyzer
    {
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
            var visited = new HashSet<TypeProvider>();
            foreach (var provider in providers)
            {
                AddGeneratedProvider(generatedProviders, visited, provider);
            }

            return generatedProviders;
        }

        private static void AddGeneratedProvider(List<TypeProvider> generatedProviders, HashSet<TypeProvider> visited, TypeProvider provider)
        {
            if (!visited.Add(provider))
            {
                return;
            }

            generatedProviders.Add(provider);
            foreach (var nestedType in provider.NestedTypes)
            {
                AddGeneratedProvider(generatedProviders, visited, nestedType);
            }

            foreach (var serializationProvider in provider.SerializationProviders)
            {
                AddGeneratedProvider(generatedProviders, visited, serializationProvider);
            }
        }
    }
}
