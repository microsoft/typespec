// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions
{
    public class ModelReaderWriterContextDefinitionTests
    {
        [Test]
        public void ValidateModelReaderWriterContextIsGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var contextDefinition = new ModelReaderWriterContextDefinition();

            Assert.IsNotNull(contextDefinition);
            Assert.IsNotNull(contextDefinition.Name);
            Assert.IsTrue(contextDefinition.Name.EndsWith("Context"));
            Assert.IsNotNull(contextDefinition.DeclarationModifiers);
            Assert.IsTrue(contextDefinition.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsTrue(contextDefinition.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Partial));
            Assert.IsTrue(contextDefinition.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Class));
            Assert.IsNotNull(contextDefinition.Implements);
            Assert.IsTrue(contextDefinition.Implements.Contains(typeof(ModelReaderWriterContext)));
        }

        [Test]
        public void ValidateModelReaderWriterBuildableAttributesAreGenerated()
        {
            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => new List<InputModelType>
                {
                    InputFactory.Model("TestModel", properties:
                    [
                        InputFactory.Property("StringProperty", InputPrimitiveType.String),
                        InputFactory.Property("IntProperty", InputPrimitiveType.Int32)
                    ])
                });

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);

            // Check that exactly one ModelReaderWriterBuildableAttribute exists since TestModel has only primitive properties
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.AreEqual(1, buildableAttributes.Count(), "Exactly one ModelReaderWriterBuildableAttribute should be generated for TestModel");
        }

        [Test]
        public void ValidateModelReaderWriterBuildableAttributesIncludeNestedModels()
        {
            // Create a model with a property that references another model
            var nestedModel = InputFactory.Model("NestedModel", properties:
            [
                InputFactory.Property("NestedValue", InputPrimitiveType.String)
            ]);

            var parentModel = InputFactory.Model("ParentModel", properties:
            [
                InputFactory.Property("NestedProperty", nestedModel),
                InputFactory.Property("SimpleProperty", InputPrimitiveType.String)
            ]);

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [parentModel, nestedModel]);

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);

            // Check that exactly two ModelReaderWriterBuildableAttribute exist for both models
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.AreEqual(2, buildableAttributes.Count(), "Exactly two ModelReaderWriterBuildableAttributes should be generated for nested models");
        }

        [Test]
        public void ValidateModelReaderWriterBuildableAttributesHandleCollectionProperties()
        {
            // Create a model with a collection property containing another model
            var itemModel = InputFactory.Model("ItemModel", properties:
            [
                InputFactory.Property("ItemValue", InputPrimitiveType.String)
            ]);

            var collectionModel = InputFactory.Model("CollectionModel", properties:
            [
                InputFactory.Property("Items", InputFactory.Array(itemModel))
            ]);

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [collectionModel, itemModel]);

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);

            // Check that exactly two ModelReaderWriterBuildableAttribute exist for both models
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.AreEqual(2, buildableAttributes.Count(), "Exactly two ModelReaderWriterBuildableAttributes should be generated for collection item models");
        }

        [Test]
        public void ValidateModelReaderWriterBuildableAttributesAvoidDuplicates()
        {
            // Create models with circular references to test duplicate handling
            var modelA = InputFactory.Model("ModelA", properties:
            [
                InputFactory.Property("PropertyA", InputPrimitiveType.String)
            ]);

            var modelB = InputFactory.Model("ModelB", properties:
            [
                InputFactory.Property("PropertyB", InputPrimitiveType.String),
                InputFactory.Property("ModelARef", modelA)
            ]);

            // Add a property to ModelA that references ModelB to create a circular reference
            var modelAWithCircularRef = InputFactory.Model("ModelA", properties:
            [
                InputFactory.Property("PropertyA", InputPrimitiveType.String),
                InputFactory.Property("ModelBRef", modelB)
            ]);

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [modelAWithCircularRef, modelB]);

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);

            // Check that no duplicate attributes exist
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            var uniqueTypes = buildableAttributes.Select(a => a.Arguments.First().ToString()).Distinct().ToList();

            Assert.AreEqual(buildableAttributes.Count(), uniqueTypes.Count,
                "No duplicate ModelReaderWriterBuildableAttributes should be generated");
        }

        [Test]
        public void ValidateModelReaderWriterBuildableAttributesIncludeDependencyModels()
        {
            // Create a model with a property that references a model from a dependency library
            // The dependency model won't have a model provider in the current library
            var dependencyModel = InputFactory.Model("DependencyModel");

            var parentModel = InputFactory.Model("ParentModel", properties:
            [
                InputFactory.Property("DependencyProperty", dependencyModel),
                InputFactory.Property("SimpleProperty", InputPrimitiveType.String)
            ]);

            // Only include the parentModel in the mock generator, simulating that
            // dependencyModel is from a dependency library
            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [parentModel],
                createCSharpTypeCore: input =>
                {
                    return new CSharpType(typeof(DependencyModel));
                },
                createCSharpTypeCoreFallback: input => input.Name == "DependencyModel");

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);

            // Check that exactly two ModelReaderWriterBuildableAttribute exist:
            // one for ParentModel and one for the dependency model
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.AreEqual(2, buildableAttributes.Count(), "Exactly two ModelReaderWriterBuildableAttributes should be generated for models with dependency references");
        }

        [Test]
        public void ModelReaderWriterDependencyModelBuildableAttributesHaveExperimentalSuppressions()
        {
            // Create a model with a property that references a model from a dependency library
            // The dependency model won't have a model provider in the current library
            var dependencyModel = InputFactory.Model("ExperimentalDependencyModel");

            var parentModel = InputFactory.Model("ParentModel", properties:
            [
                InputFactory.Property("DependencyProperty", dependencyModel),
                InputFactory.Property("SimpleProperty", InputPrimitiveType.String)
            ]);

            // Only include the parentModel in the mock generator, simulating that
            // dependencyModel is from a dependency library
            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [parentModel],
                createCSharpTypeCore: input =>
                {
#pragma warning disable TEST001
                    return new CSharpType(typeof(ExperimentalDependencyModel));
#pragma warning restore TEST001
                },
                createCSharpTypeCoreFallback: input => input.Name == "ExperimentalDependencyModel");

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);

            // Check that exactly two ModelReaderWriterBuildableAttribute exist:
            // one for ParentModel and one for the dependency model
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.AreEqual(2, buildableAttributes.Count(), "Exactly two ModelReaderWriterBuildableAttributes should be generated for models with dependency references");

            var writer = new TypeProviderWriter(contextDefinition);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ModelReaderWriterExperimentalBuildableAttributesHaveSuppression()
        {
            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => new List<InputModelType>
                {
                    InputFactory.Model("ExperimentalModel", properties:
                    [
                        InputFactory.Property("StringProperty", InputPrimitiveType.String),
                        InputFactory.Property("IntProperty", InputPrimitiveType.Int32)
                    ]),
                    InputFactory.Model("RegularModel", properties:
                    [
                        InputFactory.Property("StringProperty", InputPrimitiveType.String)
                    ])
                },
                createModelCore: input => input.Name == "ExperimentalModel" ? new ExperimentalModelProvider(input) : new ModelProvider(input));

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);

            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.AreEqual(2, buildableAttributes.Count());

            var writer = new TypeProviderWriter(contextDefinition);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task ModelReaderWriterCustomizedModelBuildableAttributesHaveExperimentalSuppressions()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => new List<InputModelType>
                {
                    InputFactory.Model("CustomizedExperimentalModel", properties:
                    [
                        InputFactory.Property("StringProperty", InputPrimitiveType.String),
                        InputFactory.Property("IntProperty", InputPrimitiveType.Int32)
                    ]),
                    InputFactory.Model("RegularModel", properties:
                    [
                        InputFactory.Property("StringProperty", InputPrimitiveType.String)
                    ])
                });

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);

            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.AreEqual(2, buildableAttributes.Count());

            var writer = new TypeProviderWriter(contextDefinition);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        private class ExperimentalModelProvider : ModelProvider
        {
            public ExperimentalModelProvider(InputModelType inputModel) : base(inputModel)
            {
            }

            protected override IReadOnlyList<MethodBodyStatement> BuildAttributes()
            {
                return
                [
                    new AttributeStatement(typeof(ExperimentalAttribute), Snippet.Literal("TEST001")),
                ];
            }
        }

        private class DependencyModel : IJsonModel<DependencyModel>
        {
            DependencyModel? IJsonModel<DependencyModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            DependencyModel? IPersistableModel<DependencyModel>.Create(BinaryData data, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            string IPersistableModel<DependencyModel>.GetFormatFromOptions(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            void IJsonModel<DependencyModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            BinaryData IPersistableModel<DependencyModel>.Write(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }
        }

        [Experimental("TEST001")]
        private class ExperimentalDependencyModel : IJsonModel<ExperimentalDependencyModel>
        {
            ExperimentalDependencyModel? IJsonModel<ExperimentalDependencyModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            ExperimentalDependencyModel? IPersistableModel<ExperimentalDependencyModel>.Create(BinaryData data, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            string IPersistableModel<ExperimentalDependencyModel>.GetFormatFromOptions(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            void IJsonModel<ExperimentalDependencyModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            BinaryData IPersistableModel<ExperimentalDependencyModel>.Write(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }
        }
    }
}
