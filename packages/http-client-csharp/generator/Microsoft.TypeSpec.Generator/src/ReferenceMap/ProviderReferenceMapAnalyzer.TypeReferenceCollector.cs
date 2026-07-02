// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator
{
    internal static partial class ProviderReferenceMapAnalyzer
    {
        private static void AddSignatureReferences(
            HashSet<string> references,
            MethodSignatureBase signature,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, string[]>? serializationProviderNamesByType,
            bool includeAttributes = true,
            bool includeAttributeArguments = true)
        {
            AddTypeReference(references, signature.ReturnType, nodes, serializationProviderNamesByType);
            if (includeAttributes)
            {
                AddAttributes(references, signature.Attributes, nodes, serializationProviderNamesByType, includeAttributeArguments);
            }

            foreach (var parameter in signature.Parameters)
            {
                AddTypeReference(references, parameter.Type, nodes, serializationProviderNamesByType);
                if (includeAttributes)
                {
                    AddAttributes(references, parameter.Attributes, nodes, serializationProviderNamesByType, includeAttributeArguments);
                }
            }

            if (signature is MethodSignature methodSignature)
            {
                AddTypeReference(references, methodSignature.ExplicitInterface, nodes, serializationProviderNamesByType);
                if (methodSignature.GenericArguments != null)
                {
                    foreach (var genericArgument in methodSignature.GenericArguments)
                    {
                        AddTypeReference(references, genericArgument, nodes, serializationProviderNamesByType);
                    }
                }

                if (methodSignature.GenericParameterConstraints != null)
                {
                    foreach (var constraint in methodSignature.GenericParameterConstraints)
                    {
                        AddTypeReference(references, constraint.Type, nodes, serializationProviderNamesByType);
                    }
                }
            }

            if (signature is ConstructorSignature constructorSignature)
            {
                AddTypeReference(references, constructorSignature.Type, nodes, serializationProviderNamesByType);
            }
        }

        private static void AddAttributes(
            HashSet<string> references,
            IReadOnlyList<AttributeStatement> attributes,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, string[]>? serializationProviderNamesByType,
            bool includeArguments)
        {
            foreach (var attribute in attributes)
            {
                AddTypeReference(references, attribute.Type, nodes, serializationProviderNamesByType);
                if (!includeArguments)
                {
                    continue;
                }

                foreach (var argument in attribute.Arguments)
                {
                    AddAttributeArgumentReference(references, argument, nodes, serializationProviderNamesByType);
                }

                foreach (var (_, argument) in attribute.PositionalArguments)
                {
                    AddAttributeArgumentReference(references, argument, nodes, serializationProviderNamesByType);
                }
            }
        }

        private static bool IsAttributeNamed(AttributeStatement attribute, string name)
            => string.Equals(attribute.Type.Name, name, StringComparison.Ordinal) ||
                string.Equals(attribute.Type.Name, $"{name}Attribute", StringComparison.Ordinal);

        private static void AddAttributeArgumentReference(
            HashSet<string> references,
            ValueExpression argument,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, string[]>? serializationProviderNamesByType)
        {
            if (argument is TypeOfExpression typeOf)
            {
                AddTypeReference(references, typeOf.Type, nodes, serializationProviderNamesByType);
                AddMatchingName(references, typeOf.Type.Name, nodes);
            }
        }

        private static void AddTypeReference(
            HashSet<string> references,
            CSharpType? type,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, string[]>? serializationProviderNamesByType = null)
        {
            if (type == null)
            {
                return;
            }

            if (type.IsArray)
            {
                AddTypeReference(references, type.ElementType, nodes, serializationProviderNamesByType);
                return;
            }

            var providerTypeName = GetProviderTypeName(type);
            if (nodes.Contains(providerTypeName))
            {
                references.Add(providerTypeName);
                if (serializationProviderNamesByType != null && serializationProviderNamesByType.TryGetValue(providerTypeName, out var serializationProviderNames))
                {
                    foreach (var serializationProviderName in serializationProviderNames)
                    {
                        references.Add(serializationProviderName);
                    }
                }
            }

            AddTypeReference(references, type.BaseType, nodes, serializationProviderNamesByType);
            AddTypeReference(references, type.DeclaringType, nodes, serializationProviderNamesByType);
            foreach (var argument in type.Arguments)
            {
                AddTypeReference(references, argument, nodes, serializationProviderNamesByType);
            }
        }

        private static string GetSimpleName(string fullyQualifiedName)
        {
            var lastDot = fullyQualifiedName.LastIndexOf('.');
            return lastDot < 0 ? fullyQualifiedName : fullyQualifiedName.Substring(lastDot + 1);
        }

        private static string? GetNamespaceName(string fullyQualifiedName)
        {
            var lastDot = fullyQualifiedName.LastIndexOf('.');
            return lastDot < 0 ? null : fullyQualifiedName.Substring(0, lastDot);
        }

        private static string GetProviderTypeName(CSharpType type)
        {
            var name = type.Arguments.Count > 0 && !type.Name.Contains('`', StringComparison.Ordinal)
                ? $"{type.Name}`{type.Arguments.Count}"
                : type.Name;
            return string.IsNullOrEmpty(type.Namespace) ? name : $"{type.Namespace}.{name}";
        }

        private static string StripGenericArity(string name)
        {
            var tick = name.IndexOf('`');
            return tick < 0 ? name : name.Substring(0, tick);
        }
    }
}
