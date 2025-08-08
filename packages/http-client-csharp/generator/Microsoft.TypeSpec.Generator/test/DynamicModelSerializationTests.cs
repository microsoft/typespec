// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Reflection;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class DynamicModelSerializationTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }
        [Test]
        public void DynamicModelSerialization()
        {
            var properties = new[]
            {
                InputFactory.Property("id", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("email", InputPrimitiveType.String, isRequired: false)
            };

            // Create a model with the dynamicModel decorator
            var inputModel = InputFactory.Model("User", properties: properties);
            
            // Use reflection to set decorators since the property has an internal setter
            var decoratorsProperty = typeof(InputType).GetProperty("Decorators");
            var decorators = new List<InputDecoratorInfo>
            {
                new InputDecoratorInfo("dynamicModel", null)
            };
            decoratorsProperty?.SetValue(inputModel, decorators);

            var modelProvider = new ModelProvider(inputModel);
            var writer = new TypeProviderWriter(modelProvider);
            var file = writer.Write();

            // Verify the model doesn't have the raw data field
            Assert.That(file.Content, Does.Not.Contain("_additionalBinaryDataProperties"));
            
            // Verify the model has the Patch property
            Assert.That(file.Content, Contains.Substring("public object Patch { get; set; }"));
        }

        [Test]
        public void RegularModelStillHasRawDataField()
        {
            var properties = new[]
            {
                InputFactory.Property("id", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
            };

            // Create a regular model without the dynamicModel decorator
            var inputModel = InputFactory.Model("RegularUser", properties: properties);

            var modelProvider = new ModelProvider(inputModel);
            var writer = new TypeProviderWriter(modelProvider);
            var file = writer.Write();

            // Verify the model has the raw data field
            Assert.That(file.Content, Contains.Substring("_additionalBinaryDataProperties"));
            
            // Verify the model doesn't have the Patch property
            Assert.That(file.Content, Does.Not.Contain("public object Patch { get; set; }"));
        }
    }
}