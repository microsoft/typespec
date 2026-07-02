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

                if (!publicOnly && IsKept(provider.Type, CodeModelGenerator.Instance.NonRootTypes, nodes))
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
    }
}
