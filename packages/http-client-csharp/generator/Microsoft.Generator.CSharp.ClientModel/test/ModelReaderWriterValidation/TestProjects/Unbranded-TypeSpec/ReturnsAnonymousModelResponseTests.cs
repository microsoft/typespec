// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System;
using System.ClientModel.Primitives;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using UnbrandedTypeSpec.Models;
using System.Text.Json;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.ModelReaderWriterValidation
{
    internal class ReturnsAnonymousModelResponseTests : ModelJsonTests<ReturnsAnonymousModelResponse>
    {
        protected override string JsonPayload => File.ReadAllText(TestData.GetLocation("Unbranded-TypeSpec/TestData/ReturnsAnonymousModelResp/Model.json"));
        protected override string WirePayload => "{}";

        protected override void CompareModels(ReturnsAnonymousModelResponse model, ReturnsAnonymousModelResponse model2, string format)
        {
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

        protected override void VerifyModel(ReturnsAnonymousModelResponse model, string format)
        {
            var rawData = GetRawData(model);
            Assert.IsNotNull(rawData);
            if (format == "J")
            {
                Assert.AreEqual("stuff", rawData["extra"].ToObjectFromJson<string>());
            }
        }

        protected override async Task TestBinaryContentCast(ReturnsAnonymousModelResponse model, ModelReaderWriterOptions options)
        {
            using BinaryContent binaryContent = model;

            Assert.IsNotNull(binaryContent);

            using MemoryStream stream = new MemoryStream();
            await binaryContent.WriteToAsync(stream, CancellationToken.None);
            BinaryData serializedContent = ((IPersistableModel<object>)model).Write(options);

            Assert.AreEqual(serializedContent.ToArray(), stream.ToArray());
        }

        public override void TestClientResultCast(string serializedResponse)
        {
            var responseWithBody = new MockPipelineResponse(200);
            responseWithBody.SetContent(serializedResponse);
            ClientResult result = ClientResult.FromResponse(responseWithBody);

            ReturnsAnonymousModelResponse model = (ReturnsAnonymousModelResponse)result;

            Assert.IsNotNull(model);
        }
    }
}
