// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.IO;
using System.Text.Json;
using Azure.ResourceManager.Resources.Models;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using SampleTypeSpec;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Sample_TypeSpec
{
    internal class ExternalModelPropertiesTests : LocalModelJsonTests<ExternalModelProperties>
    {
        protected override string JsonPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/ExternalModelProperties/ExternalModelProperties.json"));
        protected override string WirePayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/ExternalModelProperties/ExternalModelPropertiesWireFormat.json"));
        protected override ExternalModelProperties ToModel(ClientResult result)
            => ModelReaderWriter.Read<ExternalModelProperties>(result.GetRawResponse().Content, new ModelReaderWriterOptions("W"), SampleTypeSpecContext.Default)!;
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
            var model = ModelReaderWriter.Read<ExternalModelProperties>(new BinaryData(JsonPayload), readOptions, SampleTypeSpecContext.Default)!;

            VerifyModel(model, readFormat);

            var data = ModelReaderWriter.Write(model, writeOptions, SampleTypeSpecContext.Default);
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
            var model = ModelReaderWriter.Read<ExternalModelProperties>(new BinaryData(payload), options, SampleTypeSpecContext.Default)!;

            Assert.IsNull(model.Scalar);
            Assert.AreEqual(1, model.List.Count);
            Assert.IsNull(model.List[0]);
            Assert.AreEqual(1, model.Dictionary.Count);
            Assert.IsNull(model.Dictionary["empty"]);

            using var actual = JsonDocument.Parse(ModelReaderWriter.Write(model, options, SampleTypeSpecContext.Default));
            using var expected = JsonDocument.Parse(payload);
            Assert.IsTrue(JsonElement.DeepEquals(expected.RootElement, actual.RootElement));
        }

        private static void AssertExternalModel(ResourceGroupPatch model, JsonElement expected, string format)
        {
            Assert.AreEqual(expected.GetProperty("name").GetString(), model.Name);

            // Write as JSON even after a wire read to verify unknown properties were not retained.
            using var actual = JsonDocument.Parse(ModelReaderWriter.Write(model, ModelReaderWriterOptions.Json, SampleTypeSpecContext.Default));
            var hasUnknownProperty = actual.RootElement.TryGetProperty("extra", out var extra);
            Assert.AreEqual(format == "J", hasUnknownProperty);
            if (format == "J")
            {
                Assert.IsTrue(JsonElement.DeepEquals(expected.GetProperty("extra"), extra));
            }
        }
    }
}
