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

            Assert.IsNotNull(customCodeView);
            Assert.AreEqual("CustomizedModel", modelTypeProvider.Type.Name);
            Assert.AreEqual("NewNamespace.Models", modelTypeProvider.Type.Namespace);
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
