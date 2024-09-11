// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers // the namespace here is crucial to get correct test data file.
{
    public class ModelCustomizationTests
    {
        // Validates that the property body's setter is correctly set based on the property type
        [TestCase]
        public async Task CanChangeModelName()
        {
            MockHelpers.LoadMockPlugin(customization: await Helpers.GetCompilationFromDirectoryAsync());

            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);
            var customCodeView = modelTypeProvider.CustomCodeView;

            AssertCommon(customCodeView, modelTypeProvider, "NewNamespace.Models", "CustomizedModel");
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

            AssertCommon(customCodeView, modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be filtered from the model provider
            Assert.AreEqual(0, modelTypeProvider.Properties.Count);

            // the property should be added to the custom code view
            Assert.AreEqual(1, customCodeView!.Properties.Count);
            Assert.AreEqual("Prop2", customCodeView.Properties[0].Name);
        }

        [Test]
        public void TestCustomization_CanChangePropertyType()
        {
            MockHelpers.LoadMockPlugin(customization: Helpers.GetCompilationFromFile());

            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);
            var customCodeView = modelTypeProvider.CustomCodeView;

            AssertCommon(customCodeView, modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be filtered from the model provider
            Assert.AreEqual(0, modelTypeProvider.Properties.Count);

            // the property should be added to the custom code view
            Assert.AreEqual(1, customCodeView!.Properties.Count);
            // the property type should be changed
            Assert.AreEqual(new CSharpType(typeof(int[])), customCodeView.Properties[0].Type);
        }

        [Test]
        public void TestCustomization_CanChangePropertyAccessibility()
        {
            MockHelpers.LoadMockPlugin(customization: Helpers.GetCompilationFromFile());

            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);
            var customCodeView = modelTypeProvider.CustomCodeView;

            AssertCommon(customCodeView, modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be filtered from the model provider
            Assert.AreEqual(0, modelTypeProvider.Properties.Count);

            // the property should be added to the custom code view
            Assert.AreEqual(1, customCodeView!.Properties.Count);
            // the property accessibility should be changed
            Assert.IsTrue(customCodeView.Properties[0].Modifiers.HasFlag(MethodSignatureModifiers.Internal));
        }

        private static void AssertCommon(TypeProvider? customCodeView, ModelProvider modelTypeProvider, string expectedNamespace, string expectedName)
        {
            Assert.IsNotNull(customCodeView);
            Assert.AreEqual(expectedNamespace, modelTypeProvider.Type.Namespace);
            Assert.AreEqual(expectedName, modelTypeProvider.Type.Name);
            Assert.AreEqual(customCodeView?.Name, modelTypeProvider.Type.Name);
            Assert.AreEqual(customCodeView?.Type.Namespace, modelTypeProvider.Type.Namespace);
        }

        [TestCase]
        public async Task CanChangeToStruct()
        {
            MockHelpers.LoadMockPlugin(customization: await Helpers.GetCompilationFromDirectoryAsync());

            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);

            Assert.IsTrue(modelTypeProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.ReadOnly | TypeSignatureModifiers.Struct));
            Assert.IsTrue(modelTypeProvider.Type.IsValueType);
        }

        [TestCase]
        public async Task CanChangeModelNameAndToStructAtSameTime()
        {
            MockHelpers.LoadMockPlugin(customization: await Helpers.GetCompilationFromDirectoryAsync());

            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);

            Assert.IsTrue(modelTypeProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.ReadOnly | TypeSignatureModifiers.Struct));
            Assert.IsTrue(modelTypeProvider.Type.IsValueType);
            Assert.AreEqual("CustomizedModel", modelTypeProvider.Type.Name);
            Assert.AreEqual("NewNamespace.Models", modelTypeProvider.Type.Namespace);
        }

        [TestCase]
        public async Task CanChangeAccessibility()
        {
            MockHelpers.LoadMockPlugin(customization: await Helpers.GetCompilationFromDirectoryAsync());

            var props = new[] {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);

            Assert.IsTrue(modelTypeProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class));
            Assert.IsFalse(modelTypeProvider.Type.IsPublic);
        }
    }
}
