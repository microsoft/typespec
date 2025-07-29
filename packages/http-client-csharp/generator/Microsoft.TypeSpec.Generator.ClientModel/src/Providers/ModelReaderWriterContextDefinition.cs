// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
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
        internal static readonly string s_name = $"{RemovePeriods(ScmCodeModelGenerator.Instance.TypeFactory.PrimaryNamespace)}Context";

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
                .ToDictionary(mp => mp.Type, mp => mp, new CSharpTypeNameComparer());

            // Process each model recursively
            foreach (var modelProvider in modelProviders.Values)
            {
                CollectBuildableTypesRecursive(modelProvider.Type, buildableTypes, visitedTypes, modelProviders);
            }

            return buildableTypes;
        }

        /// <summary>
        /// Recursively collects all types that implement IPersistableModel.
        /// </summary>
        private void CollectBuildableTypesRecursive(CSharpType currentType, HashSet<CSharpType> buildableTypes, HashSet<CSharpType> visitedTypes, Dictionary<CSharpType, ModelProvider> modelProviders)
        {
            // Avoid infinite recursion by checking if we've already visited this type
            if (visitedTypes.Contains(currentType))
            {
                return;
            }

            visitedTypes.Add(currentType);

            // Check if this type implements IPersistableModel
            if (ImplementsIPersistableModel(currentType, modelProviders, out ModelProvider? model))
            {
                buildableTypes.Add(currentType);

                if (model is not null)
                {
                    // Check all properties of this model
                    foreach (var property in model.Properties)
                    {
                        var propertyType = property.Type.IsCollection ? GetInnerMostElement(property.Type) : property.Type;
                        CollectBuildableTypesRecursive(propertyType, buildableTypes, visitedTypes, modelProviders);
                    }
                }
            }
        }

        private CSharpType GetInnerMostElement(CSharpType type)
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
        private bool ImplementsIPersistableModel(CSharpType type, Dictionary<CSharpType, ModelProvider> modelProviders, out ModelProvider? model)
        {
            if (modelProviders.TryGetValue(type, out model))
            {
                return model.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Any();
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
