// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class ModelReaderWriterContextDefinition : TypeProvider
    {
        private const string DefaultObsoleteDiagnosticId = "CS0618";

        internal static readonly string s_name = $"{RemovePeriods(ScmCodeModelGenerator.Instance.TypeFactory.PrimaryNamespace)}Context";

        protected override string BuildName() => s_name;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;

        protected override CSharpType[] BuildImplements() => [typeof(ModelReaderWriterContext)];

        protected override IReadOnlyList<MethodBodyStatement> BuildAttributes()
        {
            var attributes = new Dictionary<string, MethodBodyStatement>();

            // Add ModelReaderWriterBuildableAttribute for all IPersistableModel types
            (HashSet<Type> buildableTypes, HashSet<TypeProvider> buildableProviders) = CollectBuildableTypes();
            foreach (var type in buildableTypes)
            {
                // Use the full attribute type name to ensure proper compilation
                var attributeType = new CSharpType(typeof(ModelReaderWriterBuildableAttribute));
                var attributeStatement = new AttributeStatement(attributeType, TypeOf(type));

                string experimentalTypeJustification = $"{type} is experimental and may change in future versions.";
                string obsoleteTypeJustification = $"{type} is obsolete and may be removed in future versions.";

                AddAttributeForType(
                    attributes,
                    attributeStatement,
                    type,
                    experimentalTypeJustification,
                    obsoleteTypeJustification);
            }
            foreach (var provider in buildableProviders)
            {
                // Use the full attribute type name to ensure proper compilation
                var attributeType = new CSharpType(typeof(ModelReaderWriterBuildableAttribute));
                var attributeStatement = new AttributeStatement(attributeType, TypeOf(provider.Type));

                string experimentalTypeJustification = $"{provider.Type} is experimental and may change in future versions.";
                string obsoleteTypeJustification = $"{provider.Type} is obsolete and may be removed in future versions.";

                // If the type is experimental or obsolete, we add a suppression for it
                AddAttributeForType(
                    attributes,
                    attributeStatement,
                    provider,
                    experimentalTypeJustification,
                    obsoleteTypeJustification);
            }

            return attributes.OrderBy(a => a.Key).Select(kvp => kvp.Value).ToList();
        }

        /// <summary>
        /// Collects all types that implement IPersistableModel, including all models and their properties
        /// that are also IPersistableModel types, recursively without duplicates.
        /// </summary>
        private (HashSet<Type> BuildableTypes, HashSet<TypeProvider> BuildableProviders) CollectBuildableTypes()
        {
            var visitedTypes = new HashSet<CSharpType>();
            var visitedTypeProviders = new HashSet<TypeProvider>();
            var buildableProviders = new HashSet<TypeProvider>(new TypeProviderTypeComparer());
            var buildableTypes = new HashSet<Type>();

            // Get all providers from the output library that are models or implement MRW interface types
            var providers = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .Where(t => t is ModelProvider || ImplementsModelReaderWriter(t))
                .ToHashSet();

            // Process each provider recursively
            foreach (var provider in providers)
            {
                CollectBuildableTypeProvidersRecursive(provider, visitedTypes, visitedTypeProviders, buildableProviders, buildableTypes);
            }

            return (buildableTypes, buildableProviders);
        }

        /// <summary>
        /// Recursively collects all types that implement IPersistableModel.
        /// </summary>
        private void CollectBuildableTypesRecursive(
            CSharpType currentType,
            HashSet<CSharpType> visitedTypes,
            HashSet<Type> buildableTypes)
        {
            // Avoid duplicate processing
            if (!ShouldProcessCSharpType(currentType, visitedTypes))
            {
                return;
            }
            CollectBuildableTypesFromFrameworkType(currentType, visitedTypes, buildableTypes);
        }

        /// <summary>
        /// Recursively collects all type providers that implement IPersistableModel.
        /// </summary>
        private void CollectBuildableTypeProvidersRecursive(
            TypeProvider currentProvider,
            HashSet<CSharpType> visitedTypes,
            HashSet<TypeProvider> visitedTypeProviders,
            HashSet<TypeProvider> buildableProviders,
            HashSet<Type> buildableTypes)
        {
            // Avoid duplicate processing
            if (!ShouldProcessTypeProvider(currentProvider, visitedTypeProviders))
            {
                return;
            }
            buildableProviders.Add(currentProvider);

            if (currentProvider is not null)
            {
                CollectBuildableTypesRecursiveCore(currentProvider, visitedTypes, visitedTypeProviders, buildableProviders, buildableTypes);
            }
        }

        private void CollectBuildableTypesRecursiveCore(
            TypeProvider provider,
            HashSet<CSharpType> visitedTypes,
            HashSet<TypeProvider> visitedTypeProviders,
            HashSet<TypeProvider> buildableProviders,
            HashSet<Type> buildableTypes)
        {
            // Process all properties of the provider
            foreach (var property in provider.Properties)
            {
                var propertyType = property.Type.IsCollection ? GetInnerMostElement(property.Type) : property.Type;

                // we only care about types that is framework type
                if (propertyType.IsFrameworkType)
                {
                    CollectBuildableTypesRecursive(propertyType.WithNullable(false), visitedTypes, buildableTypes);
                }
            }

            if (provider is ModelProvider modelProvider && modelProvider.BaseModelProvider != null)
            {
                // For base model types, we need to process their properties as well, but we don't need to add the base model type itself
                CollectBuildableTypesRecursiveCore(modelProvider.BaseModelProvider, visitedTypes, visitedTypeProviders, buildableProviders, buildableTypes);
            }
            else
            {
                foreach (var implementedType in provider.Implements)
                {
                    // we only care about types that is framework type
                    if (implementedType.IsFrameworkType)
                    {
                        CollectBuildableTypesRecursive(implementedType.WithNullable(false), visitedTypes, buildableTypes);
                    }
                }
            }
        }

        private void CollectBuildableTypesFromFrameworkType(
            CSharpType frameworkType,
            HashSet<CSharpType> visitedTypes,
            HashSet<Type> buildableTypes)
        {
            if (!frameworkType.IsFrameworkType)
            {
                return;
            }

            try
            {
                buildableTypes.Add(frameworkType.FrameworkType);
                var type = frameworkType.FrameworkType;
                var properties = type.GetProperties(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);

                foreach (var property in properties)
                {
                    var propertyType = property.PropertyType;

                    if (!propertyType.IsVisible || propertyType.IsGenericTypeDefinition && frameworkType.Arguments.Count > 0)
                    {
                        continue;
                    }

                    var csharpPropertyType = new CSharpType(propertyType);
                    var typeToCheck = csharpPropertyType.IsCollection ? csharpPropertyType.ElementType : csharpPropertyType;

                    if (typeToCheck.IsFrameworkType)
                    {
                        CollectBuildableTypesRecursive(typeToCheck.WithNullable(false).FrameworkType, visitedTypes, buildableTypes);
                    }
                }

                // Also check base types of the framework type
                if (type.BaseType != null && type.BaseType != typeof(object))
                {
                    var baseFrameworkType = new CSharpType(type.BaseType);
                    CollectBuildableTypesRecursive(baseFrameworkType, visitedTypes, buildableTypes);
                }
            }
            catch (Exception)
            {
                // If we can't reflect on the type for any reason, skip it to avoid breaking the generation
                // This can happen with certain generic types or types that aren't fully constructed
                ScmCodeModelGenerator.Instance.Emitter.Debug($"Failed to get type for {frameworkType.Name}.");
            }
        }

        private static bool ShouldProcessTypeProvider(TypeProvider provider, HashSet<TypeProvider> visitedTypeProviders)
        {
            if (!visitedTypeProviders.Add(provider))
            {
                return false;
            }

            // Check if the type provider implements the model reader/writer interface
            return ImplementsModelReaderWriter(provider);
        }

        private static bool ShouldProcessCSharpType(CSharpType type, HashSet<CSharpType> visitedTypes)
        {
            if (!type.IsFrameworkType || !visitedTypes.Add(type))
            {
                return false;
            }

            // Check if the type is a framework type and implements the model reader/writer interface, also skip MRW interface types
            // If the type doesn't implement MRW, we don't need to process its properties, it can't apply MRW anyway
            return ImplementsModelReaderWriter(type.FrameworkType) && !IsModelReaderWriterInterfaceType(type);
        }

        private static CSharpType GetInnerMostElement(CSharpType type)
        {
            var result = type.ElementType;
            while (result.IsCollection)
            {
                result = result.ElementType;
            }
            return result;
        }

        /// <summary>
        /// Checks if a type implements IPersistableModel interface.
        /// </summary>
        private static bool ImplementsIPersistableModel(CSharpType? type, TypeProvider? provider)
        {
            // If it implements MRW then we can assume it implements IPersistableModel
            if (provider is ModelProvider)
            {
                return provider.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Any();
            }

            if (type is null)
            {
                return false;
            }

            if (!type.IsFrameworkType && provider is not null && ImplementsModelReaderWriter(provider))
            {
                return true;
            }

            if (!type.IsFrameworkType || type.IsEnum || type.IsLiteral)
                return false;

            return type.FrameworkType.GetInterfaces().Any(i => i.Name == "IPersistableModel`1" || i.Name == "IJsonModel`1");
        }

        protected override XmlDocProvider BuildXmlDocs()
        {
            var summary = new Statements.XmlDocSummaryStatement(
            [
                $"Context class which will be filled in by the System.ClientModel.SourceGeneration.",
                $"For more information <see href='https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/System.ClientModel/src/docs/ModelReaderWriterContext.md' />"
            ]);
            var xmlDocs = new XmlDocProvider(summary: summary);
            return xmlDocs;
        }

        private static string RemovePeriods(string input)
        {
            if (string.IsNullOrEmpty(input))
                return input;

            Span<char> buffer = stackalloc char[input.Length];
            int index = 0;

            foreach (char c in input)
            {
                if (c != '.')
                    buffer[index++] = c;
            }

            return buffer.Slice(0, index).ToString();
        }

        private static bool ImplementsModelReaderWriter(Type type)
        {
            if (type.IsEnum || type.IsValueType)
                return false;

            return type.GetInterfaces().Any(i => i.Name == "IPersistableModel`1" || i.Name == "IJsonModel`1");
        }

        private static bool ImplementsModelReaderWriter(TypeProvider typeProvider)
        {
            // skip known serialization as their enclosed models are ensured to be buildable
            if (typeProvider is MrwSerializationTypeDefinition)
            {
                return false;
            }

            if (typeProvider.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Any())
            {
                return true;
            }

            // check if the provider implements IPersistableModel or IJsonModel
            foreach (var implementedType in typeProvider.Implements)
            {
                if (IsModelReaderWriterInterfaceType(implementedType))
                {
                    return true;
                }
            }

            return false;
        }

        private static void AddAttributeForType(
            Dictionary<string, MethodBodyStatement> attributes,
            AttributeStatement attributeStatement,
            TypeProvider typeProvider,
            string experimentalTypeJustification,
            string obsoleteTypeJustification)
        {
            AttributeStatement? experimentalOrObsoleteAttribute = typeProvider.CanonicalView.Attributes
                .FirstOrDefault(a => a.Type.Equals(typeof(ExperimentalAttribute)) || a.Type.Equals(typeof(ObsoleteAttribute)));

            if (experimentalOrObsoleteAttribute?.Type.Equals(typeof(ExperimentalAttribute)) == true)
            {
                attributes.Add(typeProvider.Type.Name, new SuppressionStatement(attributeStatement, experimentalOrObsoleteAttribute.Arguments[0], experimentalTypeJustification));
            }
            else if (experimentalOrObsoleteAttribute?.Type.Equals(typeof(ObsoleteAttribute)) == true)
            {
                attributes.Add(typeProvider.Type.Name, new SuppressionStatement(attributeStatement, Literal(DefaultObsoleteDiagnosticId), obsoleteTypeJustification));
            }
            else
            {
                attributes.Add(typeProvider.Type.Name, attributeStatement);
            }
        }

        private static void AddAttributeForType(
            Dictionary<string, MethodBodyStatement> attributes,
            AttributeStatement attributeStatement,
            Type frameworkType,
            string experimentalTypeJustification,
            string obsoleteTypeJustification)
        {
            var experimentalAttr = frameworkType.GetCustomAttributes(typeof(ExperimentalAttribute), false)
                .FirstOrDefault();
            if (experimentalAttr != null)
            {
                var key = experimentalAttr.GetType().GetProperty("DiagnosticId")?.GetValue(experimentalAttr);
                attributes.Add(frameworkType.Name, new SuppressionStatement(attributeStatement, Literal(key), experimentalTypeJustification));
                return;
            }

            var obsoleteAttr = frameworkType.GetCustomAttributes(typeof(ObsoleteAttribute), false)
                .FirstOrDefault();
            if (obsoleteAttr != null)
            {
                var key = obsoleteAttr.GetType().GetProperty("DiagnosticId")?.GetValue(obsoleteAttr)
                    ?? DefaultObsoleteDiagnosticId;
                attributes.Add(frameworkType.Name, new SuppressionStatement(attributeStatement, Literal(key), obsoleteTypeJustification));
                return;
            }

            attributes.Add(frameworkType.Name, attributeStatement);
        }

        private static bool IsModelReaderWriterInterfaceType(CSharpType type)
        {
            return type.Name.StartsWith("IPersistableModel") || type.Name.StartsWith("IJsonModel");
        }

        private class TypeProviderTypeComparer : IEqualityComparer<TypeProvider>
        {
            public bool Equals(TypeProvider? x, TypeProvider? y)
            {
                if (x is null || y is null)
                    return false;
                return x.Type.AreNamesEqual(y.Type);
            }

            public int GetHashCode(TypeProvider obj)
            {
                return obj.Type is null ? 0 : obj.Type.GetHashCode();
            }
        }
    }
}
