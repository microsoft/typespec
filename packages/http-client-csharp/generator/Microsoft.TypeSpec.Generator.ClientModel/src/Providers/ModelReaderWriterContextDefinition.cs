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
    internal class ModelReaderWriterContextDefinition : TypeProvider
    {
        internal static readonly string s_name = $"{RemovePeriods(ScmCodeModelGenerator.Instance.TypeFactory.PrimaryNamespace)}Context";

        protected override string BuildName() => s_name;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;

        protected override CSharpType[] BuildImplements() => [typeof(ModelReaderWriterContext)];

        protected override IReadOnlyList<MethodBodyStatement> BuildAttributes()
        {
            var attributes = new List<MethodBodyStatement>();

            // Add ModelReaderWriterBuildableAttribute for all IPersistableModel types
            var buildableTypes = CollectBuildableTypes();
            foreach (KeyValuePair<CSharpType, TypeProvider?> buildableType in buildableTypes)
            {
                // Use the full attribute type name to ensure proper compilation
                var attributeType = new CSharpType(typeof(ModelReaderWriterBuildableAttribute));
                var attributeStatement = new AttributeStatement(attributeType, TypeOf(buildableType.Key));

                // If the type is experimental, we add a suppression for it
                string justification = $"{buildableType.Key} is experimental and may change in future versions.";
                if (buildableType.Value is not null)
                {
                    var experimentalAttribute =
                        buildableType.Value.CanonicalView.Attributes.FirstOrDefault(a => a.Type.Equals(typeof(ExperimentalAttribute)));
                    if (experimentalAttribute != null)
                    {
                        var key = experimentalAttribute.Arguments[0];
                        attributes.Add(new SuppressionStatement(attributeStatement, key, justification));
                    }
                    else
                    {
                        attributes.Add(attributeStatement);
                    }
                }
                // A dependency model - need to use reflection to get the attribute data
                else if (buildableType.Key.IsFrameworkType)
                {
                    var experimentalAttr = buildableType.Key.FrameworkType.GetCustomAttributes(typeof(ExperimentalAttribute), false)
                        .FirstOrDefault();
                    if (experimentalAttr != null)
                    {
                        var key = experimentalAttr.GetType().GetProperty("DiagnosticId")?.GetValue(experimentalAttr);
                        attributes.Add(new SuppressionStatement(attributeStatement, Literal(key), justification));
                    }
                    else
                    {
                        attributes.Add(attributeStatement);
                    }
                }
            }

            return attributes;
        }

        /// <summary>
        /// Collects all types that implement IPersistableModel, including all models and their properties
        /// that are also IPersistableModel types, recursively without duplicates.
        /// </summary>
        private Dictionary<CSharpType, TypeProvider?> CollectBuildableTypes()
        {
            var buildableTypes = new Dictionary<CSharpType, TypeProvider?>(new CSharpTypeNameComparer());
            var visitedTypes = new HashSet<CSharpType>(new CSharpTypeNameComparer());

            // Get all providers from the output library that are models or implement MRW interface types
            var providers = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .Where(t => t is ModelProvider || ImplementsModelReaderWriter(t))
                .ToDictionary(mp => mp.Type, mp => mp, new CSharpTypeNameComparer());

            // Process each provider recursively
            foreach (var provider in providers.Values)
            {
                CollectBuildableTypesRecursive(provider.Type, buildableTypes, visitedTypes, providers);
            }

            return buildableTypes;
        }

        /// <summary>
        /// Recursively collects all types that implement IPersistableModel.
        /// </summary>
        private void CollectBuildableTypesRecursive(
            CSharpType currentType,
            Dictionary<CSharpType, TypeProvider?> buildableTypes,
            HashSet<CSharpType> visitedTypes,
            Dictionary<CSharpType, TypeProvider> providers)
        {
            // Avoid infinite recursion by checking if we've already visited this type
            if (visitedTypes.Contains(currentType))
            {
                return;
            }

            visitedTypes.Add(currentType);

            if (IsModelReaderWriterInterfaceType(currentType))
            {
                return;
            }

            // Check if this type implements IPersistableModel
            bool implementsInterface = ImplementsIPersistableModel(currentType, providers, out TypeProvider? provider);
            if (implementsInterface)
            {
                buildableTypes.Add(currentType, provider);
            }

            // Always traverse properties and base types, regardless of whether the current type implements the interface
            // This ensures we find nested types that might implement the interfaces
            if (provider is not null)
            {
                foreach (var property in provider.Properties)
                {
                    var propertyType = property.Type.IsCollection ? GetInnerMostElement(property.Type) : property.Type;
                    CollectBuildableTypesRecursive(propertyType.WithNullable(false), buildableTypes, visitedTypes, providers);
                }

                if (provider is ModelProvider modelProvider && modelProvider.BaseModelProvider != null)
                {
                    CollectBuildableTypesRecursive(modelProvider.BaseModelProvider.Type, buildableTypes, visitedTypes, providers);
                }
                else
                {
                    foreach (var implementedType in provider.Implements)
                    {
                        CollectBuildableTypesRecursive(implementedType, buildableTypes, visitedTypes, providers);
                    }
                }
            }
            else if (currentType.IsFrameworkType)
            {
                CollectBuildableTypesFromFrameworkType(currentType, buildableTypes, visitedTypes, providers);
            }
        }

        private void CollectBuildableTypesFromFrameworkType(
            CSharpType frameworkType,
            Dictionary<CSharpType, TypeProvider?> buildableTypes,
            HashSet<CSharpType> visitedTypes,
            Dictionary<CSharpType, TypeProvider> providers)
        {
            if (!frameworkType.IsFrameworkType)
            {
                return;
            }

            try
            {
                var type = frameworkType.FrameworkType;
                var properties = type.GetProperties(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);

                foreach (var property in properties)
                {
                    var propertyType = property.PropertyType;

                    // Handle generic types by getting their concrete types if available
                    if (propertyType.IsGenericTypeDefinition && frameworkType.Arguments.Count > 0)
                    {
                        continue;
                    }

                    var csharpPropertyType = new CSharpType(propertyType);
                    var typeToCheck = csharpPropertyType.IsCollection ? csharpPropertyType.ElementType : csharpPropertyType;

                    CollectBuildableTypesRecursive(typeToCheck.WithNullable(false), buildableTypes, visitedTypes, providers);
                }

                // Also check base types of the framework type
                if (type.BaseType != null && type.BaseType != typeof(object))
                {
                    var baseFrameworkType = new CSharpType(type.BaseType);
                    CollectBuildableTypesRecursive(baseFrameworkType, buildableTypes, visitedTypes, providers);
                }
            }
            catch (Exception)
            {
                // If we can't reflect on the type for any reason, skip it to avoid breaking the generation
                // This can happen with certain generic types or types that aren't fully constructed
                ScmCodeModelGenerator.Instance.Emitter.Debug($"Failed to get type for {frameworkType.Name}.");
            }
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
        private static bool ImplementsIPersistableModel(CSharpType type, Dictionary<CSharpType, TypeProvider> providers, out TypeProvider? provider)
        {
            // If it implements MRW then we can assume it implements IPersistableModel
            if (providers.TryGetValue(type, out provider))
            {
                if (provider is ModelProvider)
                {
                    return provider.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Any();
                }

                if (!type.IsFrameworkType && ImplementsModelReaderWriter(provider))
                {
                    return true;
                }
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

        private static bool ImplementsModelReaderWriter(TypeProvider typeProvider)
        {
            // skip known serialization as their enclosed models are ensured to be buildable
            if (typeProvider is MrwSerializationTypeDefinition)
            {
                return false;
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

        private static bool IsModelReaderWriterInterfaceType(CSharpType type)
        {
            return type.Name.StartsWith("IPersistableModel") || type.Name.StartsWith("IJsonModel");
        }

        private class CSharpTypeNameComparer : IEqualityComparer<CSharpType>
        {
            public bool Equals(CSharpType? x, CSharpType? y)
            {
                if (x is null && y is null)
                {
                    return true;
                }
                if (x is null || y is null)
                {
                    return false;
                }
                return x.Namespace == y.Namespace && x.Name == y.Name;
            }

            public int GetHashCode(CSharpType obj)
            {
                HashCode hashCode = new HashCode();
                hashCode.Add(obj.Namespace);
                hashCode.Add(obj.Name);
                return hashCode.ToHashCode();
            }
        }
    }
}
