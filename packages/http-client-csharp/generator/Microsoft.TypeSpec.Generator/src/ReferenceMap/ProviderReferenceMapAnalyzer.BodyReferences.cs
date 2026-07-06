// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator
{
    internal static partial class ProviderReferenceMapAnalyzer
    {
        private static void AddGeneratedBodyReferences(IReadOnlyList<TypeProvider> providers, ProviderReferenceGraph graph)
        {
            foreach (var (provider, isSerializationProvider) in GetBodyReferenceProviders(providers))
            {
                if (IsModelFactoryProvider(provider) ||
                    !IsGeneratedBodyReferenceCandidate(provider, isSerializationProvider))
                {
                    continue;
                }

                var providerName = GetProviderTypeName(provider.Type);
                if (!graph.Nodes.Contains(providerName))
                {
                    continue;
                }

                AddProviderBodyDependencyTypes(
                    graph.References[providerName],
                    GetNonEnumStructuredBodyReferenceTypes(provider, graph.Nodes),
                    graph.Nodes);
                AddProviderBodyDependencyTypes(graph.References[providerName], provider.BodyDependencyTypes, graph.Nodes);
                AddProviderInfrastructureReferences(graph.References[providerName], provider, isSerializationProvider, graph.Nodes);
            }
        }

        private static void AddProviderInfrastructureReferences(HashSet<string> references, TypeProvider provider, bool isSerializationProvider, HashSet<string> nodes)
        {
            AddMatchingName(references, "ProviderConstants", nodes);
            AddMatchingName(references, "TypeFormatters", nodes);

            if (provider.SerializationProviders.Count > 0)
            {
                AddSerializationExtensionReferences(references, provider, nodes);
            }

            if (isSerializationProvider)
            {
                AddMatchingName(references, "Optional", nodes);
                AddMatchingName(references, "ModelSerializationExtensions", nodes);
                AddSerializationExtensionReferences(references, provider, nodes);
            }

            foreach (var method in provider.Methods)
            {
                AddMethodInfrastructureReferences(references, method, nodes);
            }
        }

        private static void AddSerializationExtensionReferences(HashSet<string> references, TypeProvider provider, HashSet<string> nodes)
        {
            AddSerializationExtensionReferences(references, provider.Type, nodes);
            AddSerializationExtensionReferences(references, provider.BaseType, nodes);
            foreach (var implementedType in provider.Implements)
            {
                AddSerializationExtensionReferences(references, implementedType, nodes);
            }

            foreach (var property in provider.Properties)
            {
                AddSerializationExtensionReferences(references, property.Type, nodes);
            }

            foreach (var field in provider.Fields)
            {
                AddSerializationExtensionReferences(references, field.Type, nodes);
            }

            foreach (var constructor in provider.Constructors)
            {
                AddSerializationExtensionReferences(references, constructor.Signature.ReturnType, nodes);
                foreach (var parameter in constructor.Signature.Parameters)
                {
                    AddSerializationExtensionReferences(references, parameter.Type, nodes);
                }
            }

            foreach (var method in provider.Methods)
            {
                AddSerializationExtensionReferences(references, method.Signature.ReturnType, nodes);
                foreach (var parameter in method.Signature.Parameters)
                {
                    AddSerializationExtensionReferences(references, parameter.Type, nodes);
                }
            }
        }

        private static void AddSerializationExtensionReferences(HashSet<string> references, CSharpType? type, HashSet<string> nodes)
        {
            if (type == null)
            {
                return;
            }

            if (string.IsNullOrEmpty(type.Namespace))
            {
                AddMatchingName(references, $"{type.Name}Extensions", nodes);
            }
            else
            {
                AddExactMetadataNameMatch(references, $"{type.Namespace}.{type.Name}Extensions", nodes);
            }
            foreach (var argument in type.Arguments)
            {
                AddSerializationExtensionReferences(references, argument, nodes);
            }
        }

        private static void AddMethodInfrastructureReferences(HashSet<string> references, MethodProvider method, HashSet<string> nodes)
        {
            AddReturnTypeInfrastructureReferences(references, method.Signature.ReturnType, nodes);
        }

        private static void AddReturnTypeInfrastructureReferences(HashSet<string> references, CSharpType? returnType, HashSet<string> nodes)
        {
            var type = UnwrapTask(returnType);
            if (type == null)
            {
                return;
            }

            var typeName = StripGenericArity(type.Name);
            if (string.Equals(typeName, "Pageable", StringComparison.Ordinal))
            {
                AddMatchingName(references, "PageableWrapper", nodes);
            }
            else if (string.Equals(typeName, "AsyncPageable", StringComparison.Ordinal))
            {
                AddMatchingName(references, "AsyncPageableWrapper", nodes);
            }
            else if (string.Equals(typeName, "ArmOperation", StringComparison.Ordinal))
            {
                AddMatchingNamesWithSimpleNameSuffix(references, "ArmOperation", nodes);
                AddMatchingNamesWithSimpleNameSuffix(references, "OperationSource", nodes);
                if (type.Arguments.Count > 0)
                {
                    AddMatchingName(references, $"{BuildOperationSourceTypeName(type.Arguments[0])}OperationSource", nodes);
                }
            }
        }

        private static CSharpType? UnwrapTask(CSharpType? type)
        {
            var typeName = type == null ? null : StripGenericArity(type.Name);
            if ((string.Equals(typeName, "Task", StringComparison.Ordinal) ||
                string.Equals(typeName, "ValueTask", StringComparison.Ordinal)) &&
                type?.Arguments.Count > 0)
            {
                return type.Arguments[0];
            }

            return type;
        }

        private static string BuildOperationSourceTypeName(CSharpType type)
        {
            var argumentNames = string.Join("", type.Arguments.Select(BuildOperationSourceTypeName));
            return $"{type.Name}{(argumentNames.Length > 0 ? "Of" : string.Empty)}{argumentNames}";
        }

        private static IReadOnlyList<CSharpType> GetNonEnumStructuredBodyReferenceTypes(TypeProvider provider, HashSet<string> nodes)
        {
            var references = new List<CSharpType>();
            foreach (var dependency in CollectStructuredBodyReferenceTypes(provider))
            {
                if (!IsEnumProviderDependency(dependency, nodes))
                {
                    references.Add(dependency);
                }
            }

            return references;
        }

        private static IReadOnlyList<CSharpType> CollectStructuredBodyReferenceTypes(TypeProvider provider)
        {
            var references = new HashSet<CSharpType>();
            var visited = new HashSet<object>(ReferenceEqualityComparer.Instance);

            foreach (var field in provider.Fields)
            {
                CollectStructuredBodyReferenceTypes(field.InitializationValue, references, visited);
            }

            foreach (var property in provider.Properties)
            {
                CollectStructuredBodyReferenceTypes(property.Body, references, visited);
            }

            foreach (var constructor in provider.Constructors)
            {
                CollectStructuredBodyReferenceTypes(constructor.BodyExpression, references, visited);
                CollectStructuredBodyReferenceTypes(constructor.BodyStatements, references, visited);
            }

            foreach (var method in provider.Methods)
            {
                if (method.IsMethodSuppressed())
                {
                    continue;
                }

                CollectStructuredBodyReferenceTypes(method.BodyExpression, references, visited);
                CollectStructuredBodyReferenceTypes(method.BodyStatements, references, visited);
            }

            return [.. references];
        }

        private static void CollectStructuredBodyReferenceTypes(object? value, HashSet<CSharpType> references, HashSet<object> visited)
        {
            switch (value)
            {
                case null:
                case string:
                case FormattableString:
                    return;
            }

            if (!value.GetType().IsValueType && !visited.Add(value))
            {
                return;
            }

            switch (value)
            {
                case CSharpType type:
                    references.Add(type);
                    return;
                case Type type:
                    references.Add(type);
                    return;
                case ParameterProvider parameter:
                    references.Add(parameter.Type);
                    CollectStructuredBodyReferenceTypes(parameter.DefaultValue, references, visited);
                    CollectStructuredBodyReferenceTypes(parameter.InitializationValue, references, visited);
                    return;
                case MethodSignatureBase signature:
                    CollectStructuredBodyReferenceTypes(signature.ReturnType, references, visited);
                    CollectStructuredBodyReferenceTypes(signature.Parameters, references, visited);
                    return;
                case KeyValuePair<string, ValueExpression> positionalArgument:
                    CollectStructuredBodyReferenceTypes(positionalArgument.Value, references, visited);
                    return;
                case FieldProvider field:
                    references.Add(field.Type);
                    CollectStructuredBodyReferenceTypes(field.InitializationValue, references, visited);
                    return;
            }

            if (IsStructuredBodyReferenceObject(value))
            {
                foreach (var property in value.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance))
                {
                    if (property.GetIndexParameters().Length > 0)
                    {
                        continue;
                    }

                    CollectStructuredBodyReferenceTypes(property.GetValue(value), references, visited);
                }

                return;
            }

            if (value is not IEnumerable values)
            {
                return;
            }

            foreach (var item in values)
            {
                CollectStructuredBodyReferenceTypes(item, references, visited);
            }
        }

        private static bool IsEnumProviderDependency(CSharpType dependency, HashSet<string> nodes)
        {
            var providerName = GetProviderTypeName(dependency);
            if (!nodes.Contains(providerName))
            {
                return false;
            }

            foreach (var provider in CodeModelGenerator.Instance.OutputLibrary.TypeProviders)
            {
                if (provider is EnumProvider &&
                    string.Equals(GetProviderTypeName(provider.Type), providerName, StringComparison.Ordinal))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool IsStructuredBodyReferenceObject(object value) =>
            value is ValueExpression ||
            value is MethodBodyStatement ||
            value is PropertyBody;

        private static void AddProviderBodyDependencyTypes(
            HashSet<string> references,
            IReadOnlyList<CSharpType> dependencies,
            HashSet<string> nodes,
            bool includeSimpleNameReferences = false,
            bool includeUnqualifiedSimpleNameReferences = false,
            bool includeExtensionReferences = true)
        {
            foreach (var dependency in dependencies)
            {
                AddProviderBodyDependencyType(references, dependency, nodes, includeSimpleNameReferences, includeUnqualifiedSimpleNameReferences, includeExtensionReferences);
            }
        }

        private static void AddProviderBodyDependencyType(
            HashSet<string> references,
            CSharpType? dependency,
            HashSet<string> nodes,
            bool includeSimpleNameReferences,
            bool includeUnqualifiedSimpleNameReferences,
            bool includeExtensionReferences)
        {
            if (dependency == null)
            {
                return;
            }

            AddTypeReference(references, dependency, nodes);
            if (includeSimpleNameReferences &&
                !string.IsNullOrEmpty(dependency.Namespace) &&
                dependency.Arguments.Count == 0)
            {
                AddMatchingName(references, dependency.Name, nodes);
            }
            else if (includeUnqualifiedSimpleNameReferences &&
                string.IsNullOrEmpty(dependency.Namespace) &&
                dependency.Arguments.Count == 0)
            {
                AddUnambiguousMatchingName(references, dependency.Name, nodes);
            }
            if (includeExtensionReferences)
            {
                if (string.IsNullOrEmpty(dependency.Namespace))
                {
                    AddMatchingName(references, $"{dependency.Name}Extensions", nodes);
                }
                else
                {
                    AddExactMetadataNameMatch(references, $"{dependency.Namespace}.{dependency.Name}Extensions", nodes);
                }
            }

            foreach (var argument in dependency.Arguments)
            {
                AddProviderBodyDependencyType(references, argument, nodes, includeSimpleNameReferences, includeUnqualifiedSimpleNameReferences, includeExtensionReferences);
            }
        }

        private static IReadOnlyList<(TypeProvider Provider, bool IsSerializationProvider)> GetBodyReferenceProviders(IReadOnlyList<TypeProvider> providers)
        {
            var bodyReferenceProviders = new List<(TypeProvider Provider, bool IsSerializationProvider)>();
            foreach (var provider in providers)
            {
                bodyReferenceProviders.Add((provider, false));
                foreach (var serializationProvider in provider.SerializationProviders)
                {
                    bodyReferenceProviders.Add((serializationProvider, true));
                }
            }

            return bodyReferenceProviders;
        }

        private static bool IsGeneratedBodyReferenceCandidate(TypeProvider provider, bool isSerializationProvider)
        {
            if (provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Static))
            {
                return true;
            }

            return IsClientProvider(provider) ||
                isSerializationProvider ||
                provider.IncludeGeneratedBodyReferences ||
                provider.HelperDependencyTypes.Count > 0 ||
                provider.BodyDependencyTypes.Count > 0;
        }
    }
}
