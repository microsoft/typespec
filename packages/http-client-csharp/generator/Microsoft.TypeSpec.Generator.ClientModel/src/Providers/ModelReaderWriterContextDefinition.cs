// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
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
            var experimentalTypesInfo = CollectExperimentalTypesInfo(buildableTypes);
            
            foreach (var type in buildableTypes)
            {
                // Use the full attribute type name to ensure proper compilation
                var attributeType = new CSharpType(typeof(ModelReaderWriterBuildableAttribute));
                var attribute = new AttributeStatement(attributeType, TypeOf(type));
                
                // Store experimental info for later use in custom writer
                if (experimentalTypesInfo.TryGetValue(type, out var experimentalKey))
                {
                    // Mark this attribute as experimental using a custom property
                    _experimentalAttributeInfo[attribute] = experimentalKey;
                }
                
                attributes.Add(attribute);
            }

            return attributes;
        }

        // Dictionary to store experimental attribute information
        internal readonly Dictionary<AttributeStatement, string> _experimentalAttributeInfo = new();

        /// <summary>
        /// Collects information about experimental types and their warning keys.
        /// </summary>
        private Dictionary<CSharpType, string> CollectExperimentalTypesInfo(HashSet<CSharpType> buildableTypes)
        {
            var experimentalTypes = new Dictionary<CSharpType, string>(new CSharpTypeNameComparer());
            
            // Get all model providers from the output library
            var modelProviders = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .OfType<ModelProvider>()
                .ToDictionary(mp => mp.Type, mp => mp, new CSharpTypeNameComparer());

            foreach (var type in buildableTypes)
            {
                if (modelProviders.TryGetValue(type, out var modelProvider))
                {
                    // Check if this model has an ExperimentalAttribute
                    var experimentalAttribute = modelProvider.Attributes
                        .FirstOrDefault(attr => attr.Type.IsFrameworkType && 
                                               attr.Type.FrameworkType == typeof(ExperimentalAttribute));
                    
                    if (experimentalAttribute != null && experimentalAttribute.Arguments.Any())
                    {
                        // Extract the experimental key from the first argument
                        var firstArg = experimentalAttribute.Arguments.First();
                        if (firstArg is LiteralExpression literal && literal.Literal is string key)
                        {
                            experimentalTypes[type] = key;
                        }
                    }
                }
            }

            return experimentalTypes;
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

    /// <summary>
    /// Custom writer for ModelReaderWriterContextDefinition that handles pragma warnings for experimental attributes.
    /// </summary>
    internal class ModelReaderWriterContextWriter : TypeProviderWriter
    {
        private readonly ModelReaderWriterContextDefinition _contextDefinition;

        public ModelReaderWriterContextWriter(ModelReaderWriterContextDefinition provider) : base(provider)
        {
            _contextDefinition = provider;
        }

        public override CodeFile Write()
        {
            using var writer = new CodeWriter();
            using (var ns = writer.SetNamespace(_provider.Type.Namespace))
            {
                WriteTypeWithExperimentalHandling(writer);
            }
            return new CodeFile(writer.ToString(), _provider.RelativeFilePath);
        }

        private void WriteTypeWithExperimentalHandling(CodeWriter writer)
        {
            // Write XML docs
            writer.WriteXmlDocsNoScope(_provider.XmlDocs);

            // Write attributes with pragma warning handling
            foreach (var attribute in _provider.Attributes)
            {
                if (_contextDefinition._experimentalAttributeInfo.TryGetValue(attribute, out var experimentalKey))
                {
                    // Write pragma warning disable before experimental attribute
                    writer.WriteLine($"#pragma warning disable {experimentalKey}");
                    attribute.Write(writer);
                    writer.WriteLine($"#pragma warning restore {experimentalKey}");
                }
                else
                {
                    // Write normal attribute
                    attribute.Write(writer);
                }
            }

            // Write class declaration
            writer.WriteTypeModifiers(_provider.DeclarationModifiers);
            writer.Append($"{_provider.Type:D}")
                .AppendRawIf(" : ", _provider.Type.BaseType != null || _provider.Implements.Any())
                .AppendIf($"{_provider.Type.BaseType}", _provider.Type.BaseType != null);

            writer.AppendRawIf(", ", _provider.Type.BaseType != null && _provider.Implements.Count > 0);

            for (int i = 0; i < _provider.Implements.Count; i++)
            {
                writer.Append($"{_provider.Implements[i]:D}");
                if (i < _provider.Implements.Count - 1)
                {
                    writer.AppendRaw(", ");
                }
            }

            writer.WriteLine();

            // Write class body (empty for context class)
            using (writer.Scope())
            {
                // Context classes are typically empty as they're filled by source generation
            }
        }
    }
}
