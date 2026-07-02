// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator
{
    internal class ProviderReferenceMapBuilder
    {
        private readonly IReadOnlyList<TypeProvider> _providers;

        public ProviderReferenceMapBuilder(IReadOnlyList<TypeProvider> providers)
        {
            _providers = [.. GetAllProviders(providers)];
        }

        public IReadOnlyDictionary<TypeProvider, IReadOnlyList<TypeProvider>> BuildPublicReferenceMap(IEnumerable<TypeProvider> rootTypes)
        {
            var referenceMap = new Dictionary<TypeProvider, IReadOnlyList<TypeProvider>>();
            var visited = new HashSet<TypeProvider>();
            var queue = new Queue<TypeProvider>(rootTypes);

            while (queue.Count > 0)
            {
                var provider = queue.Dequeue();
                if (!visited.Add(provider))
                {
                    continue;
                }

                var referencedTypes = BuildPublicApiReferences(provider.CanonicalView);
                referenceMap[provider] = referencedTypes;
                foreach (var referencedType in referencedTypes)
                {
                    queue.Enqueue(referencedType);
                }
            }

            return referenceMap;
        }

        public static IEnumerable<TypeProvider> GetAllProviders(IEnumerable<TypeProvider> providers)
        {
            foreach (var provider in providers)
            {
                yield return provider;

                foreach (var nestedType in GetAllProviders(provider.CanonicalView.NestedTypes))
                {
                    yield return nestedType;
                }

                foreach (var serializationProvider in provider.SerializationProviders)
                {
                    yield return serializationProvider;
                }
            }
        }

        private IReadOnlyList<TypeProvider> BuildPublicApiReferences(TypeProvider provider)
        {
            var referencedTypes = new HashSet<TypeProvider>();

            AddType(provider.Type, referencedTypes);
            AddType(provider.BaseType, referencedTypes);
            foreach (var implementedType in provider.Implements)
            {
                AddType(implementedType, referencedTypes);
            }

            foreach (var constructor in provider.Constructors.Where(static c => IsPublicApi(c.Signature.Modifiers)))
            {
                AddSignatureTypes(constructor.Signature, referencedTypes);
            }

            foreach (var method in provider.Methods.Where(static m => IsPublicApi(m.Signature.Modifiers)))
            {
                AddSignatureTypes(method.Signature, referencedTypes);
                AddType(method.Signature.ExplicitInterface, referencedTypes);
                foreach (var genericArgument in method.Signature.GenericArguments ?? [])
                {
                    AddType(genericArgument, referencedTypes);
                }
            }

            foreach (var property in provider.Properties.Where(static p => IsPublicApi(p.Modifiers)))
            {
                AddType(property.Type, referencedTypes);
                AddType(property.ExplicitInterface, referencedTypes);
            }

            foreach (var field in provider.Fields.Where(static f => IsPublicApi(f.Modifiers)))
            {
                AddType(field.Type, referencedTypes);
            }

            foreach (var nestedType in provider.NestedTypes.Where(static t => IsPublicApi(t.DeclarationModifiers)))
            {
                AddType(nestedType.Type, referencedTypes);
            }

            return [.. referencedTypes];
        }

        private void AddSignatureTypes(MethodSignatureBase signature, HashSet<TypeProvider> referencedTypes)
        {
            AddType(signature.ReturnType, referencedTypes);
            foreach (var parameter in signature.Parameters)
            {
                AddType(parameter.Type, referencedTypes);
            }
        }

        private void AddType(CSharpType? type, HashSet<TypeProvider> referencedTypes)
        {
            if (type == null)
            {
                return;
            }

            foreach (var provider in ResolveTypes(type))
            {
                referencedTypes.Add(provider);
            }

            AddType(type.BaseType, referencedTypes);
            AddType(type.DeclaringType, referencedTypes);
            foreach (var argument in type.Arguments)
            {
                AddType(argument, referencedTypes);
            }

            if (type.IsUnion)
            {
                foreach (var unionItemType in type.UnionItemTypes)
                {
                    AddType(unionItemType, referencedTypes);
                }
            }
        }

        private IEnumerable<TypeProvider> ResolveTypes(CSharpType type)
        {
            if (type.IsFrameworkType)
            {
                return [];
            }

            if (CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(type, out var provider) && provider != null)
            {
                return _providers.Where(candidate => ReferenceEquals(candidate, provider) || candidate.Type.AreNamesEqual(type));
            }

            return _providers.Where(provider =>
                provider.Type.AreNamesEqual(type) || provider.CanonicalView.Type.AreNamesEqual(type));
        }

        private static bool IsPublicApi(MethodSignatureModifiers modifiers)
            => (modifiers.HasFlag(MethodSignatureModifiers.Public) || modifiers.HasFlag(MethodSignatureModifiers.Protected))
                && !modifiers.HasFlag(MethodSignatureModifiers.Private);

        private static bool IsPublicApi(FieldModifiers modifiers)
            => (modifiers.HasFlag(FieldModifiers.Public) || modifiers.HasFlag(FieldModifiers.Protected))
                && !modifiers.HasFlag(FieldModifiers.Private);

        private static bool IsPublicApi(TypeSignatureModifiers modifiers)
            => (modifiers.HasFlag(TypeSignatureModifiers.Public) || modifiers.HasFlag(TypeSignatureModifiers.Protected))
                && !modifiers.HasFlag(TypeSignatureModifiers.Private);
    }
}
