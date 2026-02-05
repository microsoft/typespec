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
    public class XmlSerializationCustomizationTests
    {
        // Validates that the generated deserialization method is replaced when a custom one is provided.
        [Test]
        public async Task CanReplaceDeserializationMethod()
        {
            var inputModel = InputFactory.Model(
                "mockInputModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("Prop1", InputPrimitiveType.String, xmlSerializationOptions: new("prop1")),
                    InputFactory.Property("Prop2", new InputNullableType(InputPrimitiveType.String), xmlSerializationOptions: new("prop2"))
                ]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var methods = serializationProvider!.Methods;

            // Validate the deserialization method doesn't exist in the serialization provider
            Assert.IsNull(methods.FirstOrDefault(m => m.Signature.Name == "DeserializeMockInputModel"));

            var canonicalView = modelProvider.CanonicalView;
            Assert.IsNotNull(canonicalView);

            var canonicalMethods = canonicalView.Methods;
            Assert.IsNotNull(canonicalMethods);
            Assert.IsNotNull(canonicalMethods.FirstOrDefault(m => m.Signature.Name == "DeserializeMockInputModel"));


            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // Validates that a property name can be changed using CodeGenMember attribute and
        // the deserialization method uses the renamed property.
        [Test]
        public async Task CanChangePropertyName()
        {
            var inputModel = InputFactory.Model(
                "model",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("Prop1", InputPrimitiveType.String, xmlSerializationOptions: new("prop1"))
                ]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);

            Assert.IsNotNull(modelProvider);
            Assert.IsNotNull(serializationProvider);

            // Validate that the Color property was renamed to CustomColor
            var customCodeView = modelProvider.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            var customProperties = customCodeView!.Properties;
            Assert.AreEqual(1, customProperties.Count);
            Assert.AreEqual("Prop2", customProperties[0].Name);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider,
                name => name == "DeserializeModel"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // Validates that a custom deserialization hook can be used to customize property deserialization.
        [Test]
        public async Task CanCustomizeDeserializationMethod()
        {
            var inputModel = InputFactory.Model(
                "mockInputModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("Prop1", InputPrimitiveType.String, xmlSerializationOptions: new("prop1")),
                    InputFactory.Property("Prop2", new InputNullableType(InputPrimitiveType.String), xmlSerializationOptions: new("prop2"))
                ]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider!,
                name => name == "DeserializeMockInputModel"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // Validates that a custom deserialization hook can be used to customize attribute property deserialization.
        [Test]
        public async Task CanCustomizeAttributeDeserializationMethod()
        {
            var inputModel = InputFactory.Model(
                "mockInputModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("Id", InputPrimitiveType.String, xmlSerializationOptions: new("id", attribute: true)),
                    InputFactory.Property("Name", InputPrimitiveType.String, xmlSerializationOptions: new("name"))
                ]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider!,
                name => name == "DeserializeMockInputModel"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
