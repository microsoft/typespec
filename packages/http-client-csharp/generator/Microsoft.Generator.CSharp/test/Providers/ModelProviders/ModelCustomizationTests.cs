// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers // the namespace here is crucial to get correct test data file.
{
    public class ModelCustomizationTests
    {
        // Validates that the property body's setter is correctly set based on the property type
        [Test]
        public void TestCustomization_CanChangeModelName()
        {
            MockHelpers.LoadMockPlugin(customization: Helpers.GetCompilationFromFile());

            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);
            var customCodeView = modelTypeProvider.CustomCodeView;

            Assert.IsNotNull(customCodeView);
            Assert.AreEqual("CustomizedModel", modelTypeProvider.Type.Name);
            Assert.AreEqual("NewNamespace.Models", modelTypeProvider.Type.Namespace);
            Assert.AreEqual(customCodeView?.Name, modelTypeProvider.Type.Name);
            Assert.AreEqual(customCodeView?.Type.Namespace, modelTypeProvider.Type.Namespace);
        }

        [Test]
        public void TestCustomization_CanChangePropertyName()
        {
            MockHelpers.LoadMockPlugin(customization: Helpers.GetCompilationFromFile());

            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);
            var customCodeView = modelTypeProvider.CustomCodeView;

            Assert.IsNotNull(customCodeView);
            Assert.AreEqual("MockInputModel", modelTypeProvider.Type.Name);
            Assert.AreEqual("Sample.Models", modelTypeProvider.Type.Namespace);
            Assert.AreEqual(customCodeView?.Name, modelTypeProvider.Type.Name);
            Assert.AreEqual(customCodeView?.Type.Namespace, modelTypeProvider.Type.Namespace);

            // the property should be filtered from the model provider
            Assert.AreEqual(0, modelTypeProvider.Properties.Count);

            // the property should be added to the custom code view
            Assert.AreEqual(1, customCodeView!.Properties.Count);
            Assert.AreEqual("Prop2", customCodeView.Properties[0].Name);
        }
    }
}
