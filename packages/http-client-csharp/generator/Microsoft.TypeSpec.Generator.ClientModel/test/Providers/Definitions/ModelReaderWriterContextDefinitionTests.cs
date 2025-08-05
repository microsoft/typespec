// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

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
        public void ValidateExperimentalModelAttributesAreTracked()
        {
            // Create an experimental model with ExperimentalAttribute
            var experimentalModel = InputFactory.Model("ExperimentalModel", properties:
            [
                InputFactory.Property("Value", InputPrimitiveType.String)
            ]);

            var normalModel = InputFactory.Model("NormalModel", properties:
            [
                InputFactory.Property("Value", InputPrimitiveType.String)
            ]);

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [experimentalModel, normalModel]);

            // Add experimental attribute to the experimental model's provider
            var experimentalModelProvider = mockGenerator.OutputLibrary.TypeProviders
                .OfType<ModelProvider>()
                .First(mp => mp.Name == "ExperimentalModel");

            // Simulate the experimental attribute
            var experimentalAttribute = new AttributeStatement(
                new CSharpType(typeof(ExperimentalAttribute)), 
                Literal("TYPESPEC001"));
            
            experimentalModelProvider.Update(attributes: [experimentalAttribute]);

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;

            Assert.IsNotNull(attributes);
            Assert.AreEqual(2, attributes.Count, "Should have attributes for both models");

            // Check that experimental info is tracked
            Assert.AreEqual(1, contextDefinition._experimentalAttributeInfo.Count, 
                "Should track one experimental attribute");
            Assert.IsTrue(contextDefinition._experimentalAttributeInfo.ContainsValue("TYPESPEC001"),
                "Should track the experimental key TYPESPEC001");
        }

        [Test]
        public void ValidateExperimentalModelContextGeneratesWithPragmaWarnings()
        {
            // Create an experimental model
            var experimentalModel = InputFactory.Model("ExperimentalModel", properties:
            [
                InputFactory.Property("Value", InputPrimitiveType.String)
            ]);

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [experimentalModel]);

            // Add experimental attribute to the model's provider
            var experimentalModelProvider = mockGenerator.OutputLibrary.TypeProviders
                .OfType<ModelProvider>()
                .First(mp => mp.Name == "ExperimentalModel");

            var experimentalAttribute = new AttributeStatement(
                new CSharpType(typeof(ExperimentalAttribute)), 
                Literal("TYPESPEC001"));
            
            experimentalModelProvider.Update(attributes: [experimentalAttribute]);

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var writer = new ModelReaderWriterContextWriter(contextDefinition);
            var codeFile = writer.Write();

            Assert.IsNotNull(codeFile);
            var content = codeFile.Content;

            // Verify pragma warnings are generated and positioned correctly
            Assert.IsTrue(content.Contains("#pragma warning disable TYPESPEC001"), 
                "Should contain pragma warning disable for experimental model");
            Assert.IsTrue(content.Contains("#pragma warning restore TYPESPEC001"), 
                "Should contain pragma warning restore for experimental model");
            Assert.IsTrue(content.Contains("ModelReaderWriterBuildableAttribute"), 
                "Should contain the buildable attribute");
            
            // Validate that the disable/restore surrounds the correct line
            var lines = content.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            bool foundPragmaDisable = false;
            bool foundAttribute = false;
            bool foundPragmaRestore = false;
            bool correctSequence = false;
            
            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i].Trim();
                
                if (line.Contains("#pragma warning disable TYPESPEC001"))
                {
                    foundPragmaDisable = true;
                    foundAttribute = false;
                    foundPragmaRestore = false;
                }
                else if (foundPragmaDisable && !foundAttribute && 
                         line.Contains("ModelReaderWriterBuildableAttribute") && 
                         line.Contains("ExperimentalModel"))
                {
                    foundAttribute = true;
                }
                else if (foundPragmaDisable && foundAttribute && !foundPragmaRestore && 
                         line.Contains("#pragma warning restore TYPESPEC001"))
                {
                    foundPragmaRestore = true;
                    correctSequence = true;
                    break; // Found complete sequence
                }
                else if (foundPragmaDisable && line.Trim().Length > 0 && 
                         !line.Contains("ModelReaderWriterBuildableAttribute") &&
                         !line.Contains("#pragma warning"))
                {
                    // Reset if we find other content between disable and attribute
                    foundPragmaDisable = false;
                }
            }
            
            Assert.IsTrue(correctSequence, 
                "Pragma warning disable/restore should surround the ModelReaderWriterBuildableAttribute for ExperimentalModel");
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
    }
}
