// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Xml;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class XmlSerializationTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator(createSerializationsCore: (inputType, typeProvider)
                => inputType is InputModelType modeltype ? [new MockMrwProvider(modeltype, (typeProvider as ModelProvider)!)] : []);
        }

        [Test]
        public void XmlSerializationMethodIsGeneratedForXmlModel()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property("Name", InputPrimitiveType.String)]);

            var modelProvider = new ModelProvider(inputModel);
            var mrwProvider = modelProvider.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;

            Assert.IsNotNull(mrwProvider);
            var xmlSerializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "XmlModelWriteCore" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XmlWriter))));
            Assert.IsNotNull(xmlSerializationMethod, "XML serialization method should be generated for models with XML usage");
            Assert.AreEqual("XmlModelWriteCore", xmlSerializationMethod!.Signature.Name);
            Assert.AreEqual(2, xmlSerializationMethod.Signature.Parameters.Count);
            Assert.AreEqual(typeof(XmlWriter), xmlSerializationMethod.Signature.Parameters[0].Type.FrameworkType);
            Assert.IsTrue(xmlSerializationMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected));
            Assert.IsTrue(xmlSerializationMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
        }

        [Test]
        public void XmlSerializationMethodIsNotGeneratedForJsonOnlyModel()
        {
            var inputModel = InputFactory.Model(
                "TestJsonModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json,
                properties: [InputFactory.Property("Name", InputPrimitiveType.String)]);

            var modelProvider = new ModelProvider(inputModel);
            var mrwProvider = modelProvider.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;

            Assert.IsNotNull(mrwProvider);
            var xmlSerializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "XmlModelWriteCore" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XmlWriter))));
            Assert.IsNull(xmlSerializationMethod, "XML serialization method should NOT be generated for JSON-only models");
        }

        [Test]
        public void TestBuildImplicitToBinaryContent()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property("Name", InputPrimitiveType.String)]);

            var (model, serialization) = MrwSerializationTypeDefinitionTests.CreateModelAndSerialization(inputModel, isRootInput: true, isRootOutput: false);
            var methods = serialization.Methods;

            Assert.IsTrue(methods.Count > 0);

            var method = methods.FirstOrDefault(m => m.Signature.Name == nameof(BinaryContent));

            Assert.IsNotNull(method, "Implicit operator to BinaryContent should be generated for XML models that are root input models");

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);

            var expectedModifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator;
            Assert.AreEqual(nameof(BinaryContent), methodSignature?.Name);
            Assert.AreEqual(expectedModifiers, methodSignature?.Modifiers);

            var methodParameters = methodSignature?.Parameters;
            Assert.AreEqual(1, methodParameters?.Count);
            Assert.IsTrue(methodSignature?.ReturnType!.Equals(typeof(BinaryContent)));
        }

        [Test]
        public void XmlOnlyModelImplementsIPersistableModel()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property("Name", InputPrimitiveType.String)]);

            var (model, serialization) = MrwSerializationTypeDefinitionTests.CreateModelAndSerialization(inputModel, isRootInput: true, isRootOutput: false);
            var interfaces = serialization.Implements;

            Assert.IsNotNull(interfaces);
            Assert.AreEqual(1, interfaces.Count);

            var expectedIPersistableModelInterface = new CSharpType(typeof(IPersistableModel<>), model.Type);
            Assert.IsTrue(interfaces.Any(i => i.Equals(expectedIPersistableModelInterface)), "XML-only models should implement IPersistableModel<T>");

            var unexpectedIJsonModelInterface = new CSharpType(typeof(IJsonModel<>), model.Type);
            Assert.IsFalse(interfaces.Any(i => i.Equals(unexpectedIJsonModelInterface)), "XML-only models should NOT implement IJsonModel<T>");
        }

        [Test]
        public void JsonAndXmlModelImplementsIJsonModel()
        {
            var inputModel = InputFactory.Model(
                "TestJsonXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property("Name", InputPrimitiveType.String)]);

            var (model, serialization) = MrwSerializationTypeDefinitionTests.CreateModelAndSerialization(inputModel);
            var interfaces = serialization.Implements;

            Assert.IsNotNull(interfaces);
            Assert.AreEqual(1, interfaces.Count);

            var expectedIJsonModelInterface = new CSharpType(typeof(IJsonModel<>), model.Type);
            Assert.IsTrue(interfaces.Any(i => i.Equals(expectedIJsonModelInterface)), "JSON+XML models should implement IJsonModel<T>");

            // IJsonModel<T> extends IPersistableModel<T>, so we don't need to explicitly implement IPersistableModel<T>
            var unexpectedIPersistableModelInterface = new CSharpType(typeof(IPersistableModel<>), model.Type);
            Assert.IsFalse(interfaces.Any(i => i.Equals(unexpectedIPersistableModelInterface)), "JSON+XML models should implement IJsonModel<T> not IPersistableModel<T> directly");
        }

        [Test]
        public async Task XmlOnlyModelGeneratesIPersistableModelMethods()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, wireName: "name", serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("name")))
                ]);
            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModels: () => [inputModel],
                createSerializationsCore: (inputType, typeProvider)
                    => inputType is InputModelType modeltype
                    ? [new MockIPersistableModelMrwProvider(modeltype, (typeProvider as ModelProvider)!)]
                    : []);

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider && t.Name == "TestXmlModel");
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task XmlSerializationMethodBodyContainsPropertySerialization()
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
        public async Task XmlSerializationMethodHandlesNestedModel()
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
        public async Task XmlSerializationMethodHandlesUnwrappedListProperty()
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
        public async Task XmlSerializationMethodHandlesWrappedListProperty()
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
        public void XmlSerializationHandlesDateTimeOffsetProperty()
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
            var xmlSerializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "XmlModelWriteCore" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XmlWriter))));

            Assert.IsNotNull(xmlSerializationMethod);
            var methodBody = xmlSerializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("WriteStringValue") && methodBody.Contains("Timestamp"),
                $"DateTimeOffset property should be serialized with WriteStringValue. Actual:\n{methodBody}");
        }

        [Test]
        public void XmlSerializationHandlesTimeSpanProperty()
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
            var xmlSerializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "XmlModelWriteCore" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XmlWriter))));

            Assert.IsNotNull(xmlSerializationMethod);
            var methodBody = xmlSerializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("Duration") && methodBody.Contains("WriteStringValue"),
                $"TimeSpan property should be serialized with WriteStringValue. Actual:\n{methodBody}");
        }

        [Test]
        public void XmlSerializationHandlesNullableDateTimeOffsetProperty()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property(
                    "timestamp",
                    new InputDateTimeType(DateTimeKnownEncoding.Rfc3339, "utcDateTime", "TypeSpec.utcDateTime", InputPrimitiveType.String),
                    isRequired: false,
                    serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("timestamp")))]);
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
        public void XmlSerializationHandlesNullableTimeSpanProperty()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property(
                    "duration",
                    new InputDurationType(DurationKnownEncoding.Iso8601, "duration", "TypeSpec.duration", InputPrimitiveType.String, null),
                    isRequired: false,
                    serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("duration")))]);
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
        public void XmlSerializationHandlesBytesProperty()
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
            var xmlSerializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "XmlModelWriteCore" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XmlWriter))));

            Assert.IsNotNull(xmlSerializationMethod);
            var methodBody = xmlSerializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("WriteBase64") && methodBody.Contains("Data"),
                $"Bytes property should use WriteBase64 for serialization. Actual:\n{methodBody}");
        }

        [Test]
        public void XmlSerializationHandlesBinaryDataProperty()
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
            var xmlSerializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "XmlModelWriteCore" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XmlWriter))));

            Assert.IsNotNull(xmlSerializationMethod);
            var methodBody = xmlSerializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("Content") && methodBody.Contains("WriteValue"),
                $"BinaryData property should be serialized. Actual:\n{methodBody}");
        }

        [Test]
        public void XmlSerializationHandlesFixedEnumProperty()
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
            var xmlSerializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "XmlModelWriteCore" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XmlWriter))));

            Assert.IsNotNull(xmlSerializationMethod);
            var methodBody = xmlSerializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("Status") && methodBody.Contains("ToSerialString"),
                $"Fixed enum property should use ToSerialString() extension method. Actual:\n{methodBody}");
        }

        [Test]
        public void XmlSerializationHandlesExtensibleEnumProperty()
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
            var xmlSerializationMethod = mrwProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "XmlModelWriteCore" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(XmlWriter))));

            Assert.IsNotNull(xmlSerializationMethod);
            var methodBody = xmlSerializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("Status") && methodBody.Contains("ToString"),
                $"Extensible enum property should use ToString() method. Actual:\n{methodBody}");
        }

        [Test]
        public async Task XmlSerializationForDiscriminatedBaseType()
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

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                mrwProvider!,
                name => name == "XmlModelWriteCore" || name == "WriteXml" || name == "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task XmlSerializationForDiscriminatedSubtype()
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
                name => name == "XmlModelWriteCore" || name == "WriteXml" || name == "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task XmlSerializationHandlesAttributeProperties()
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
                name => name == "XmlModelWriteCore" || name == "WriteXml" || name == "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task XmlSerializationHandlesAttributeWithNamespace()
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
                name => name == "XmlModelWriteCore" || name == "WriteXml" || name == "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task XmlSerializationHandlesElementWithNamespace()
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
                name => name == "XmlModelWriteCore" || name == "WriteXml" || name == "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task PersistableModelWriteCoreHandlesXmlFormat()
        {
            var inputModel = InputFactory.Model(
                "TestXmlModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("name")))
                ]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel]);

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider && t.Name == "TestXmlModel");
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider,
                name => name == "PersistableModelWriteCore"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task PersistableModelWriteCoreHandlesJsonAndXmlFormats()
        {
            var inputModel = InputFactory.Model(
                "TestModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json | InputModelTypeUsage.Xml,
                properties:
                [
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, wireName: "name", serializationOptions: InputFactory.Serialization.Options(xml: InputFactory.Serialization.Xml("name")))
                ]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel]);

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider && t.Name == "TestModel");
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider,
                name => name == "PersistableModelWriteCore"));

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
                    .Where(m => m.Signature.Name.StartsWith("XmlModelWriteCore") ||
                                m.Signature.Name.StartsWith("PersistableModelWriteCore") ||
                                m.Signature.Name == "WriteXml" || m.Signature.Name == "Write")];
            }

            protected override FieldProvider[] BuildFields() => [];
        }

        private class MockIPersistableModelMrwProvider : MrwSerializationTypeDefinition
        {
            public MockIPersistableModelMrwProvider(InputModelType inputModel, ModelProvider modelProvider)
                : base(inputModel, modelProvider)
            {
            }

            protected override MethodProvider[] BuildMethods()
            {
                // Filter to only include IPersistableModel explicit interface methods
                return [.. base.BuildMethods()
                    .Where(m => m.Signature.ExplicitInterface != null &&
                                m.Signature.ExplicitInterface.Name == "IPersistableModel")];
            }

            protected override FieldProvider[] BuildFields() => [];
        }
    }
}
