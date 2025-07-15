// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.ClientModel.Tests;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
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
                    InputFactory.Model("TestModel", properties: new[]
                    {
                        InputFactory.Property("StringProperty", InputPrimitiveType.String),
                        InputFactory.Property("IntProperty", InputPrimitiveType.Int32)
                    })
                });

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;
            
            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);
            
            // Check that at least one ModelReaderWriterBuildableAttribute exists
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.IsTrue(buildableAttributes.Any(), "At least one ModelReaderWriterBuildableAttribute should be generated");
        }

        [Test]
        public void ValidateModelReaderWriterBuildableAttributesIncludeNestedModels()
        {
            // Create a model with a property that references another model
            var nestedModel = InputFactory.Model("NestedModel", properties: new[]
            {
                InputFactory.Property("NestedValue", InputPrimitiveType.String)
            });

            var parentModel = InputFactory.Model("ParentModel", properties: new[]
            {
                InputFactory.Property("NestedProperty", nestedModel),
                InputFactory.Property("SimpleProperty", InputPrimitiveType.String)
            });

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => new List<InputModelType> { parentModel, nestedModel });

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;
            
            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);
            
            // Check that ModelReaderWriterBuildableAttribute exists for both models
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.IsTrue(buildableAttributes.Count() >= 2, "At least two ModelReaderWriterBuildableAttributes should be generated for nested models");
        }

        [Test]
        public void ValidateModelReaderWriterBuildableAttributesHandleCollectionProperties()
        {
            // Create a model with a collection property containing another model
            var itemModel = InputFactory.Model("ItemModel", properties: new[]
            {
                InputFactory.Property("ItemValue", InputPrimitiveType.String)
            });

            var collectionModel = InputFactory.Model("CollectionModel", properties: new[]
            {
                InputFactory.Property("Items", InputFactory.Array(itemModel))
            });

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => new List<InputModelType> { collectionModel, itemModel });

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;
            
            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Count > 0);
            
            // Check that ModelReaderWriterBuildableAttribute exists for both models
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            Assert.IsTrue(buildableAttributes.Count() >= 2, "At least two ModelReaderWriterBuildableAttributes should be generated for collection item models");
        }

        [Test]
        public void ValidateModelReaderWriterBuildableAttributesAvoidDuplicates()
        {
            // Create models with circular references to test duplicate handling
            var modelA = InputFactory.Model("ModelA", properties: new[]
            {
                InputFactory.Property("PropertyA", InputPrimitiveType.String)
            });

            var modelB = InputFactory.Model("ModelB", properties: new[]
            {
                InputFactory.Property("PropertyB", InputPrimitiveType.String),
                InputFactory.Property("ModelARef", modelA)
            });

            // Add a property to ModelA that references ModelB to create a circular reference
            var modelAWithCircularRef = InputFactory.Model("ModelA", properties: new[]
            {
                InputFactory.Property("PropertyA", InputPrimitiveType.String),
                InputFactory.Property("ModelBRef", modelB)
            });

            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => new List<InputModelType> { modelAWithCircularRef, modelB });

            var contextDefinition = new ModelReaderWriterContextDefinition();
            var attributes = contextDefinition.Attributes;
            
            Assert.IsNotNull(attributes);
            
            // Check that no duplicate attributes exist
            var buildableAttributes = attributes.Where(a => a.Type.IsFrameworkType && a.Type.FrameworkType == typeof(ModelReaderWriterBuildableAttribute));
            var uniqueTypes = buildableAttributes.Select(a => a.Arguments.First().ToString()).Distinct().ToList();
            
            Assert.AreEqual(buildableAttributes.Count(), uniqueTypes.Count, 
                "No duplicate ModelReaderWriterBuildableAttributes should be generated");
        }
    }
}