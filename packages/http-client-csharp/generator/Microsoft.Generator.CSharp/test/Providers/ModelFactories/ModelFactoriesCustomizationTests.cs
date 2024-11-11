// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
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

            // The model factory should be public
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            ValidateModelFactoryCommon(modelFactory);

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

            // The model factory should be public
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            ValidateModelFactoryCommon(modelFactory);

            // The model factory method should not be replaced
            var modelFactoryMethods = modelFactory!.Methods;
            Assert.AreEqual(1, modelFactoryMethods.Count);
        }

        private static void ValidateModelFactoryCommon(TypeProvider modelFactory)
        {
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Static));
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Partial));
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Class));
        }

        [Test]
        public async Task CanChangeAccessibilityOfModelFactory()
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

            // The model factory should be internal
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            ValidateModelFactoryCommon(modelFactory);
        }

        [Test]
        public async Task CanCustomizeModelFullConstructor()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
               inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        properties:
                        [
                            InputFactory.Property("Prop1", InputPrimitiveType.String, isRequired: true),
                        ])
               ],
               compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // Find the model factory provider
            var modelFactory = plugin.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactory);

            // The model factory should be public
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            ValidateModelFactoryCommon(modelFactory);

            // The model factory method should be replaced
            var modelFactoryMethods = modelFactory!.Methods;
            Assert.AreEqual(1, modelFactoryMethods.Count);

            var modelFactoryMethod = modelFactoryMethods[0];
            Assert.AreEqual("MockInputModel", modelFactoryMethod.Signature.Name);

            Assert.AreEqual(2, modelFactoryMethod.Signature.Parameters.Count);
            Assert.AreEqual("data", modelFactoryMethod.Signature.Parameters[0].Name);
            Assert.AreEqual("prop1", modelFactoryMethod.Signature.Parameters[1].Name);

            Assert.IsTrue(modelFactoryMethod.BodyStatements!.ToDisplayString()
                .Contains("return new global::Sample.Models.MockInputModel(data?.ToList(), prop1, additionalBinaryDataProperties: null);"));
        }
    }
}
