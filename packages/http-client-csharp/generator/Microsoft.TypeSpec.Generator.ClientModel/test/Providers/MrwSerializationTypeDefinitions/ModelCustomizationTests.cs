// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class ModelCustomizationTests
    {
        [Test]
        public async Task CanChangePropertyName()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props, usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            // validate the methods use the custom member name
            var writer = new TypeProviderWriter(modelProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // Validates that if a custom property is added to the base model, and the CodeGenSerialization attribute is used,
        // then the derived model includes the custom property in the serialization ctor.
        [Test]
        public async Task CanSerializeCustomPropertyFromBase()
        {
            var baseModel = InputFactory.Model(
                "baseModel",
                usage: InputModelTypeUsage.Input,
                properties: [InputFactory.Property("BaseProp", InputPrimitiveType.Int32, isRequired: true)]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [
                    InputFactory.Model(
                        "mockInputModel",
                        // use Input so that we generate a public ctor
                        usage: InputModelTypeUsage.Input,
                        properties:
                        [
                            InputFactory.Property("OtherProp", InputPrimitiveType.Int32, isRequired: true),
                        ],
                        baseModel: baseModel),
                ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.FirstOrDefault(t => t is ModelProvider && t.Name == "MockInputModel");
            Assert.IsNotNull(modelTypeProvider);

            var baseModelTypeProvider = (modelTypeProvider as ModelProvider)?.BaseModelProvider;
            Assert.IsNotNull(baseModelTypeProvider);
            var customCodeView = baseModelTypeProvider!.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            Assert.IsNull(modelTypeProvider!.CustomCodeView);

            Assert.AreEqual(1, baseModelTypeProvider!.Properties.Count);
            Assert.AreEqual("BaseProp", baseModelTypeProvider.Properties[0].Name);
            Assert.AreEqual(new CSharpType(typeof(int)), baseModelTypeProvider.Properties[0].Type);
            Assert.AreEqual(1, customCodeView!.Properties.Count);
            Assert.AreEqual("Prop1", customCodeView.Properties[0].Name);

            Assert.AreEqual(1, modelTypeProvider.Properties.Count);
            Assert.AreEqual("OtherProp", modelTypeProvider.Properties[0].Name);

            // the custom property should exist in the full ctor
            var fullCtor = modelTypeProvider.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(fullCtor);
            Assert.IsTrue(fullCtor!.Signature.Parameters.Any(p => p.Name == "prop1"));
        }

        [Test]
        public async Task CanCustomizePropertyUsingField()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputPrimitiveType.String),
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props, usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);

            Assert.AreEqual(0, modelProvider.Properties.Count);
            var writer = new TypeProviderWriter(modelProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanCustomizeFixedEnumString()
        {
            var inputEnum = InputFactory.StringEnum(
                "mockInputEnum",
                [
                    ("one", "val1"),
                    ("two", "val2"),
                    ("three", "val3")
                ],
                isExtensible: false);

            var modelProp = InputFactory.Property("prop1", inputEnum);
            var inputModel = InputFactory.Model("mockInputModel", properties: [modelProp], usage: InputModelTypeUsage.Json);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                inputEnums: () => [inputEnum],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanCustomizeStringToFixedEnum()
        {
            var modelProp = InputFactory.Property("prop1", InputPrimitiveType.String);
            var inputModel = InputFactory.Model("mockInputModel", properties: [modelProp], usage: InputModelTypeUsage.Json);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanCustomizeNullableStringToFixedEnum()
        {
            var modelProp = InputFactory.Property("prop1", new InputNullableType(InputPrimitiveType.String));
            var inputModel = InputFactory.Model("mockInputModel", properties: [modelProp], usage: InputModelTypeUsage.Json);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanCustomizeEnumToFrameworkType()
        {
            var inputEnum = InputFactory.StringEnum(
                "mockInputEnum",
                [
                    ("one", "val1"),
                    ("two", "val2"),
                    ("three", "val3")
                ],
                isExtensible: true);
            var modelProp = InputFactory.Property("prop1", inputEnum);
            var inputModel = InputFactory.Model("mockInputModel", properties: [modelProp], usage: InputModelTypeUsage.Json);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanCustomizeEnumToFieldFrameworkType()
        {
            var inputEnum = InputFactory.StringEnum(
                "mockInputEnum",
                [
                    ("one", "val1"),
                    ("two", "val2"),
                    ("three", "val3")
                ],
                isExtensible: true);
            var modelProp = InputFactory.Property("prop1", inputEnum);
            var inputModel = InputFactory.Model("mockInputModel", properties: [modelProp], usage: InputModelTypeUsage.Json);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanCustomizeUriProperty()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputPrimitiveType.String),
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props, usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanCustomizeModelName()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [], usage: InputModelTypeUsage.Json);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            // both providers should have the custom name
            Assert.AreEqual("CustomModel", modelProvider.Name);
            Assert.AreEqual("CustomModel", serializationProvider.Name);

            Assert.AreEqual("CustomModel", modelProvider.CustomCodeView?.Name);
            Assert.AreEqual("CustomModel", serializationProvider.CustomCodeView?.Name);
        }

        [Test]
        public async Task CanCustomizePropertyIntoReadOnlyMemory()
        {
            var modelProp = InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.Int32));
            var inputModel = InputFactory.Model("mockInputModel", properties: [modelProp], usage: InputModelTypeUsage.Json);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public async Task CanCustomizeBaseType(bool declareBaseTypeInCustomCode, bool camelCaseModelName)
        {
            var modelProp = InputFactory.Property("prop1", InputPrimitiveType.String);
            var inputModel = InputFactory.Model("mockInputModel", properties: [], usage: InputModelTypeUsage.Json);
            var baseModel = InputFactory.Model(
                camelCaseModelName ? "mockInputModelBase" : "MockInputModelBase",
                properties: [modelProp],
                usage: InputModelTypeUsage.Json);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel, baseModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(declareBaseTypeInCustomCode.ToString()));

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");

            // should not have the additionalProperties dictionary
            Assert.AreEqual(0, modelProvider.Fields.Count);
            Assert.IsNotNull(modelProvider.BaseType);
            Assert.AreEqual("MockInputModelBase", modelProvider.BaseType!.Name);
            Assert.AreEqual("Sample.Models", modelProvider.BaseType!.Namespace);

            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        public async Task DoesNotOverrideMethodsIfBaseTypeIsNotModel()
        {
            var modelProp = InputFactory.Property("prop1", InputPrimitiveType.String);
            var inputModel = InputFactory.Model("mockInputModel", properties: [modelProp], usage: InputModelTypeUsage.Json);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");

            // should still have the additionalProperties dictionary
            Assert.AreEqual(1, modelProvider.Fields.Count);
            Assert.IsNotNull(modelProvider.BaseType);
            Assert.AreEqual("MockClientType", modelProvider.BaseType!.Name);
            Assert.AreEqual("Sample.Models", modelProvider.BaseType!.Namespace);

            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // Validates that a customized explicit operator is not generated
        [Test]
        public async Task CustomizedExplicitOperatorNotGenerated()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [], usage: InputModelTypeUsage.Json | InputModelTypeUsage.Output);
            var operation = InputFactory.Operation(
                "getModel",
                parameters: [],
                responses: [
                    InputFactory.OperationResponse(
                        statusCodes: [200],
                        bodytype: inputModel)
                ]);
            var method = InputFactory.BasicServiceMethod("GetModel", operation);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                clients: () => [InputFactory.Client("TestClient", methods: [method])],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            // Debug: Check if the custom operator is detected in CustomCodeView
            var customCodeView = modelProvider.CustomCodeView;
            Assert.IsNotNull(customCodeView, "CustomCodeView should be detected");
            var customMethods = customCodeView!.Methods;
            var customOperator = customMethods.FirstOrDefault(m => 
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Explicit) &&
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator));
            Assert.IsNotNull(customOperator, "Custom explicit operator should be detected in CustomCodeView");

            // Verify that the custom explicit operator is recognized and not generated
            var explicitOperator = serializationProvider!.Methods.FirstOrDefault(m => 
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Explicit) &&
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator));
            Assert.IsNull(explicitOperator, "Custom explicit operator should not be generated");
        }

        // Validates that a custom implicit operator does NOT prevent generation of an explicit operator
        [Test]
        public async Task ImplicitOperatorDoesNotPreventExplicit()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [], usage: InputModelTypeUsage.Json | InputModelTypeUsage.Output);
            var operation = InputFactory.Operation(
                "getModel",
                parameters: [],
                responses: [
                    InputFactory.OperationResponse(
                        statusCodes: [200],
                        bodytype: inputModel)
                ]);
            var method = InputFactory.BasicServiceMethod("GetModel", operation);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                clients: () => [InputFactory.Client("TestClient", methods: [method])],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            // Verify that a custom implicit operator exists in CustomCodeView
            var customCodeView = modelProvider.CustomCodeView;
            Assert.IsNotNull(customCodeView, "CustomCodeView should be detected");
            var customImplicitOperator = customCodeView!.Methods.FirstOrDefault(m =>
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Implicit) &&
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator));
            Assert.IsNotNull(customImplicitOperator, "Custom implicit operator should be detected in CustomCodeView");

            // Verify that the explicit operator IS still generated (not prevented by implicit operator)
            var explicitOperator = serializationProvider!.Methods.FirstOrDefault(m =>
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Explicit) &&
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator));
            Assert.IsNotNull(explicitOperator, "Explicit operator should still be generated when only implicit operator is customized");
        }

        // Validates that a custom explicit operator with different parameter type does NOT prevent generation of explicit operator with ClientResult parameter
        [Test]
        public async Task ExplicitOperatorDifferentParamDoesNotPrevent()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [], usage: InputModelTypeUsage.Json | InputModelTypeUsage.Output);
            var operation = InputFactory.Operation(
                "getModel",
                parameters: [],
                responses: [
                    InputFactory.OperationResponse(
                        statusCodes: [200],
                        bodytype: inputModel)
                ]);
            var method = InputFactory.BasicServiceMethod("GetModel", operation);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                clients: () => [InputFactory.Client("TestClient", methods: [method])],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            // Verify that a custom explicit operator with string parameter exists in CustomCodeView
            var customCodeView = modelProvider.CustomCodeView;
            Assert.IsNotNull(customCodeView, "CustomCodeView should be detected");
            var customExplicitOperator = customCodeView!.Methods.FirstOrDefault(m =>
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Explicit) &&
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator) &&
                m.Signature.Parameters.Count == 1 &&
                m.Signature.Parameters[0].Type.Name == "String");
            Assert.IsNotNull(customExplicitOperator, "Custom explicit operator with string parameter should be detected in CustomCodeView");

            // Verify that the explicit operator with ClientResult parameter IS still generated
            var explicitOperatorWithClientResult = serializationProvider!.Methods.FirstOrDefault(m =>
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Explicit) &&
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator) &&
                m.Signature.Parameters.Count == 1 &&
                m.Signature.Parameters[0].Type.Name == "ClientResult");
            Assert.IsNotNull(explicitOperatorWithClientResult, "Explicit operator with ClientResult parameter should still be generated when operator with different parameter exists");
        }
    }
}
