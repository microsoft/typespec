// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.ClientModel.Utilities
{
    internal static class ModelReaderWriterHelpers
    {
        public static bool ImplementsModelReaderWriter(Type type)
        {
            if (type.IsEnum || type.IsValueType)
            {
                return false;
            }

            return type.GetInterfaces().Any(IsModelReaderWriterInterface);
        }

        public static bool ImplementsModelReaderWriter(TypeProvider typeProvider)
        {
            // Skip serialization providers; their enclosed models are the buildable types.
            if (typeProvider is MrwSerializationTypeDefinition)
            {
                return false;
            }

            if (typeProvider.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Any())
            {
                return true;
            }

            if (typeProvider.Implements.Any(IsModelReaderWriterInterface))
            {
                return true;
            }

            return typeProvider.SerializationProviders.Any(ImplementsModelReaderWriter);
        }

        public static MethodProvider? FindMethodInHierarchy(
            CSharpType type,
            Func<MethodProvider, bool> predicate,
            bool baseTypesFirst,
            HashSet<string>? visited = null)
        {
            visited ??= [];
            if (!visited.Add(type.FullyQualifiedName))
            {
                return null;
            }

            var provider = TryGetTypeProvider(type);
            var method = provider?.Methods.FirstOrDefault(predicate);
            if (!baseTypesFirst && method is not null)
            {
                return method;
            }

            var baseType = provider?.BaseType ?? type.BaseType;
            if (baseType is not null &&
                FindMethodInHierarchy(baseType, predicate, baseTypesFirst, visited) is { } baseMethod)
            {
                return baseMethod;
            }

            return method;
        }

        public static bool IsOverridable(MethodSignatureModifiers modifiers)
            => !modifiers.HasFlag(MethodSignatureModifiers.Sealed) &&
                (modifiers.HasFlag(MethodSignatureModifiers.Virtual) ||
                    modifiers.HasFlag(MethodSignatureModifiers.Override) ||
                    modifiers.HasFlag(MethodSignatureModifiers.Abstract));

        public static TypeProvider? TryGetTypeProvider(CSharpType type)
        {
            if (TryGetMappedTypeProvider(type) is { } provider)
            {
                return provider;
            }

            return TryGetReferencedType(type);
        }

        private static TypeProvider? TryGetMappedTypeProvider(CSharpType type)
        {
            foreach (var (mappedType, provider) in ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap)
            {
                if (mappedType.FullyQualifiedName == type.FullyQualifiedName ||
                    provider is SystemObjectModelProvider systemProvider &&
                    systemProvider.SystemType.FullyQualifiedName == type.FullyQualifiedName)
                {
                    return provider;
                }
            }

            return null;
        }

        private static TypeProvider? TryGetReferencedType(CSharpType type)
            => string.IsNullOrEmpty(type.Namespace)
                ? null
                : CodeModelGenerator.Instance.SourceInputModel.FindForTypeInCustomization(
                    type.Namespace,
                    type.Name,
                    declaringTypeName: type.DeclaringType?.Name,
                    includeReferencedAssemblies: true);

        public static bool IsModelReaderWriterInterface(CSharpType type)
            => type.Namespace == typeof(IJsonModel<>).Namespace &&
                (type.Name == nameof(IJsonModel<object>) ||
                    type.Name == nameof(IPersistableModel<object>));

        private static bool IsModelReaderWriterInterface(Type type)
            => type.IsGenericType &&
                (type.GetGenericTypeDefinition() == typeof(IJsonModel<>) ||
                    type.GetGenericTypeDefinition() == typeof(IPersistableModel<>));
    }
}
