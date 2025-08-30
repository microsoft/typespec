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

        [TestCase(true)]
        [TestCase(false)]
        public void ValidateModelReaderWriterBuildableAttributesAreGeneratedForNonModelsThatImplementMRW(bool implementsIPersistable)
        {
            var outputLibrary = new TestOutputLibrary(implementsIPersistable);
            var mockGenerator = MockHelpers.LoadMockGenerator(createOutputLibrary: () => outputLibrary);

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);

            // Check that exactly one ModelReaderWriterBuildableAttribute exists
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.AreEqual(1, buildableAttributes.Count(), "Exactly one ModelReaderWriterBuildableAttribute should be generated for TestModel");
            Assert.AreEqual("typeof(global::Sample.TestMrwSerialization)", buildableAttributes.First().Arguments.First().ToDisplayString(),
                "The ModelReaderWriterBuildableAttribute should be generated for TestMrwSerialization");
        }

        [TestCase(true)]
        [TestCase(false)]
        public void ValidateModelReaderWriterBuildableAttributesAreGeneratedForNonModelsThatHaveDepProperty(bool implementsIPersistable)
        {
            var outputLibrary = new TestOutputLibrary(implementsIPersistable, includeDepModelProperty: true);
            var mockGenerator = MockHelpers.LoadMockGenerator(createOutputLibrary: () => outputLibrary);

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);

            int expectedCount = 2;
            Assert.AreEqual(expectedCount, attributes.Count);

            // Check that exactly one ModelReaderWriterBuildableAttribute exists
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute)).ToList();
            Assert.AreEqual(expectedCount, buildableAttributes.Count(), "Exactly one ModelReaderWriterBuildableAttribute should be generated for TestModel");
            Assert.AreEqual(
                "typeof(global::Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.ModelReaderWriterContextDefinitionTests.DependencyModel)",
                buildableAttributes[0].Arguments.First().ToDisplayString());
            Assert.AreEqual("typeof(global::Sample.TestMrwSerialization)", buildableAttributes[1].Arguments.First().ToDisplayString(),
                "The ModelReaderWriterBuildableAttribute should be generated for TestMrwSerialization");
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
        public void ExperimentalDependencyModelHaveAttributeSuppressions()
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
        public void ExperimentalModelsHaveAttributeSuppression()
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
        public async Task NullableValueTypesAreHandledCorrectly()
        {
            var customizedModel = InputFactory.Model("CustomizedModel");

            await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () =>
                [
                    InputFactory.Model("RegularModel", properties:
                    [
                        InputFactory.Property("ModelProperty", new InputNullableType(customizedModel)),
                        InputFactory.Property("IntProperty", InputPrimitiveType.Int32)
                    ]),
                    customizedModel
                ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

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
        public async Task CustomizedExperimentalModelsHaveAttributeSuppressions()
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

        [Test]
        public void ValidateFrameworkTypesWithMRWInterfacesAreIncluded()
        {
            // Create a model with a property that is a framework type implementing MRW interfaces
            var parentModel = InputFactory.Model("ParentModel", properties:
            [
                InputFactory.Property("FrameworkProperty", InputPrimitiveType.String), // Will be mapped to framework type
                InputFactory.Property("SimpleProperty", InputPrimitiveType.String)
            ]);

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [parentModel],
                createCSharpTypeCore: input =>
                {
                    // Map string property to a framework type that implements MRW
                    if (input == InputPrimitiveType.String)
                        return new CSharpType(typeof(FrameworkModelWithMRW));
                    return ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input)!;
                },
                createCSharpTypeCoreFallback: input => input == InputPrimitiveType.String);

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);

            // Should include both the parent model and the framework type
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute)).ToList();
            Assert.AreEqual(2, buildableAttributes.Count(), "Should include both ParentModel and FrameworkModelWithMRW");
            Assert.AreEqual(
                "typeof(global::Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.ModelReaderWriterContextDefinitionTests.FrameworkModelWithMRW)",
                buildableAttributes[0].Arguments.First().ToDisplayString());
            Assert.AreEqual(
                "typeof(global::Sample.Models.ParentModel)",
                buildableAttributes[1].Arguments.First().ToDisplayString());
        }

        [Test]
        public void ValidateTypesWithoutMRWButWithMRWPropertiesAreTraversed()
        {
            // Create a model that doesn't implement MRW but has properties that do
            var mrwModel = InputFactory.Model("MRWModel", properties: []);

            var nonMrwModel = InputFactory.Model("NonMRWModel", properties:
            [
                InputFactory.Property("MRWProperty", mrwModel),
                InputFactory.Property("SimpleProperty", InputPrimitiveType.String)
            ]);

            // Create a custom type provider that doesn't implement MRW interfaces
            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [nonMrwModel, mrwModel],
                createModelCore: input =>
                {
                    if (input.Name == "NonMRWModel")
                        return new NonMRWModelProvider(input);
                    return new ModelProvider(input);
                });

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.AreEqual(1, attributes.Count);

            // Should only include MRWModel, not NonMRWModel (since it doesn't implement MRW)
            // but NonMRWModel should still be traversed to find MRWModel
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.AreEqual(1, buildableAttributes.Count(), "Should only include MRWModel");

            var attributeArg = buildableAttributes.First().Arguments.First().ToDisplayString();
            Assert.IsTrue(attributeArg.Contains("MRWModel"), "Should include MRWModel through traversal");
        }

        [Test]
        public void ValidateBaseTypeHierarchyTraversal()
        {
            // Create a hierarchy: DerivedModel -> BaseModel -> GrandBaseModel
            var grandBaseModel = InputFactory.Model("GrandBaseModel", properties:
            [
                InputFactory.Property("GrandBaseProperty", InputPrimitiveType.String)
            ]);

            var baseModel = InputFactory.Model("BaseModel", properties:
            [
                InputFactory.Property("BaseProperty", InputPrimitiveType.String)
            ], baseModel: grandBaseModel);

            var derivedModel = InputFactory.Model("DerivedModel", properties:
            [
                InputFactory.Property("DerivedProperty", InputPrimitiveType.String)
            ], baseModel: baseModel);

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [derivedModel, baseModel, grandBaseModel]);

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);

            // Should include all three models in the hierarchy
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.AreEqual(3, buildableAttributes.Count(), "Should include all models in the hierarchy");
            var expectedTypes = new[]
            {
                "typeof(global::Sample.Models.GrandBaseModel)",
                "typeof(global::Sample.Models.BaseModel)",
                "typeof(global::Sample.Models.DerivedModel)"
            };
            foreach (var expectedType in expectedTypes)
            {
                Assert.IsTrue(buildableAttributes.Any(a => a.Arguments.First().ToDisplayString() == expectedType),
                    $"Should include {expectedType} in the attributes");
            }
        }

        [Test]
        public void ValidateInterfaceTypesAreNotIncluded()
        {
            // Create a model with a property that directly references MRW interface types
            var modelWithInterfaces = InputFactory.Model("ModelWithInterfaces", properties:
            [
                InputFactory.Property("JsonModelProperty", InputPrimitiveType.String),
                InputFactory.Property("PersistableModelProperty", InputPrimitiveType.String)
            ]);

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [modelWithInterfaces],
                createCSharpTypeCore: input =>
                {
                    if (input == InputPrimitiveType.String)
                    {
                        // Return interface types to test filtering
                        return new CSharpType(typeof(IJsonModel<>));
                    }
                    return ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input)!;
                },
                createCSharpTypeCoreFallback: input => input == InputPrimitiveType.String);

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);

            // Should only include the model itself, not the interface types
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.AreEqual(1, buildableAttributes.Count(), "Should only include ModelWithInterfaces, not interface types");

            var attributeArg = buildableAttributes.First().Arguments.First().ToDisplayString();
            Assert.IsTrue(attributeArg.Contains("ModelWithInterfaces"), "Should include only the concrete model");
        }

        [Test]
        public void ValidateFrameworkTypePropertiesAreTraversedUsingReflection()
        {
            // Create a model with a property that's a framework type with properties that implement MRW
            var parentModel = InputFactory.Model("ParentModel", properties:
            [
                InputFactory.Property("ComplexFrameworkProperty", InputPrimitiveType.String),
                InputFactory.Property("SimpleProperty", InputPrimitiveType.String)
            ]);

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [parentModel],
                createCSharpTypeCore: input =>
                {
                    if (input == InputPrimitiveType.String)
                        return new CSharpType(typeof(ComplexFrameworkType));
                    return ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input)!;
                },
                createCSharpTypeCoreFallback: input => input == InputPrimitiveType.String);

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            var expectedCount = 3;
            Assert.IsNotNull(attributes);
            Assert.AreEqual(expectedCount, attributes.Count);

            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute)).ToList();
            Assert.AreEqual(expectedCount, buildableAttributes.Count());
            Assert.AreEqual(
                "typeof(global::Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.ModelReaderWriterContextDefinitionTests.ComplexFrameworkType)",
                buildableAttributes[0].Arguments.First().ToDisplayString());
            Assert.AreEqual(
                "typeof(global::Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.ModelReaderWriterContextDefinitionTests.FrameworkModelWithMRW)",
                buildableAttributes[1].Arguments.First().ToDisplayString());
            Assert.AreEqual(
                "typeof(global::Sample.Models.ParentModel)",
                buildableAttributes[2].Arguments.First().ToDisplayString());
        }

        [Test]
        public void ValidateArrayOfFrameworkTypesAreHandled()
        {
            // Create a model with collection properties containing framework types
            var collectionModel = InputFactory.Model("CollectionModel", properties:
            [
                InputFactory.Property("FrameworkArray", InputFactory.Array(InputPrimitiveType.String)),
                InputFactory.Property("FrameworkList", InputFactory.Array(InputPrimitiveType.String))
            ]);

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [collectionModel],
                createCSharpTypeCore: input =>
                {
                    if (input == InputPrimitiveType.String)
                    {
                        return new CSharpType(typeof(FrameworkModelWithMRW));
                    }
                    else if (input is InputArrayType)
                    {
                        return new CSharpType(typeof(IList<FrameworkModelWithMRW>));
                    }
                    return ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input)!;
                });

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.AreEqual(2, attributes.Count);

            // Should include both the collection model and the framework type it contains
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute)).ToList();
            Assert.AreEqual(2, buildableAttributes.Count());
            Assert.AreEqual(
                "typeof(global::Sample.Models.CollectionModel)",
                buildableAttributes[0].Arguments.First().ToDisplayString());
            Assert.AreEqual(
                "typeof(global::Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.ModelReaderWriterContextDefinitionTests.FrameworkModelWithMRW)",
                buildableAttributes[1].Arguments.First().ToDisplayString());
        }

        [Test]
        public void ValidateDictionaryOfFrameworkTypesAreHandled()
        {
            // Create a model with dictionary properties containing framework types
            var collectionModel = InputFactory.Model("CollectionModel", properties:
            [
                InputFactory.Property("FrameworkDict", InputFactory.Dictionary(InputPrimitiveType.Int64, InputPrimitiveType.String))
            ]);

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [collectionModel],
                createCSharpTypeCore: input =>
                {
                    if (input == InputPrimitiveType.String)
                    {
                        return new CSharpType(typeof(FrameworkModelWithMRW));
                    }
                    else if (input is InputDictionaryType)
                    {
                        return new CSharpType(typeof(IDictionary<int, FrameworkModelWithMRW>));
                    }
                    return ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input)!;
                });

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.AreEqual(2, attributes.Count);

            // Should include both the collection model and the framework type it contains
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute)).ToList();
            Assert.AreEqual(2, buildableAttributes.Count());
            Assert.AreEqual(
                "typeof(global::Sample.Models.CollectionModel)",
                buildableAttributes[0].Arguments.First().ToDisplayString());
            Assert.AreEqual(
                "typeof(global::Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.ModelReaderWriterContextDefinitionTests.FrameworkModelWithMRW)",
                buildableAttributes[1].Arguments.First().ToDisplayString());
        }

        [Test]
        public void ValidateNestedFrameworkTypeHierarchy()
        {
            // Test complex scenario with multiple levels of framework types and inheritance
            var complexModel = InputFactory.Model("ComplexModel", properties:
            [
                InputFactory.Property("NestedFrameworkProperty", InputPrimitiveType.String)
            ]);

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [complexModel],
                createCSharpTypeCore: input =>
                {
                    if (input == InputPrimitiveType.String)
                        return new CSharpType(typeof(NestedFrameworkType));
                    return ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input)!;
                });

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            var expectedCount = 4;
            Assert.IsNotNull(attributes);
            Assert.AreEqual(expectedCount, attributes.Count);

            // Should include both the collection model and the framework type it contains
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute)).ToList();
            Assert.AreEqual(expectedCount, buildableAttributes.Count());
            Assert.AreEqual(
                "typeof(global::Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.ModelReaderWriterContextDefinitionTests.ComplexFrameworkType)",
                buildableAttributes[0].Arguments.First().ToDisplayString());
            Assert.AreEqual(
                "typeof(global::Sample.Models.ComplexModel)",
                buildableAttributes[1].Arguments.First().ToDisplayString());
            Assert.AreEqual(
                "typeof(global::Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.ModelReaderWriterContextDefinitionTests.FrameworkModelWithMRW)",
                buildableAttributes[2].Arguments.First().ToDisplayString());
            Assert.AreEqual(
                "typeof(global::Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.ModelReaderWriterContextDefinitionTests.NestedFrameworkType)",
                buildableAttributes[3].Arguments.First().ToDisplayString());
        }

        // This test validates that the correct attributes are generated for a complex scenario
        // where a type provider implements a nested framework type hierarchy, and the framework types
        // have properties that implement MRW interfaces.
        [Test]
        public void ValidateTypeProviderImplementsNestedFrameworkTypeHierarchy()
        {
            var outputLibrary = new TestOutputLibrary([new MRWTypeProvider()]);
            var mockGenerator = MockHelpers.LoadMockGenerator(createOutputLibrary: () => outputLibrary);

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);

            int expectedCount = 4;
            Assert.AreEqual(expectedCount, attributes.Count);

            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute)).ToList();
            Assert.AreEqual(expectedCount, buildableAttributes.Count);
            Assert.AreEqual(
                "typeof(global::Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.ModelReaderWriterContextDefinitionTests.ComplexFrameworkType)",
                buildableAttributes[0].Arguments.First().ToDisplayString());
            Assert.AreEqual(
                "typeof(global::Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.ModelReaderWriterContextDefinitionTests.FrameworkModelWithMRW)",
                buildableAttributes[1].Arguments.First().ToDisplayString());
            Assert.AreEqual(
                "typeof(global::Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.ModelReaderWriterContextDefinitionTests.FrameworkTypeImplementingOtherFrameworkType)",
                buildableAttributes[2].Arguments.First().ToDisplayString());
            Assert.AreEqual(
                "typeof(global::Sample.MRWTypeProvider)",
                buildableAttributes[3].Arguments.First().ToDisplayString());
        }

        // This test validates that the correct attributes are generated for a type provider
        // that implements a base model which is not in the output library.
        [Test]
        public void ValidateTypeProviderImplementsBaseNotInOutputLibrary()
        {
            var baseInputModel = InputFactory.Model("BaseModel", properties:
            [
                InputFactory.Property("BaseProperty", InputPrimitiveType.String)
            ]);
            var inputModel = InputFactory.Model("TypeProviderWithBase", properties:
            [
                InputFactory.Property("BaseModelProperty", baseInputModel),
                InputFactory.Property("SimpleProperty", InputPrimitiveType.String)
            ], baseModel: baseInputModel);
            var outputLibrary = new TestOutputLibrary([new TypeProviderWithBase(inputModel)]);
            var mockGenerator = MockHelpers.LoadMockGenerator(createOutputLibrary: () => outputLibrary);

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);

            int expectedCount = 1;
            Assert.AreEqual(expectedCount, attributes.Count);

            // Check that exactly one ModelReaderWriterBuildableAttribute exists
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute)).ToList();
            Assert.AreEqual(expectedCount, buildableAttributes.Count);
            Assert.AreEqual(
                "typeof(global::Sample.Models.TypeProviderWithBase)",
                buildableAttributes[0].Arguments.First().ToDisplayString());
        }

        [Test]
        public void ValidateObsoleteFrameworkTypeHasAttributeSuppression()
        {
            // Create a model with a property that references an obsolete framework type
            var parentModel = InputFactory.Model("ParentModel", properties:
            [
                InputFactory.Property("ObsoleteProperty", InputPrimitiveType.String),
                InputFactory.Property("SimpleProperty", InputPrimitiveType.String)
            ]);

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [parentModel],
                createCSharpTypeCore: input =>
                {
                    if (input == InputPrimitiveType.String)
                    {
                        if (input.Name == "ObsoleteProperty")
                        {
                            return new CSharpType(typeof(FrameworkModelWithMRW));
                        }
                        else
                        {
#pragma warning disable CS0618 // Type or member is obsolete
                            return new CSharpType(typeof(ObsoleteFrameworkType));
#pragma warning restore CS0618 // Type or member is obsolete
                        }
                    }
                    return ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input)!;
                });

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.AreEqual(2, attributes.Count);

            // Check that we have the right number of attributes including the suppression for the obsolete type
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && 
                a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute)).ToList();
            Assert.AreEqual(2, buildableAttributes.Count());

            var writer = new TypeProviderWriter(contextDefinition);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task ValidateCustomObsoleteTypeHasAttributeSuppression()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => new List<InputModelType>
                {
                    InputFactory.Model("CustomizedObsoleteModel", properties:
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

        [Test]
        public void ValidateObsoleteGeneratedTypeHasAttributeSuppression()
        {
            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => new List<InputModelType>
                {
                    InputFactory.Model("DeprecatedModel", properties:
                    [
                        InputFactory.Property("StringProperty", InputPrimitiveType.String),
                        InputFactory.Property("IntProperty", InputPrimitiveType.Int32)
                    ]),
                    InputFactory.Model("RegularModel", properties:
                    [
                        InputFactory.Property("StringProperty", InputPrimitiveType.String),
                        InputFactory.Property("DeprecatedModelRef", InputFactory.Model("DeprecatedModel"))
                    ])
                },
                createModelCore: input => input.Name == "DeprecatedModel" ? 
                    new ObsoleteModelProvider(input) : new ModelProvider(input));

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);

            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && 
                a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute)).ToList();
            Assert.AreEqual(2, buildableAttributes.Count());

            var writer = new TypeProviderWriter(contextDefinition);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
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

        private class TestMrwSerialization : TypeProvider
        {
            private readonly bool _implementsPersistableModel;
            private readonly bool _includeTypeWithDepModelProperty;
            public TestMrwSerialization(bool implementsPersistableModel, bool includeDepModelProperty) : base()
            {
                _implementsPersistableModel = implementsPersistableModel;
                _includeTypeWithDepModelProperty = includeDepModelProperty;
            }

            protected override string BuildName() => "TestMrwSerialization";

            protected override CSharpType[] BuildImplements()
            {
                return _implementsPersistableModel
                    ? [new CSharpType(typeof(IPersistableModel<object>))]
                    : [new CSharpType(typeof(IJsonModel<object>))];
            }

            protected override PropertyProvider[] BuildProperties()
            {
                if (!_includeTypeWithDepModelProperty)
                {
                    return base.BuildProperties();
                }

                return [new PropertyProvider(null, MethodSignatureModifiers.Public, new CSharpType(typeof(DependencyModel)), "p1", new AutoPropertyBody(false), this)];
            }

            protected override string BuildRelativeFilePath()
            {
                throw new NotImplementedException();
            }
        }

        public class FrameworkModelWithMRW : IJsonModel<FrameworkModelWithMRW>, IPersistableModel<FrameworkModelWithMRW>
        {
            public string Value { get; set; } = string.Empty;

            FrameworkModelWithMRW? IJsonModel<FrameworkModelWithMRW>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            FrameworkModelWithMRW? IPersistableModel<FrameworkModelWithMRW>.Create(BinaryData data, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            string IPersistableModel<FrameworkModelWithMRW>.GetFormatFromOptions(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            void IJsonModel<FrameworkModelWithMRW>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            BinaryData IPersistableModel<FrameworkModelWithMRW>.Write(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }
        }

        private class NonMRWModelProvider : ModelProvider
        {
            public NonMRWModelProvider(InputModelType inputModel) : base(inputModel)
            {
            }

            protected override CSharpType[] BuildImplements()
            {
                // Don't implement MRW interfaces
                return [];
            }

            protected override TypeProvider[] BuildSerializationProviders()
            {
                // Return an empty array to indicate no MRW serialization
                return [];
            }
        }

        public class MRWTypeProvider : TypeProvider
        {
            public MRWTypeProvider() : base()
            {
            }

            protected override CSharpType[] BuildImplements()
            {
                // Implement a framework type that does not implement MRW interfaces
                return
                [
                    new CSharpType(typeof(FrameworkTypeImplementingOtherFrameworkType)),
                    new CSharpType(typeof(IPersistableModel<object>))
                ];
            }

            protected override string BuildName() => "MRWTypeProvider";

            protected override string BuildRelativeFilePath()
            {
                throw new NotImplementedException();
            }

            protected override TypeProvider[] BuildSerializationProviders()
            {
                // Return an empty array to indicate no MRW serialization
                return [];
            }
        }

        public class TypeProviderWithBase : ModelProvider
        {
            public TypeProviderWithBase(InputModelType inputModelType) : base(inputModelType)
            {

            }

            protected override string BuildName() => "TypeProviderWithBase";

            protected override string BuildRelativeFilePath()
            {
                throw new NotImplementedException();
            }
        }

        public class FrameworkTypeImplementingOtherFrameworkType : ComplexFrameworkType
        {
            public string AnotherProperty { get; set; } = string.Empty;
        }

        public class ComplexFrameworkType : IJsonModel<ComplexFrameworkType>
        {
            public FrameworkModelWithMRW NestedProperty { get; set; } = new();
            internal TestInternalType SomeInternalType { get; set; } = new();
            public string SimpleProperty { get; set; } = string.Empty;
            public List<FrameworkModelWithMRW> ListProperty { get; set; } = new();

            void IJsonModel<ComplexFrameworkType>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            ComplexFrameworkType? IJsonModel<ComplexFrameworkType>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            BinaryData IPersistableModel<ComplexFrameworkType>.Write(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            ComplexFrameworkType? IPersistableModel<ComplexFrameworkType>.Create(BinaryData data, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            string IPersistableModel<ComplexFrameworkType>.GetFormatFromOptions(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }
        }

        internal class TestInternalType : IJsonModel<TestInternalType>
        {
            public TestInternalType() { }

            public TestInternalType? Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            public TestInternalType? Create(BinaryData data, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            public string GetFormatFromOptions(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            public void Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            public BinaryData Write(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }
        }

        public class NestedFrameworkType : IJsonModel<NestedFrameworkType>
        {
            public ComplexFrameworkType ComplexProperty { get; set; } = new();
            public FrameworkModelWithMRW DirectProperty { get; set; } = new();

            NestedFrameworkType? IJsonModel<NestedFrameworkType>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            NestedFrameworkType? IPersistableModel<NestedFrameworkType>.Create(BinaryData data, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            string IPersistableModel<NestedFrameworkType>.GetFormatFromOptions(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            void IJsonModel<NestedFrameworkType>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            BinaryData IPersistableModel<NestedFrameworkType>.Write(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }
        }

        private class TestOutputLibrary : ScmOutputLibrary
        {
            private readonly bool _implementsPersistableModel;
            private readonly bool _includeTypeWithDepModelProperty;
            private IReadOnlyList<TypeProvider>? _typeProviders = null;

            public TestOutputLibrary(bool implementsPersistableModel, bool includeDepModelProperty = false) : base()
            {
                _implementsPersistableModel = implementsPersistableModel;
                _includeTypeWithDepModelProperty = includeDepModelProperty;
            }

            public TestOutputLibrary(IEnumerable<TypeProvider> providers) : base()
            {
                _typeProviders = [.. providers];
            }

            protected override TypeProvider[] BuildTypeProviders()
            {
                var providers = base.BuildTypeProviders();
                if (_typeProviders != null)
                {
                    return
                    [
                        .. providers,
                        .. _typeProviders
                    ];
                }

                return
                [
                    .. providers,
                    new TestMrwSerialization(_implementsPersistableModel, _includeTypeWithDepModelProperty)
                ];
            }
        }

        // Test class for a framework type marked with [Obsolete]
        [Obsolete("This type is obsolete. Use NewFrameworkType instead.")]
        public class ObsoleteFrameworkType : IJsonModel<ObsoleteFrameworkType>, IPersistableModel<ObsoleteFrameworkType>
        {
            public string Value { get; set; } = string.Empty;

            ObsoleteFrameworkType? IJsonModel<ObsoleteFrameworkType>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            ObsoleteFrameworkType? IPersistableModel<ObsoleteFrameworkType>.Create(BinaryData data, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            string IPersistableModel<ObsoleteFrameworkType>.GetFormatFromOptions(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            void IJsonModel<ObsoleteFrameworkType>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }

            BinaryData IPersistableModel<ObsoleteFrameworkType>.Write(ModelReaderWriterOptions options)
            {
                throw new NotImplementedException();
            }
        }

        // Model provider for a Obsolete type
        private class ObsoleteModelProvider : ModelProvider
        {
            public ObsoleteModelProvider(InputModelType inputModel) : base(inputModel)
            {
            }

            protected override IReadOnlyList<MethodBodyStatement> BuildAttributes()
            {
                return
                [
                    // Use both Obsolete and a custom Obsolete attribute
                    new AttributeStatement(typeof(ObsoleteAttribute), Snippet.Literal("This model is obsolete. Use NewModel instead."), Snippet.Literal("true")),
                    .. base.BuildAttributes()
                ];
            }
        }
    }
}
