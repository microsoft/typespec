// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections;
using System.Collections.Generic;
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
        internal static string s_name = $"{RemovePeriods(ScmCodeModelGenerator.Instance.TypeFactory.PrimaryNamespace)}Context";

        protected override string BuildName() => s_name;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;

        protected override CSharpType[] BuildImplements() => [typeof(ModelReaderWriterContext)];

        protected override IReadOnlyList<AttributeStatement> BuildAttributes()
        {
            var attributes = new List<AttributeStatement>();

            // Add ModelReaderWriterBuildableAttribute for all IPersistableModel types
            var buildableTypes = CollectBuildableTypes();
            foreach (var type in buildableTypes)
            {
                // Use the full attribute type name to ensure proper compilation
                var attributeType = new CSharpType(typeof(ModelReaderWriterBuildableAttribute));
                attributes.Add(new AttributeStatement(attributeType, TypeOf(type)));
            }

            return attributes;
        }

        /// <summary>
        /// Collects all types that implement IPersistableModel, including all models and their properties
        /// that are also IPersistableModel types, recursively without duplicates.
        /// </summary>
        private HashSet<CSharpType> CollectBuildableTypes()
        {
            var buildableTypes = new HashSet<CSharpType>(new CSharpTypeNameComparer());
            var visitedTypes = new HashSet<CSharpType>(new CSharpTypeNameComparer());

            // Get all model providers from the output library
            var modelProviders = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .OfType<ModelProvider>()
                .ToList();

            // Process each model recursively
            foreach (var modelProvider in modelProviders)
            {
                CollectBuildableTypesRecursive(modelProvider.Type, buildableTypes, visitedTypes);
            }

            return buildableTypes;
        }

        /// <summary>
        /// Recursively collects all types that implement IPersistableModel.
        /// </summary>
        private void CollectBuildableTypesRecursive(CSharpType type, HashSet<CSharpType> buildableTypes, HashSet<CSharpType> visitedTypes)
        {
            // Avoid infinite recursion by checking if we've already visited this type
            if (visitedTypes.Contains(type) || type.IsFrameworkType)
            {
                return;
            }

            visitedTypes.Add(type);

            // Check if this type implements IPersistableModel
            if (ImplementsIPersistableModel(type))
            {
                buildableTypes.Add(type);

                // Look for all properties of this type that are also IPersistableModel
                var modelProvider = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                    .OfType<ModelProvider>()
                    .FirstOrDefault(m => m.Type.Equals(type));

                if (modelProvider != null)
                {
                    // Check all properties of this model
                    foreach (var property in modelProvider.Properties)
                    {
                        if (property.Type.IsCollection)
                        {
                            // For collections, check the element type
                            CollectBuildableTypesRecursive(property.Type.ElementType, buildableTypes, visitedTypes);
                        }
                        else
                        {
                            // For regular properties, check the property type
                            CollectBuildableTypesRecursive(property.Type, buildableTypes, visitedTypes);
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Checks if a type implements IPersistableModel interface.
        /// </summary>
        private bool ImplementsIPersistableModel(CSharpType type)
        {
            // Check if the type is a framework type (System.* types)
            if (type.IsFrameworkType)
            {
                return false;
            }

            // Check if the type has a model provider in the current library (local models)
            var modelProvider = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .OfType<ModelProvider>()
                .FirstOrDefault(m => m.Type.Equals(type));

            if (modelProvider != null)
            {
                return true;
            }

            // For dependency models (models from other libraries), assume they implement IPersistableModel
            // if they are not framework types, not literals, not enums, and not generic types
            // This handles models that are referenced from dependency libraries
            return !type.IsFrameworkType && !type.IsLiteral && !type.IsEnum && !type.IsGenericType;
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
                return hashCode.ToHashCode();
            }
        }
    }
}
