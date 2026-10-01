// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.IO;
using System.Linq;
using System.Text.Json;
using ExternalModels;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Moq;
using NUnit.Framework;
using SampleTypeSpec;
using SampleContext = Sample.SampleContext;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Sample_TypeSpec
{
    internal class ExternalModelPropertiesTests : LocalModelJsonTests<ExternalModelProperties>
    {
        [Test]
        public void GeneratedDeserializationMatchesRuntimeFixture()
        {
            var externalModel = InputFactory.Model(
                "ExternalModel",
                external: new InputExternalTypeMetadata(typeof(PersistableExternalModel).AssemblyQualifiedName!, null, null));
            var nullableExternalModel = externalModel.WithNullable(true);
            var inputModel = InputFactory.Model("ExternalModelProperties", @namespace: "SampleTypeSpec", properties:
            [
                InputFactory.Property("scalar", nullableExternalModel, isRequired: true),
                InputFactory.Property("list", InputFactory.Array(nullableExternalModel), isRequired: true),
                InputFactory.Property("dictionary", InputFactory.Dictionary(nullableExternalModel), isRequired: true)
            ]);
            var generator = MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            // Reuse the compiled SampleTypeSpec helpers instead of generating another copy.
            var factory = Mock.Get(generator.Object.TypeFactory);
            factory.SetupGet(f => f.ListInitializationType).Returns(typeof(ChangeTrackingList<>));
            factory.SetupGet(f => f.DictionaryInitializationType).Returns(typeof(ChangeTrackingDictionary<,>));
            var model = generator.Object.TypeFactory.CreateModel(inputModel)!;
            Assert.AreEqual(typeof(PersistableExternalModel), model.Properties[0].Type.FrameworkType);
            var serialization = (MrwSerializationTypeDefinition)model.SerializationProviders.Single();
            using var writer = new CodeWriter();
            writer.WriteLine($"// Copyright (c) Microsoft Corporation. All rights reserved.");
            writer.WriteLine($"// Licensed under the MIT License.");
            writer.WriteLine();
            writer.WriteLine($"#nullable disable");
            writer.WriteLine();
            using (writer.Scope($"namespace {model.Type.Namespace}"))
            using (writer.Scope($"public partial class {model.Type.Name}"))
            {
                writer.WriteMethod(serialization.Methods.Single(m => m.Signature.Name.StartsWith("Deserialize")));
            }
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        protected override string JsonPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/ExternalModelProperties/ExternalModelProperties.json"));
        protected override string WirePayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/ExternalModelProperties/ExternalModelPropertiesWireFormat.json"));
        protected override ExternalModelProperties ToModel(ClientResult result)
            => ModelReaderWriter.Read<ExternalModelProperties>(result.GetRawResponse().Content, new ModelReaderWriterOptions("W"), SampleContext.Default)!;
        protected override BinaryContent ToBinaryContent(ExternalModelProperties model)
            => BinaryContent.Create(model, new ModelReaderWriterOptions("W"));

        protected override void VerifyModel(ExternalModelProperties model, string format)
        {
            using var expected = JsonDocument.Parse(JsonPayload);
            AssertExternalModel(model.Scalar, expected.RootElement.GetProperty("scalar"), format);
            Assert.AreEqual(2, model.List.Count);
            AssertExternalModel(model.List[0], expected.RootElement.GetProperty("list")[0], format);
            Assert.IsNull(model.List[1]);
            Assert.AreEqual(2, model.Dictionary.Count);
            AssertExternalModel(model.Dictionary["model"], expected.RootElement.GetProperty("dictionary").GetProperty("model"), format);
            Assert.IsNull(model.Dictionary["empty"]);

            var rawData = GetRawData(model);
            Assert.AreEqual(format == "J" ? 1 : 0, rawData.Count);
            if (format == "J")
            {
                Assert.AreEqual("outer unknown", rawData["extra"].ToObjectFromJson<string>());
            }
        }

        protected override void CompareModels(ExternalModelProperties model, ExternalModelProperties model2, string format)
            => VerifyModel(model2, format);

        [TestCase("J", "J")]
        [TestCase("J", "W")]
        [TestCase("W", "J")]
        [TestCase("W", "W")]
        public void ExternalModelsHonorReaderAndWriterOptions(string readFormat, string writeFormat)
        {
            var readOptions = readFormat == "J" ? ModelReaderWriterOptions.Json : new ModelReaderWriterOptions("W");
            var writeOptions = writeFormat == "J" ? ModelReaderWriterOptions.Json : new ModelReaderWriterOptions("W");
            var model = ModelReaderWriter.Read<ExternalModelProperties>(new BinaryData(JsonPayload), readOptions, SampleContext.Default)!;

            VerifyModel(model, readFormat);

            var data = ModelReaderWriter.Write(model, writeOptions, SampleContext.Default);
            using var actual = JsonDocument.Parse(data);
            using var expected = JsonDocument.Parse(readFormat == "J" && writeFormat == "J" ? JsonPayload : WirePayload);
            Assert.IsTrue(JsonElement.DeepEquals(expected.RootElement, actual.RootElement));
        }

        [TestCase("J")]
        [TestCase("W")]
        public void NullExternalModelsRoundTrip(string format)
        {
            var payload = File.ReadAllText(ModelTestHelper.GetLocation("TestData/ExternalModelProperties/ExternalModelPropertiesWithNulls.json"));
            var options = format == "J" ? ModelReaderWriterOptions.Json : new ModelReaderWriterOptions("W");
            var model = ModelReaderWriter.Read<ExternalModelProperties>(new BinaryData(payload), options, SampleContext.Default)!;

            Assert.IsNull(model.Scalar);
            Assert.AreEqual(1, model.List.Count);
            Assert.IsNull(model.List[0]);
            Assert.AreEqual(1, model.Dictionary.Count);
            Assert.IsNull(model.Dictionary["empty"]);

            using var actual = JsonDocument.Parse(ModelReaderWriter.Write(model, options, SampleContext.Default));
            using var expected = JsonDocument.Parse(payload);
            Assert.IsTrue(JsonElement.DeepEquals(expected.RootElement, actual.RootElement));
        }

        [TestCase("J")]
        [TestCase("W")]
        public void OmittedExternalModelCollectionsAreInitialized(string format)
        {
            var payload = File.ReadAllText(ModelTestHelper.GetLocation("TestData/ExternalModelProperties/ExternalModelPropertiesWithOmittedCollections.json"));
            var options = format == "J" ? ModelReaderWriterOptions.Json : new ModelReaderWriterOptions("W");
            var model = ModelReaderWriter.Read<ExternalModelProperties>(new BinaryData(payload), options, SampleContext.Default)!;

            Assert.IsNull(model.Scalar);
            Assert.IsNotNull(model.List);
            Assert.IsEmpty(model.List);
            Assert.IsNotNull(model.Dictionary);
            Assert.IsEmpty(model.Dictionary);

            using var actual = JsonDocument.Parse(ModelReaderWriter.Write(model, options, SampleContext.Default));
            Assert.AreEqual(JsonValueKind.Null, actual.RootElement.GetProperty("scalar").ValueKind);
            Assert.AreEqual(0, actual.RootElement.GetProperty("list").GetArrayLength());
            Assert.IsEmpty(actual.RootElement.GetProperty("dictionary").EnumerateObject());
        }

        private static void AssertExternalModel(PersistableExternalModel? model, JsonElement expected, string format)
        {
            Assert.IsNotNull(model);
            Assert.AreEqual(expected.GetProperty("name").GetString(), model!.Name);

            // Write as JSON even after a wire read to verify unknown properties were not retained.
            using var actual = JsonDocument.Parse(ModelReaderWriter.Write(model, ModelReaderWriterOptions.Json, SampleContext.Default));
            var hasUnknownProperty = actual.RootElement.TryGetProperty("extra", out var extra);
            Assert.AreEqual(format == "J", hasUnknownProperty);
            if (format == "J")
            {
                Assert.IsTrue(JsonElement.DeepEquals(expected.GetProperty("extra"), extra));
            }
        }
    }
}
