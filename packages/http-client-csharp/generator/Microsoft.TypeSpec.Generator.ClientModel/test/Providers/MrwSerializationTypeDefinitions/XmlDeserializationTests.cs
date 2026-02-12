// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class XmlDeserializationTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator(createSerializationsCore: (inputType, typeProvider)
                => inputType is InputModelType modeltype ? [new MockMrwProvider(modeltype, (typeProvider as ModelProvider)!)] : []);
        }

        [Test]
        public void XmlDeserializationMethodIsGeneratedForXmlModel()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property("Name", InputPrimitiveType.String)]);

            var modelProvider = new ModelProvider(inputModel);
            var mrwProvider = modelProvider.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;

            Assert.IsNotNull(mrwProvider);
            var xmlDeserializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "DeserializeTestXmlModel" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XElement))));
            Assert.IsNotNull(xmlDeserializationMethod, "XML deserialization method should be generated for models with XML usage");
            Assert.AreEqual("DeserializeTestXmlModel", xmlDeserializationMethod!.Signature.Name);
            Assert.AreEqual(2, xmlDeserializationMethod.Signature.Parameters.Count);
            Assert.AreEqual(typeof(XElement), xmlDeserializationMethod.Signature.Parameters[0].Type.FrameworkType);
            Assert.IsTrue(xmlDeserializationMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsTrue(xmlDeserializationMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static));
        }

        [Test]
        public void XmlDeserializationMethodIsNotGeneratedForJsonOnlyModel()
        {
            var inputModel = InputFactory.Model(
                "TestJsonModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json,
                properties: [InputFactory.Property("Name", InputPrimitiveType.String)]);

            var modelProvider = new ModelProvider(inputModel);
            var mrwProvider = modelProvider.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;

            Assert.IsNotNull(mrwProvider);
            var xmlDeserializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "DeserializeTestJsonModel" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XElement))));
            Assert.IsNull(xmlDeserializationMethod, "XML deserialization method should NOT be generated for JSON-only models");
        }

        [Test]
        public async Task XmlDeserializationMethodBodyContainsPropertyDeserialization()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("name")))]);
            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [inputModel],
                createSerializationsCore: (inputType, typeProvider)
                    => inputType is InputModelType modeltype
                    ? [new MockMrwProvider(modeltype, (typeProvider as ModelProvider)!)]
                    : []);

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider && t.Name == "TestXmlModel");
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task XmlDeserializationMethodHandlesNestedModel()
        {
            var innerModel = InputFactory.Model(
                "InnerModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property("value", InputPrimitiveType.String, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("value")))]);
            var outerModel = InputFactory.Model(
                "OuterModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property("inner", innerModel, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("inner")))]);
            var mockGenerator = MockHelpers.LoadMockGenerator(
               inputModels: () => [innerModel, outerModel],
               createSerializationsCore: (inputType, typeProvider)
                   => inputType is InputModelType modeltype
                   ? [new MockMrwProvider(modeltype, (typeProvider as ModelProvider)!)]
                   : []);

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider && t.Name == "OuterModel");
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task XmlDeserializationMethodHandlesUnwrappedListProperty()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property(
                    "colors",
                    InputFactory.Array(InputPrimitiveType.String),
                    isRequired: true,
                    serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("colors", unwrapped: true)))]);
            var mockGenerator = MockHelpers.LoadMockGenerator(
               inputModels: () => [inputModel],
               createSerializationsCore: (inputType, typeProvider)
                   => inputType is InputModelType modeltype
                   ? [new MockMrwProvider(modeltype, (typeProvider as ModelProvider)!)]
                   : []);

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider && t.Name == "TestXmlModel");
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task XmlDeserializationMethodHandlesWrappedListProperty()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property(
                    "counts",
                    InputFactory.Array(InputPrimitiveType.Int32),
                    isRequired: true,
                    serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("counts", unwrapped: false, itemsName: "int32")))]);
            var mockGenerator = MockHelpers.LoadMockGenerator(
               inputModels: () => [inputModel],
               createSerializationsCore: (inputType, typeProvider)
                   => inputType is InputModelType modeltype
                   ? [new MockMrwProvider(modeltype, (typeProvider as ModelProvider)!)]
                   : []);

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider && t.Name == "TestXmlModel");
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void XmlDeserializationHandlesDateTimeOffsetProperty()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property(
                    "timestamp",
                    new InputDateTimeType(DateTimeKnownEncoding.Rfc3339, "utcDateTime", "TypeSpec.utcDateTime", InputPrimitiveType.String),
                    serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("timestamp")))]);

            var modelProvider = new ModelProvider(inputModel);
            var mrwProvider = modelProvider.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(mrwProvider);
            var xmlDeserializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "DeserializeTestXmlModel" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XElement))));

            Assert.IsNotNull(xmlDeserializationMethod);
            var methodBody = xmlDeserializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("timestamp = child.GetDateTimeOffset(\"O\")"),
                $"DateTimeOffset property should use child.GetDateTimeOffset(\"O\") with RFC3339 format. Actual:\n{methodBody}");
        }

        [Test]
        public void XmlDeserializationHandlesTimeSpanProperty()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property(
                    "duration",
                    new InputDurationType(DurationKnownEncoding.Iso8601, "duration", "TypeSpec.duration", InputPrimitiveType.String, null),
                    serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("duration")))]);

            var modelProvider = new ModelProvider(inputModel);
            var mrwProvider = modelProvider.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(mrwProvider);
            var xmlDeserializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "DeserializeTestXmlModel" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XElement))));

            Assert.IsNotNull(xmlDeserializationMethod);
            var methodBody = xmlDeserializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("duration = child.GetTimeSpan(\"P\")"),
                $"TimeSpan property should use child.GetTimeSpan(\"P\") with ISO8601 format. Actual:\n{methodBody}");
        }

        [Test]
        public void XmlDeserializationHandlesBytesProperty()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property(
                    "data",
                    InputPrimitiveType.Base64,
                    serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("data")))]);

            var modelProvider = new ModelProvider(inputModel);
            var mrwProvider = modelProvider.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(mrwProvider);
            var xmlDeserializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "DeserializeTestXmlModel" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XElement))));

            Assert.IsNotNull(xmlDeserializationMethod);
            var methodBody = xmlDeserializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("child.GetBytesFromBase64(\"D\")"),
                $"Bytes property should use child.GetBytesFromBase64(\"D\") with Base64 format. Actual:\n{methodBody}");
        }

        [Test]
        public void XmlDeserializationHandlesBinaryDataProperty()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property(
                    "content",
                    InputPrimitiveType.Any,
                    serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("content")))]);

            var modelProvider = new ModelProvider(inputModel);
            var mrwProvider = modelProvider.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(mrwProvider);
            var xmlDeserializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "DeserializeTestXmlModel" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XElement))));

            Assert.IsNotNull(xmlDeserializationMethod);
            var methodBody = xmlDeserializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("content = global::System.BinaryData.FromString(child.Value)"),
                $"BinaryData property should use BinaryData.FromString(child.Value) for deserialization. Actual:\n{methodBody}");
        }

        [Test]
        public void XmlDeserializationHandlesFixedEnumProperty()
        {
            var enumType = InputFactory.StringEnum(
                "TestEnum",
                [("Value1", "value1"), ("Value2", "value2")],
                isExtensible: false);

            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property(
                    "status",
                    enumType,
                    serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("status")))]);

            MockHelpers.LoadMockGenerator(
                inputEnums: () => [enumType],
                createSerializationsCore: (inputType, typeProvider)
                    => inputType is InputModelType modelType ? [new MrwSerializationTypeDefinition(modelType, (typeProvider as ModelProvider)!)] : []);

            var modelProvider = new ModelProvider(inputModel);
            var mrwProvider = modelProvider.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(mrwProvider);
            var xmlDeserializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "DeserializeTestXmlModel" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XElement))));

            Assert.IsNotNull(xmlDeserializationMethod);
            var methodBody = xmlDeserializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("status = ((string)child).ToTestEnum()"),
                $"Fixed enum property should use ToEnumName() extension method. Actual:\n{methodBody}");
        }

        [Test]
        public void XmlDeserializationHandlesExtensibleEnumProperty()
        {
            var enumType = InputFactory.StringEnum(
                "TestEnum",
                [("Value1", "value1"), ("Value2", "value2")],
                isExtensible: true);

            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property(
                    "status",
                    enumType,
                    serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("status")))]);

            MockHelpers.LoadMockGenerator(
                inputEnums: () => [enumType],
                createSerializationsCore: (inputType, typeProvider)
                    => inputType is InputModelType modelType ? [new MrwSerializationTypeDefinition(modelType, (typeProvider as ModelProvider)!)] : []);

            var modelProvider = new ModelProvider(inputModel);
            var mrwProvider = modelProvider.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(mrwProvider);
            var xmlDeserializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "DeserializeTestXmlModel" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XElement))));

            Assert.IsNotNull(xmlDeserializationMethod);
            var methodBody = xmlDeserializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("status = new global::Sample.Models.TestEnum(((string)child))"),
                $"Extensible enum property should use new EnumName(value) constructor. Actual:\n{methodBody}");
        }

        [Test]
        public async Task XmlDeserializationForDiscriminatedBaseType()
        {
            var catModel = InputFactory.Model(
                "cat",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                discriminatedKind: "cat",
                properties:
                [
                    InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("meows")))
                ]);
            var baseModel = InputFactory.Model(
                "pet",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("kind"))),
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("name")))
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", catModel } });

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [baseModel, catModel]);

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider && t.Name == "Pet") as ModelProvider;
            Assert.IsNotNull(modelProvider);
            var mrwProvider = modelProvider!.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(mrwProvider);

            // Validate proxy attribute is generated for discriminated base type
            var proxyAttribute = mrwProvider!.Attributes.FirstOrDefault(a => a.Type.Equals(typeof(PersistableModelProxyAttribute)));
            Assert.IsNotNull(proxyAttribute, "Base discriminated type should have PersistableModelProxyAttribute");

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                mrwProvider!,
                name => name == "DeserializePet"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task XmlDeserializationForDiscriminatedSubtype()
        {
            var catModel = InputFactory.Model(
                "cat",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                discriminatedKind: "cat",
                properties:
                [
                    InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("meows")))
                ]);
            var baseModel = InputFactory.Model(
                "pet",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("kind"))),
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("name")))
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", catModel } });

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [baseModel, catModel]);

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider && t.Name == "Cat") as ModelProvider;
            Assert.IsNotNull(modelProvider);
            var mrwProvider = modelProvider!.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(mrwProvider);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                mrwProvider!,
                name => name == "DeserializeCat"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task XmlDeserializationHandlesAttributeProperties()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("id", InputPrimitiveType.String, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("id", attribute: true))),
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("name")))
                ]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel]);

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider && t.Name == "TestXmlModel");
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider,
                name => name == "DeserializeTestXmlModel"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task XmlDeserializationHandlesAttributeWithNamespace()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("id", InputPrimitiveType.String, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("id", attribute: true))),
                    InputFactory.Property("label", InputPrimitiveType.String, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("label", attribute: true, @namespace: InputFactory.Serialization.XmlNamespace("https://example.com/ns1", "ns1")))),
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("name")))
                ]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel]);

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider && t.Name == "TestXmlModel");
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider,
                name => name == "DeserializeTestXmlModel"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task XmlDeserializationHandlesElementWithNamespace()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("id", InputPrimitiveType.String, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("id"))),
                    InputFactory.Property("category", InputPrimitiveType.String, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("category", @namespace: InputFactory.Serialization.XmlNamespace("https://example.com/ns1", "ns1"))))
                ]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel]);

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider && t.Name == "TestXmlModel");
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider,
                name => name == "DeserializeTestXmlModel"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ExplicitOperatorForXmlOnlyModel()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("name")))
                ]);

            var (_, serialization) = MrwSerializationTypeDefinitionTests.CreateModelAndSerialization(inputModel);
            var method = serialization.Methods.FirstOrDefault(m => m.Signature.Name == "TestXmlModel");
            Assert.IsNotNull(method);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization,
                name => name == "TestXmlModel"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ExplicitOperatorForJsonAndXmlModel()
        {
            var inputModel = InputFactory.Model(
                "TestModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, wireName: "name", serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("name")))
                ]);

            var (_, serialization) = MrwSerializationTypeDefinitionTests.CreateModelAndSerialization(inputModel);
            var method = serialization.Methods.FirstOrDefault(m => m.Signature.Name == "TestModel");
            Assert.IsNotNull(method);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization,
                name => name == "TestModel"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        private class MockMrwProvider : MrwSerializationTypeDefinition
        {
            public MockMrwProvider(InputModelType inputModel, ModelProvider modelProvider)
                : base(inputModel, modelProvider)
            {
            }

            protected override MethodProvider[] BuildMethods()
            {
                return [.. base.BuildMethods()
                    .Where(m => m.Signature.Name.StartsWith("Deserialize") || m.Signature.Name.StartsWith("PersistableModelCreateCore"))];
            }

            protected override FieldProvider[] BuildFields() => [];
        }
    }
}
