// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers.ModelFactories
{
    public class ModelFactoriesCustomizationTests
    {
        [Test]
        public async Task CanReplaceModelMethod()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
               inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        properties:
                        [
                            InputFactory.Property("Prop1", InputPrimitiveType.String),
                            InputFactory.Property("OptionalBool", InputPrimitiveType.Boolean, isRequired: false)
                        ]),
                    InputFactory.Model(
                        "otherModel",
                        properties: [InputFactory.Property("Prop2", InputPrimitiveType.String)]),
               ],
               compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // Find the model factory provider
            var modelFactory = plugin.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactory);

            // The model factory method should be replaced
            var modelFactoryMethods = modelFactory!.Methods;
            Assert.AreEqual(1, modelFactoryMethods.Count);
            Assert.AreEqual("OtherModel", modelFactoryMethods[0].Signature.Name);

            var customCodeView = modelFactory.CustomCodeView;
            Assert.IsNotNull(customCodeView);

            // The custom code view should contain the method
            var customMethods = customCodeView!.Methods;
            Assert.AreEqual(1, customMethods.Count);
            Assert.AreEqual("MockInputModel", customMethods[0].Signature.Name);
            Assert.IsNull(customMethods[0].BodyExpression);
            Assert.AreEqual(string.Empty, customMethods[0].BodyStatements!.ToDisplayString());
        }

        [Test]
        public async Task DoesNotReplaceMethodIfNotCustomized()
        {
            var plugin = MockHelpers.LoadMockPlugin(
                inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        // specify a different property to ensure the method is not replaced
                        properties: [InputFactory.Property("Prop2", InputPrimitiveType.String)])
                ]);
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // Find the model factory provider
            var modelFactory = plugin.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactory);

            // The model factory method should not be replaced
            var modelFactoryMethods = modelFactory!.Methods;
            Assert.AreEqual(1, modelFactoryMethods.Count);
        }
    }
}
