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
                var providerNamespace = provider.Type.Namespace;
                AddTypeReference(references[current], provider.Type, nodes, serializationReferenceNamesByType, providerNamespace);
                AddTypeReference(references[current], provider.BaseType, nodes, serializationReferenceNamesByType, providerNamespace);
                AddTypeReference(references[current], provider.DeclaringTypeProvider?.Type, nodes, serializationReferenceNamesByType, providerNamespace);

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
                    AddTypeReference(references[current], implementedType, nodes, serializationReferenceNamesByType, providerNamespace);
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
                    AddTypeReference(references[current], signatureDependency, nodes, serializationReferenceNamesByType, providerNamespace);
                }

                foreach (var property in provider.Properties)
                {
                    if (publicOnly && !IsPublic(property.Modifiers))
                    {
                        continue;
                    }

                    AddTypeReference(references[current], property.Type, nodes, serializationReferenceNamesByType, providerNamespace);
                    AddTypeReference(references[current], property.ExplicitInterface, nodes, serializationReferenceNamesByType, providerNamespace);
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

                    AddTypeReference(references[current], field.Type, nodes, serializationReferenceNamesByType, providerNamespace);
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

                    AddSignatureReferences(references[current], constructor.Signature, nodes, serializationReferenceNamesByType, includeAttributes: !publicOnly, includeAttributeArguments: false, providerNamespace: providerNamespace);
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

                    AddSignatureReferences(references[current], method.Signature, nodes, serializationReferenceNamesByType, includeAttributes: !publicOnly, includeAttributeArguments: false, providerNamespace: providerNamespace);
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
    }
}
