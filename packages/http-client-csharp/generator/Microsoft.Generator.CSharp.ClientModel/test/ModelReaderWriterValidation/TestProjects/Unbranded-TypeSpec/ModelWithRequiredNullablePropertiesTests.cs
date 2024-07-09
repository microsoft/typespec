// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System;
using System.ClientModel.Primitives;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using UnbrandedTypeSpec.Models;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.ModelReaderWriterValidation
{
    internal class ModelWithRequiredNullablePropertiesTests : ModelJsonTests<ModelWithRequiredNullableProperties>
    {
        protected override string JsonPayload => File.ReadAllText(TestData.GetLocation("Unbranded-TypeSpec/TestData/ModelWithRequiredNullable/Model.json"));
        protected override string WirePayload => File.ReadAllText(TestData.GetLocation("Unbranded-TypeSpec/TestData/ModelWithRequiredNullable/ModelWireFormat.json"));

        protected override void CompareModels(ModelWithRequiredNullableProperties model, ModelWithRequiredNullableProperties model2, string format)
        {
            Assert.AreEqual(model.RequiredNullablePrimitive, model2.RequiredNullablePrimitive);
            Assert.AreEqual(model.RequiredExtensibleEnum.ToString(), model2.RequiredExtensibleEnum.ToString());
            Assert.AreEqual(model.RequiredFixedEnum.ToString(), model2.RequiredFixedEnum.ToString());

            if (format == "J")
            {
                var rawData = GetRawData(model);
                var rawData2 = GetRawData(model2);
                Assert.IsNotNull(rawData);
                Assert.IsNotNull(rawData2);
                Assert.AreEqual(rawData.Count, rawData2.Count);
                Assert.AreEqual(rawData["extra"].ToObjectFromJson<string>(), rawData2["extra"].ToObjectFromJson<string>());
            }
        }

        protected override void VerifyModel(ModelWithRequiredNullableProperties model, string format)
        {
            var parsedWireJson = JsonDocument.Parse(WirePayload).RootElement;
            Assert.IsNotNull(parsedWireJson);
            Assert.AreEqual(parsedWireJson.GetProperty("requiredNullablePrimitive").GetInt32(), model.RequiredNullablePrimitive);
            var requiredExtensibleEnumValue = parsedWireJson.GetProperty("requiredExtensibleEnum").GetString();
            Assert.AreEqual(new StringExtensibleEnum(requiredExtensibleEnumValue), model.RequiredExtensibleEnum);
            Assert.AreEqual(StringFixedEnum.One, model.RequiredFixedEnum);

            var rawData = GetRawData(model);
            Assert.IsNotNull(rawData);
            if (format == "J")
            {
                var parsedJson = JsonDocument.Parse(JsonPayload).RootElement;
                Assert.AreEqual(parsedJson.GetProperty("extra").GetString(), rawData["extra"].ToObjectFromJson<string>());
            }
        }

        protected override async Task TestBinaryContentCast(ModelWithRequiredNullableProperties model, ModelReaderWriterOptions options)
        {
            using BinaryContent binaryContent = model;

            Assert.IsNotNull(binaryContent);

            using MemoryStream stream = new MemoryStream();
            await binaryContent.WriteToAsync(stream, CancellationToken.None);
            BinaryData serializedContent = ((IPersistableModel<object>)model).Write(options);

            Assert.AreEqual(serializedContent.ToArray(), stream.ToArray());
        }

        protected override void TestClientResultCast(string serializedResponse)
        {
            var responseWithBody = new MockPipelineResponse(200);
            responseWithBody.SetContent(serializedResponse);
            ClientResult result = ClientResult.FromResponse(responseWithBody);

            ModelWithRequiredNullableProperties model = (ModelWithRequiredNullableProperties)result;
            var parsedWireJson = JsonDocument.Parse(serializedResponse).RootElement;

            Assert.IsNotNull(model);
            Assert.AreEqual(parsedWireJson.GetProperty("requiredNullablePrimitive").GetInt32(), model.RequiredNullablePrimitive);
            var requiredExtensibleEnumValue = parsedWireJson.GetProperty("requiredExtensibleEnum").GetString();
            Assert.AreEqual(new StringExtensibleEnum(requiredExtensibleEnumValue), model.RequiredExtensibleEnum);
            Assert.AreEqual(StringFixedEnum.One, model.RequiredFixedEnum);
        }
    }
}
