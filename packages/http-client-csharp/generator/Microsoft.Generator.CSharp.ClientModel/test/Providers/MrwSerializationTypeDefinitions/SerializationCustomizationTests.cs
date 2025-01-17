// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class SerializationCustomizationTests
    {
        [Test]
        public async Task CanChangePropertyName()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("Model", string.Empty, properties: props, usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            // validate the methods use the custom member name
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task ReadOnlyMemPropertyType()
        {
            var inputModel = InputFactory.Model("Model", string.Empty,
                properties: [
                    InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String)),
                    InputFactory.Property("Prop2", InputFactory.Array(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            // validate the methods use the custom member name
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanCustomizeSerializationMethod()
        {
            var inputModel = InputFactory.Model("mockInputModel", string.Empty,
                properties: [
                        InputFactory.Property("Prop1", InputPrimitiveType.String),
                        InputFactory.Property("Prop2", new InputNullableType(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanCustomizeSerializationMethodForRenamedProperty()
        {
            var inputModel = InputFactory.Model("mockInputModel", string.Empty,
                properties: [
                    InputFactory.Property("Prop1", InputPrimitiveType.String),
                    InputFactory.Property("Prop2", new InputNullableType(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            // validate the methods use the custom member name
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // Validates that the custom serialization method is used in the serialization provider
        // for the custom property that exists in the base model.
        [Test]
        public async Task CanCustomizeSerializationMethodForPropertyInBase()
        {
            var baseModel = InputFactory.Model(
                "baseModel",
                string.Empty,
                usage: InputModelTypeUsage.Input,
                properties: [InputFactory.Property("Prop1", InputPrimitiveType.Int32, isRequired: true)]);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [
                    InputFactory.Model(
                        "mockInputModel",
                        string.Empty,
                        usage: InputModelTypeUsage.Json,
                        properties:
                        [
                            InputFactory.Property("OtherProp", InputPrimitiveType.Int32, isRequired: true),
                        ],
                        baseModel: baseModel),
                ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.FirstOrDefault(t => t is ModelProvider);
            Assert.IsNotNull(modelProvider);
            var serializationProvider = modelProvider!.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // Validates that a properties serialization name can be changed using custom code.
        [Test]
        public async Task CanChangePropertySerializedName()
        {
            var inputModel = InputFactory.Model("mockInputModel", string.Empty,
                properties: [
                    InputFactory.Property("Name", InputPrimitiveType.String),
                    InputFactory.Property("Color", InputPrimitiveType.String),
                    InputFactory.Property("Flavor", InputPrimitiveType.String)
                    ],
                usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);

            Assert.IsNotNull(modelProvider);
            Assert.IsNotNull(serializationProvider);

            var properties = modelProvider.Properties;
            Assert.AreEqual(2, properties.Count);
            Assert.AreEqual("Name", properties[0].Name);
            Assert.AreEqual("customName", properties[0].WireInfo?.SerializedName);
            Assert.AreEqual("Flavor", properties[1].Name);
            Assert.AreEqual("flavor", properties[1].WireInfo?.SerializedName);


            var customCodeView = modelProvider.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            var customProperties = customCodeView!.Properties;
            Assert.AreEqual(1, customProperties.Count);
            Assert.AreEqual("CustomColor", customProperties[0].Name);
            Assert.AreEqual("customColor2", customProperties[0].WireInfo?.SerializedName);

            // validate the serialization provider uses the custom property name
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanChangeDictionaryToBinaryData()
        {
            var inputModel = InputFactory.Model("mockInputModel", string.Empty,
                properties: [
                    // generated type is a dictionary of string to BinaryData
                    InputFactory.Property("Prop1", InputFactory.Dictionary(InputPrimitiveType.Any))
                    ],
                usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        private static IEnumerable<TestCaseData> ExtensibleEnumCases =>
        [
            new TestCaseData(InputPrimitiveType.String),
            new TestCaseData(InputPrimitiveType.Int32),
        ];

        [TestCaseSource(nameof(ExtensibleEnumCases))]
        public async Task CanCustomizeExtensibleEnum(InputPrimitiveType enumType)
        {
            var inputModel = InputFactory.Model("mockInputModel", string.Empty,
                properties: [
                    InputFactory.Property("Prop1", InputFactory.Enum("EnumType", enumType, isExtensible: true))
                    ],
                usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(enumType.Name));

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider.Fields.Count);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(enumType.Name), file.Content);
        }

        private static IEnumerable<TestCaseData> ExtensibleEnumCasesFromLiteral =>
        [
            new TestCaseData(InputPrimitiveType.String, "foo"),
            new TestCaseData(InputPrimitiveType.Int32, 1),
        ];

        [TestCaseSource(nameof(ExtensibleEnumCasesFromLiteral))]
        public async Task CanCustomizeLiteralExtensibleEnum(InputPrimitiveType enumType, object value)
        {
            var inputModel = InputFactory.Model("mockInputModel", string.Empty,
                properties: [
                    InputFactory.Property("Prop1", InputFactory.Literal.Enum(
                        InputFactory.Enum("EnumType", enumType, isExtensible: true),
                        value: value))
                    ],
                usage: InputModelTypeUsage.Json);
            var parameters = $"{enumType.Name},{value}";
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(parameters));

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider.Fields.Count);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(parameters), file.Content);
        }

        [Test]
        public async Task CanReplaceSerializationMethod()
        {
            var inputModel = InputFactory.Model("mockInputModel", string.Empty,
                properties: [
                    InputFactory.Property("Prop1", InputPrimitiveType.String),
                    InputFactory.Property("Prop2", new InputNullableType(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var methods = serializationProvider!.Methods;
            Assert.AreEqual(11, methods.Count);

            // validate the serialization method doesn't exist in the serialization provider
            Assert.IsNull(methods.FirstOrDefault(m => m.Signature.Name == "JsonModelWriteCore"));

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanReplaceDeserializationMethod()
        {
            var inputModel = InputFactory.Model("mockInputModel", string.Empty,
                properties: [
                    InputFactory.Property("Prop1", InputPrimitiveType.String),
                    InputFactory.Property("Prop2", new InputNullableType(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var methods = serializationProvider!.Methods;
            Assert.AreEqual(11, methods.Count);

            // validate the deserialization method doesn't exist in the serialization provider
            Assert.IsNull(methods.FirstOrDefault(m => m.Signature.Name == "DeserializeMockInputModel"));

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [TestCase(true)]
        [TestCase(false)]
        public async Task CanCustomizePropertyUsingField(bool redefineProperty)
        {
            var inputModel = InputFactory.Model("mockInputModel", string.Empty,
                properties: [
                    InputFactory.Property("Prop1", InputPrimitiveType.String),
                    ],
                usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(redefineProperty.ToString()));

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, modelProvider.Properties.Count);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);

            var fullCtor = modelProvider.Constructors.Last();
            Assert.IsTrue(fullCtor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.AreEqual(2, fullCtor.Signature.Parameters.Count);
        }

        [Test]
        public async Task CanChangeToNonNullableProp()
        {
            var inputModel = InputFactory.Model("Model", string.Empty,
                properties: [
                    InputFactory.Property("Prop1", new InputNullableType(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var deserializationMethod = serializationProvider!.Methods.Where(m => m.Signature.Name.StartsWith("Deserialize")).FirstOrDefault();
            Assert.IsNotNull(deserializationMethod);

            var deserializationStatements = deserializationMethod!.BodyStatements;

            Assert.IsTrue(deserializationStatements!.ToDisplayString().Contains(
                "if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))"));
            // since the customized property is non-nullable, the assignment to null should not be present
            Assert.IsFalse(deserializationStatements!.ToDisplayString().Contains("prop1 = null;"));
        }

        [Test]
        public async Task CanChangeListOfEnumPropToListOfExtensibleEnum()
        {
            var inputModel = InputFactory.Model("Model", string.Empty,
                properties: [
                    InputFactory.Property("Prop1", InputFactory.Array(InputFactory.Enum(
                        "MyEnum",
                        InputPrimitiveType.String,
                        usage: InputModelTypeUsage.Input,
                        values: [InputFactory.EnumMember.String("foo", "bar")])))
                    ]);

            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanChangePropertyNameAndRedefineOriginal()
        {
            var inputModel = InputFactory.Model("mockInputModel", string.Empty,
                properties: [
                    InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
                ]);

            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => new[] { inputModel },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
