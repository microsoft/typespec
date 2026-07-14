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
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator
{
    internal static partial class ProviderReferenceMapAnalyzer
    {
        private static void AddGeneratedBodyReferences(IReadOnlyList<TypeProvider> providers, ProviderReferenceGraph graph)
        {
            var generatedProviders = GetGeneratedProviders(providers);
            var serializationProviderNamesByType = GetSerializationProviderNamesByType(generatedProviders);
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

                var bodyReferences = CollectStructuredBodyReferences(provider);
                AddStructuredBodyReferenceTypes(
                    graph.References[providerName],
                    provider,
                    bodyReferences.Types,
                    graph.Nodes,
                    serializationProviderNamesByType);
                AddExtensionMethodProviderReferences(
                    graph.References[providerName],
                    bodyReferences.ExtensionMethods,
                    generatedProviders,
                    graph.Nodes);
                AddProviderBodyDependencyTypes(graph.References[providerName], provider.BodyDependencyTypes, graph.Nodes);
                AddGeneratedProviderNamespaceBodyDependencyTypes(graph.References[providerName], provider, graph.Nodes);
            }
        }

        private static void AddGeneratedProviderNamespaceBodyDependencyTypes(HashSet<string> references, TypeProvider provider, HashSet<string> nodes)
        {
            var providerNamespace = provider.Type.Namespace;
            if (string.IsNullOrEmpty(providerNamespace))
            {
                return;
            }

            foreach (var dependency in provider.BodyDependencyTypes)
            {
                AddGeneratedProviderNamespaceBodyDependencyType(references, dependency, providerNamespace, nodes);
            }
        }

        private static void AddGeneratedProviderNamespaceBodyDependencyType(HashSet<string> references, CSharpType? dependency, string providerNamespace, HashSet<string> nodes)
        {
            if (dependency == null)
            {
                return;
            }

            AddNamespaceBodyDependencyName(references, providerNamespace, dependency, nodes);
            foreach (var argument in dependency.Arguments)
            {
                AddGeneratedProviderNamespaceBodyDependencyType(references, argument, providerNamespace, nodes);
            }
        }

        private static void AddNamespaceBodyDependencyName(HashSet<string> references, string providerNamespace, CSharpType dependency, HashSet<string> nodes)
        {
            var dependencyName = GetSimpleName(GetProviderTypeName(dependency));
            AddExactMetadataNameMatch(references, $"{providerNamespace}.{dependencyName}", nodes);
            var aritylessDependencyName = StripGenericArity(dependencyName);
            if (!string.Equals(aritylessDependencyName, dependencyName, StringComparison.Ordinal))
            {
                AddExactMetadataNameMatch(references, $"{providerNamespace}.{aritylessDependencyName}", nodes);
            }
        }

        private static void AddStructuredBodyReferenceTypes(
            HashSet<string> references,
            TypeProvider provider,
            IReadOnlyList<CSharpType> dependencies,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, string[]> serializationProviderNamesByType)
        {
            foreach (var dependency in dependencies)
            {
                if (!IsEnumProviderDependency(dependency, nodes))
                {
                    AddTypeReference(
                        references,
                        dependency,
                        nodes,
                        serializationProviderNamesByType,
                        provider.Type.Namespace);
                }
            }
        }

        private static StructuredBodyReferences CollectStructuredBodyReferences(TypeProvider provider)
        {
            var references = new HashSet<CSharpType>();
            var extensionMethods = new HashSet<ExtensionMethodReference>();
            var visited = new HashSet<object>(ReferenceEqualityComparer.Instance);

            foreach (var field in provider.Fields)
            {
                CollectStructuredBodyReferences(field.InitializationValue, references, extensionMethods, visited);
            }

            foreach (var property in provider.Properties)
            {
                CollectStructuredBodyReferences(property.Body, references, extensionMethods, visited);
            }

            foreach (var constructor in provider.Constructors)
            {
                CollectStructuredBodyReferences(constructor.BodyExpression, references, extensionMethods, visited);
                CollectStructuredBodyReferences(constructor.BodyStatements, references, extensionMethods, visited);
            }

            foreach (var method in provider.Methods)
            {
                if (method.IsMethodSuppressed())
                {
                    continue;
                }

                CollectStructuredBodyReferences(method.BodyExpression, references, extensionMethods, visited);
                CollectStructuredBodyReferences(method.BodyStatements, references, extensionMethods, visited);
            }

            return new([.. references], [.. extensionMethods]);
        }

        private static void CollectStructuredBodyReferences(
            object? value,
            HashSet<CSharpType> references,
            HashSet<ExtensionMethodReference> extensionMethods,
            HashSet<object> visited)
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

            if (value is InvokeMethodExpression { ExtensionType: null, MethodName: { } methodName } invocation)
            {
                var receiverType = GetExpressionType(invocation.InstanceReference);
                if (receiverType != null)
                {
                    extensionMethods.Add(new(methodName, receiverType));
                }
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
                    CollectStructuredBodyReferences(parameter.DefaultValue, references, extensionMethods, visited);
                    CollectStructuredBodyReferences(parameter.InitializationValue, references, extensionMethods, visited);
                    return;
                case MethodSignatureBase signature:
                    CollectStructuredBodyReferences(signature.ReturnType, references, extensionMethods, visited);
                    CollectStructuredBodyReferences(signature.Parameters, references, extensionMethods, visited);
                    return;
                case KeyValuePair<string, ValueExpression> positionalArgument:
                    CollectStructuredBodyReferences(positionalArgument.Value, references, extensionMethods, visited);
                    return;
                case FieldProvider field:
                    references.Add(field.Type);
                    CollectStructuredBodyReferences(field.InitializationValue, references, extensionMethods, visited);
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

                    CollectStructuredBodyReferences(property.GetValue(value), references, extensionMethods, visited);
                }

                return;
            }

            if (value is not IEnumerable values)
            {
                return;
            }

            foreach (var item in values)
            {
                CollectStructuredBodyReferences(item, references, extensionMethods, visited);
            }
        }

        private static CSharpType? GetExpressionType(ValueExpression? expression) =>
            expression switch
            {
                VariableExpression variable => variable.Type,
                ScopedApi scopedApi => scopedApi.Type,
                _ => null
            };

        private static void AddExtensionMethodProviderReferences(
            HashSet<string> references,
            IReadOnlyList<ExtensionMethodReference> extensionMethods,
            IReadOnlyList<TypeProvider> generatedProviders,
            HashSet<string> nodes)
        {
            foreach (var extensionMethod in extensionMethods)
            {
                var provider = FindUniqueExtensionMethodProvider(extensionMethod, generatedProviders);
                if (provider != null)
                {
                    AddTypeReference(references, provider.Type, nodes);
                }
            }
        }

        private static TypeProvider? FindUniqueExtensionMethodProvider(
            ExtensionMethodReference extensionMethod,
            IReadOnlyList<TypeProvider> generatedProviders)
        {
            TypeProvider? match = null;
            foreach (var provider in generatedProviders)
            {
                if (!provider.Methods.Any(method => IsMatchingExtensionMethod(method.Signature, extensionMethod)))
                {
                    continue;
                }

                if (match != null)
                {
                    return null;
                }

                match = provider;
            }

            return match;
        }

        private static bool IsMatchingExtensionMethod(MethodSignature signature, ExtensionMethodReference extensionMethod)
        {
            if (!signature.Modifiers.HasFlag(MethodSignatureModifiers.Extension) ||
                !string.Equals(signature.Name, extensionMethod.Name, StringComparison.Ordinal))
            {
                return false;
            }

            return extensionMethod.ReceiverType == null ||
                signature.Parameters.Count > 0 &&
                string.Equals(
                    GetProviderTypeName(signature.Parameters[0].Type),
                    GetProviderTypeName(extensionMethod.ReceiverType),
                    StringComparison.Ordinal);
        }

        private readonly record struct StructuredBodyReferences(
            IReadOnlyList<CSharpType> Types,
            IReadOnlyList<ExtensionMethodReference> ExtensionMethods);

        private readonly record struct ExtensionMethodReference(string Name, CSharpType? ReceiverType);

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
            bool includeUnqualifiedSimpleNameReferences = false)
        {
            foreach (var dependency in dependencies)
            {
                AddProviderBodyDependencyType(references, dependency, nodes, includeSimpleNameReferences, includeUnqualifiedSimpleNameReferences);
            }
        }

        private static void AddProviderBodyDependencyType(
            HashSet<string> references,
            CSharpType? dependency,
            HashSet<string> nodes,
            bool includeSimpleNameReferences,
            bool includeUnqualifiedSimpleNameReferences)
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
            foreach (var argument in dependency.Arguments)
            {
                AddProviderBodyDependencyType(references, argument, nodes, includeSimpleNameReferences, includeUnqualifiedSimpleNameReferences);
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
            return IsGeneratedImplementationBodyReferenceCandidate(provider, isSerializationProvider) ||
                provider.HelperDependencyTypes.Count > 0 ||
                provider.BodyDependencyTypes.Count > 0;
        }

        private static bool IsGeneratedImplementationBodyReferenceCandidate(TypeProvider provider, bool isSerializationProvider)
        {
            if (provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Static) ||
                IsClientProvider(provider) ||
                isSerializationProvider)
            {
                return true;
            }

            return provider is not ModelProvider &&
                provider is not EnumProvider &&
                !IsModelFactoryProvider(provider) &&
                provider.DeclaringTypeProvider == null &&
                provider.SerializationProviders.Count == 0;
        }
    }
}
