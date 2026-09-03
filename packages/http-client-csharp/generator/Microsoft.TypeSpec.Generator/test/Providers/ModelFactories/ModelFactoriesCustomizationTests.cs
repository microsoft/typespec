// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.ModelFactories
{
    public class ModelFactoriesCustomizationTests
    {
        [Test]
        public async Task CanReplaceModelMethod()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
               inputNamespaceName: "Sample.Namespace",
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
            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
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
            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        // specify a different property to ensure the method is not replaced
                        properties: [InputFactory.Property("Prop2", InputPrimitiveType.String)])
                ]);
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // Find the model factory provider
            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
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
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputNamespaceName: "Sample.Namespace",
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
            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactory);

            // The model factory should be internal
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            ValidateModelFactoryCommon(modelFactory);
        }

        // This test validates that the model factory method for a model is omitted if the
        // model type is customized to be internal.
        [Test]
        public async Task OmitsModelFactoryMethodIfModelTypeInternal()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        properties:
                        [
                            InputFactory.Property("Prop1", InputPrimitiveType.String),
                            InputFactory.Property("OptionalBool", InputPrimitiveType.Boolean, isRequired: false)
                        ])
                ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // Model factory should be omitted since there are no methods to generate
            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNull(modelFactory);
        }

        // This test validates that the model factory method for a model is omitted if the
        // any of the model's serialization ctor have parameters whose type are customized to be internal.
        [Test]
        public async Task OmitsModelFactoryMethodIfParamTypeInternal()
        {
            var modelProperty = InputFactory.Property("Prop1", InputFactory.Model("otherModel"));
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        properties:
                        [
                            modelProperty,
                        ])
                ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // Model factory should be omitted since there are no methods to generate
            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNull(modelFactory);
        }

        [Test]
        public async Task CustomFullConstructorFactoryMethodRetainsGeneratedModelParameterNamespaces()
        {
            var networkSubResource = InputFactory.Model("NetworkSubResource");
            var association = InputFactory.Model("EffectiveNetworkSecurityGroupAssociation");
            var rule = InputFactory.Model("EffectiveNetworkSecurityRule");
            var effectiveNetworkSecurityGroup = InputFactory.Model(
                "EffectiveNetworkSecurityGroup",
                properties:
                [
                    InputFactory.Property("NetworkSecurityGroup", networkSubResource),
                    InputFactory.Property("Association", association),
                    InputFactory.Property("EffectiveSecurityRules", InputFactory.Array(rule)),
                    InputFactory.Property("TagMap", InputPrimitiveType.String),
                ]);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputNamespaceName: "Sample.Namespace",
                inputModelTypes: [networkSubResource, association, rule, effectiveNetworkSecurityGroup],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                additionalMetadataReferences: [MetadataReference.CreateFromFile(typeof(BinaryData).Assembly.Location)]);

            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders
                .OfType<ModelProvider>()
                .Single(m => m.Name == "EffectiveNetworkSecurityGroup");
            Assert.IsFalse(
                modelProvider.Constructors.Contains(modelProvider.FullConstructor),
                $"The generated full constructor should be suppressed. Actual signature: {string.Join(", ", modelProvider.FullConstructor.Signature.Parameters.Select(p => p.Type.ToString()))}");
            Assert.IsTrue(modelProvider.CanonicalView.Constructors.Any(c => c.EnclosingType == modelProvider.CustomCodeView), "The custom internal constructor should replace the suppressed full constructor.");

            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactory);

            var customFactoryMethod = modelFactory!.CustomCodeView!.Methods
                .Single(m => m.Signature.Name == "EffectiveNetworkSecurityGroup");
            Assert.AreEqual(3, customFactoryMethod.Signature.Parameters.Count);

            var generatedFactoryMethod = modelFactory.Methods
                .SingleOrDefault(m => m.Signature.Name == "EffectiveNetworkSecurityGroup");
            Assert.IsNotNull(generatedFactoryMethod);
            Assert.AreEqual(4, generatedFactoryMethod!.Signature.Parameters.Count);

            var content = new TypeProviderWriter(modelFactory).Write().Content;
            Assert.IsFalse(content.Contains("using ;"), $"Model factory wrote an empty using directive:\n{content}");
            Assert.IsFalse(content.Contains("global::."), $"Model factory wrote an empty-namespace type reference:\n{content}");

            var networkSecurityGroupParam = generatedFactoryMethod.Signature.Parameters.Single(p => p.Name == "networkSecurityGroup");
            Assert.AreEqual("Sample.Models", networkSecurityGroupParam.Type.Namespace);

            var associationParam = generatedFactoryMethod.Signature.Parameters.Single(p => p.Name == "association");
            Assert.AreEqual("Sample.Models", associationParam.Type.Namespace);

            var effectiveSecurityRulesParam = generatedFactoryMethod.Signature.Parameters.Single(p => p.Name == "effectiveSecurityRules");
            Assert.AreEqual(typeof(IEnumerable<>), effectiveSecurityRulesParam.Type.FrameworkType);
            Assert.AreEqual("Sample.Models", effectiveSecurityRulesParam.Type.Arguments[0].Namespace);
        }

        [TestCase(true)]
        [TestCase(false)]
        public async Task CanCustomizeModelFullConstructor(bool extraParameters)
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
               inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        properties:
                        [
                            InputFactory.Property("Prop1", InputPrimitiveType.String, isRequired: true),
                        ])
               ],
               compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(extraParameters.ToString()),
               additionalMetadataReferences: [MetadataReference.CreateFromFile(typeof(BinaryData).Assembly.Location)]);

            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // Find the model factory provider
            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactory);

            // The model factory should be public
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            ValidateModelFactoryCommon(modelFactory);

            // The model factory method should be replaced
            var modelFactoryMethods = modelFactory!.Methods;
            Assert.AreEqual(1, modelFactoryMethods.Count);

            var modelFactoryMethod = modelFactoryMethods[0];
            Assert.AreEqual("MockInputModel", modelFactoryMethod.Signature.Name);

            Assert.AreEqual(extraParameters ? 2 : 1, modelFactoryMethod.Signature.Parameters.Count);
            if (extraParameters)
            {
                Assert.AreEqual("data", modelFactoryMethod.Signature.Parameters[0].Name);
                Assert.AreEqual("prop1", modelFactoryMethod.Signature.Parameters[1].Name);
                Assert.IsTrue(modelFactoryMethod.BodyStatements!.ToDisplayString()
                        .Contains("return new global::Sample.Models.MockInputModel(data.ToList(), prop1, additionalData: null);"),
                    modelFactoryMethod.BodyStatements!.ToDisplayString());
            }
            else
            {
                Assert.AreEqual("prop1", modelFactoryMethod.Signature.Parameters[0].Name);
                Assert.IsTrue(modelFactoryMethod.BodyStatements!.ToDisplayString()
                        .Contains("return new global::Sample.Models.MockInputModel(prop1, additionalData: null);"),
                    modelFactoryMethod.BodyStatements!.ToDisplayString());
            }
        }
    }
}
