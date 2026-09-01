// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using ScmModel = Microsoft.TypeSpec.Generator.ClientModel.Providers.ScmModelProvider;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MultipartFormDataSerializationDefinitions
{
    public class MultipartFormDataSerializationDefinitionTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
        }

        private static string WriteSerialization(InputModelType inputModel)
        {
            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var serialization = new MultipartFormDataSerializationDefinition(inputModel, model);
            return new TypeProviderWriter(serialization).Write().Content;
        }

        private static string WriteSerialization(InputModelType inputModel, IReadOnlyList<InputEnumType> inputEnums)
        {
            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], inputEnums: () => inputEnums);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var serialization = new MultipartFormDataSerializationDefinition(inputModel, model);
            return new TypeProviderWriter(serialization).Write().Content;
        }

        private static async Task<string> WriteSerializationWithCustomCodeAsync(
            InputModelType inputModel,
            string modelName,
            [CallerMemberName] string method = "")
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(method: method));
            var model = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ScmModel>().Single(t => t.Name == modelName);
            var serialization = new MultipartFormDataSerializationDefinition(inputModel, model);
            return new TypeProviderWriter(serialization).Write().Content;
        }

        [Test]
        public void TestSerialization_SingleRequiredFile()
        {
            var inputModel = MultipartModel(
                "FileRequest",
                [FilePartProperty("profileImage")]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_MultiFilePart()
        {
            var inputModel = MultipartModel(
                "BinaryArrayPartsRequest",
                [MultiFilePartProperty("pictures")]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_MultiFilePartWithContentType_OmitsMediaType()
        {
            // File parts carry their media type inside the FileBinaryContent, so the Add overload must not
            // receive one (it has no media type parameter for FileBinaryContent).
            var contentTypeProperty = InputFactory.Property("contentType", InputFactory.Literal.String("image/png"));
            var inputModel = MultipartModel(
                "FileArrayWithContentTypeRequest",
                [MultiFilePartProperty("files", contentType: contentTypeProperty)]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_OptionalFile()
        {
            var inputModel = MultipartModel(
                "OptionalFileRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("optionalFile", isRequired: false),
                ]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_StringWithDefaultContentType()
        {
            var inputModel = MultipartModel(
                "TextRequest",
                [NonFilePartProperty("id", InputPrimitiveType.String, defaultContentTypes: ["text/plain"])]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_PrimitiveWithExplicitContentType_EmitsMediaType()
        {
            var contentTypeProperty = InputFactory.Property("contentType", InputFactory.Literal.String("application/json"));
            var inputModel = MultipartModel(
                "ExplicitContentTypeRequest",
                [NonFilePartProperty("id", InputPrimitiveType.String, defaultContentTypes: ["application/json"], contentType: contentTypeProperty)]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [TestCase(new[] { "application/json" }, "WithDefaultContentType")]
        [TestCase(new string[0], "WithoutDefaultContentType")]
        public void TestSerialization_BinaryDataPart(string[] defaultContentTypes, string caseName)
        {
            var inputModel = MultipartModel(
                "BinaryDataRequest",
                [NonFilePartProperty("someBytes", InputPrimitiveType.Any, defaultContentTypes: defaultContentTypes)]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(caseName), actual);
        }

        [Test]
        public void TestSerialization_NestedJsonModelPart()
        {
            var addressModel = InputFactory.Model("address", properties: [InputFactory.Property("city", InputPrimitiveType.String)]);
            var inputModel = MultipartModel(
                "JsonPartRequest",
                [NonFilePartProperty("address", addressModel, defaultContentTypes: ["application/json"])]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_AllPrimitiveParts()
        {
            var inputModel = MultipartModel(
                "AllPrimitivesRequest",
                [
                    NonFilePartProperty("stringPart", InputPrimitiveType.String),
                    NonFilePartProperty("boolPart", InputPrimitiveType.Boolean),
                    NonFilePartProperty("int32Part", InputPrimitiveType.Int32),
                    NonFilePartProperty("int64Part", InputPrimitiveType.Int64),
                    NonFilePartProperty("float32Part", InputPrimitiveType.Float32),
                    NonFilePartProperty("float64Part", InputPrimitiveType.Float64),
                    NonFilePartProperty("decimalPart", new InputPrimitiveType(InputPrimitiveTypeKind.Decimal128, "decimal128", "TypeSpec.decimal128")),
                    NonFilePartProperty("sbytePart", new InputPrimitiveType(InputPrimitiveTypeKind.Int8, "int8", "TypeSpec.int8")),
                    NonFilePartProperty("bytePart", new InputPrimitiveType(InputPrimitiveTypeKind.UInt8, "uint8", "TypeSpec.uint8")),
                    NonFilePartProperty("binaryDataPart", InputPrimitiveType.Any),
                ]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_NullableValueTypePart_UnwrapsValue()
        {
            var inputModel = MultipartModel(
                "NullableValuePartRequest",
                [NonFilePartProperty("count", InputPrimitiveType.Int32, isRequired: false)]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_PrimitiveArrayPart_EmitsPartPerElement()
        {
            var inputModel = MultipartModel(
                "PrimitiveArrayRequest",
                [NonFilePartProperty("tags", InputFactory.Array(InputPrimitiveType.String), defaultContentTypes: ["text/plain"], isMulti: true)]);
            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_ModelArrayPart_AsSingleJsonPart()
        {
            var addressModel = InputFactory.Model("address", properties: [InputFactory.Property("city", InputPrimitiveType.String)]);
            var inputModel = MultipartModel(
                "ModelArrayRequest",
                [NonFilePartProperty("addresses", InputFactory.Array(addressModel), defaultContentTypes: ["application/json"])]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_ModelArrayPart_EmitsPartPerElement()
        {
            var addressModel = InputFactory.Model("address", properties: [InputFactory.Property("city", InputPrimitiveType.String)]);
            var inputModel = MultipartModel(
                "ModelArrayMultiRequest",
                [NonFilePartProperty("addresses", InputFactory.Array(addressModel), defaultContentTypes: ["application/json"], isMulti: true)]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_PrimitiveArrayPart_AsSingleJsonPart()
        {
            var inputModel = MultipartModel(
                "PrimitiveArrayJsonRequest",
                [NonFilePartProperty("tags", InputFactory.Array(InputPrimitiveType.String), defaultContentTypes: ["application/json"])]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_PrimitiveDictionaryPart_UsesMultipartFormDataHelper()
        {
            var inputModel = MultipartModel(
                "PrimitiveDictionaryRequest",
                [NonFilePartProperty("metadata", InputFactory.Dictionary(InputPrimitiveType.String), defaultContentTypes: ["application/json"])]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_ModelDictionaryPart_UsesModelReaderWriter()
        {
            var addressModel = InputFactory.Model("address", properties: [InputFactory.Property("city", InputPrimitiveType.String)]);
            var inputModel = MultipartModel(
                "ModelDictionaryRequest",
                [NonFilePartProperty("addressesByName", InputFactory.Dictionary(addressModel), defaultContentTypes: ["application/json"])]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_StringExtensibleEnumPart_UsesUnderlyingValue()
        {
            var enumType = InputFactory.StringEnum(
                "StringExtensibleEnum",
                [("Foo", "foo"), ("Bar", "bar")],
                isExtensible: true);
            var inputModel = MultipartModel(
                "StringExtensibleEnumRequest",
                [NonFilePartProperty("enumPart", enumType, defaultContentTypes: ["text/plain"])]);

            var actual = WriteSerialization(inputModel, [enumType]);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_StringFixedEnumPart_UsesUnderlyingValue()
        {
            var enumType = InputFactory.StringEnum(
                "StringFixedEnum",
                [("Foo", "foo"), ("Bar", "bar")],
                isExtensible: false);
            var inputModel = MultipartModel(
                "StringFixedEnumRequest",
                [NonFilePartProperty("enumPart", enumType, defaultContentTypes: ["text/plain"])]);

            var actual = WriteSerialization(inputModel, [enumType]);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_IntExtensibleEnumPart_UsesUnderlyingValue()
        {
            var enumType = InputFactory.Int32Enum(
                "IntExtensibleEnum",
                [("One", 1), ("Two", 2)],
                isExtensible: true);
            var inputModel = MultipartModel(
                "IntExtensibleEnumRequest",
                [NonFilePartProperty("enumPart", enumType, defaultContentTypes: ["text/plain"])]);

            var actual = WriteSerialization(inputModel, [enumType]);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_IntFixedEnumPart_UsesUnderlyingValue()
        {
            var enumType = InputFactory.Int32Enum(
                "IntFixedEnum",
                [("One", 1), ("Two", 2)],
                isExtensible: false);
            var inputModel = MultipartModel(
                "IntFixedEnumRequest",
                [NonFilePartProperty("enumPart", enumType, defaultContentTypes: ["text/plain"])]);

            var actual = WriteSerialization(inputModel, [enumType]);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_AllShapesCombined()
        {
            var addressModel = InputFactory.Model("address", properties: [InputFactory.Property("city", InputPrimitiveType.String)]);
            var inputModel = MultipartModel(
                "ComplexPartsRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String, defaultContentTypes: ["text/plain"]),
                    NonFilePartProperty("address", addressModel, defaultContentTypes: ["application/json"]),
                    FilePartProperty("profileImage"),
                    MultiFilePartProperty("pictures"),
                ]);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestSerialization_MixedJsonAndMultipartUsage()
        {
            var inputModel = MultipartModel(
                "MixedUsageRequest",
                [FilePartProperty("profileImage")],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json | InputModelTypeUsage.MultipartFormData);

            var actual = WriteSerialization(inputModel);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // A file part customized to Stream is serialized via the FileBinaryContent Add overload,
        // since MultiPartFormContent has no Stream overload but FileBinaryContent's constructor accepts a Stream.
        [Test]
        public async Task TestSerialization_CustomizedFileToStream_WrapsInFileBinaryContent()
        {
            var inputModel = MultipartModel("CustomizedFileRequest", [FilePartProperty("profileImage")]);

            var actual = await WriteSerializationWithCustomCodeAsync(inputModel, "CustomizedFileRequest");

            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // A file part customized to BinaryData is also serialized via the FileBinaryContent Add overload.
        [Test]
        public async Task TestSerialization_CustomizedFileToBinaryData_WrapsInFileBinaryContent()
        {
            var inputModel = MultipartModel("CustomizedFileRequest", [FilePartProperty("profileImage")]);

            var actual = await WriteSerializationWithCustomCodeAsync(inputModel, "CustomizedFileRequest");

            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // A non-file part customized to Stream is serialized via the BinaryData Add overload,
        // wrapping the stream with BinaryData.FromStream.
        [Test]
        public async Task TestSerialization_CustomizedNonFileToStream_WrapsInBinaryData()
        {
            var inputModel = MultipartModel(
                "CustomizedBytesRequest",
                [NonFilePartProperty("someBytes", InputPrimitiveType.String, defaultContentTypes: ["application/octet-stream"])]);

            var actual = await WriteSerializationWithCustomCodeAsync(inputModel, "CustomizedBytesRequest");

            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        private static InputModelProperty FilePartProperty(string name, bool isRequired = true)
            => InputFactory.Property(
                name,
                InputFactory.FileType(),
                isRequired: isRequired,
                serializationOptions: InputFactory.Serialization.Options(
                    multipart: InputFactory.Serialization.Multipart(name, isFilePart: true)));

        private static InputModelProperty MultiFilePartProperty(string name, InputModelProperty? contentType = null)
            => InputFactory.Property(
                name,
                InputFactory.Array(InputFactory.FileType()),
                isRequired: true,
                serializationOptions: InputFactory.Serialization.Options(
                    multipart: InputFactory.Serialization.Multipart(name, isFilePart: true, isMulti: true, contentType: contentType)));

        private static InputModelProperty NonFilePartProperty(string name, InputType type, IReadOnlyList<string>? defaultContentTypes = null, bool isMulti = false, bool isRequired = true, InputModelProperty? contentType = null)
            => InputFactory.Property(
                name,
                type,
                isRequired: isRequired,
                serializationOptions: InputFactory.Serialization.Options(
                    multipart: InputFactory.Serialization.Multipart(name, isFilePart: false, isMulti: isMulti, defaultContentTypes: defaultContentTypes ?? ["text/plain"], contentType: contentType)));

        private static InputModelType MultipartModel(
            string name,
            IEnumerable<InputModelProperty> properties,
            InputModelTypeUsage usage = InputModelTypeUsage.Input | InputModelTypeUsage.MultipartFormData)
            => InputFactory.Model(name, usage: usage, properties: properties);

    }
}
