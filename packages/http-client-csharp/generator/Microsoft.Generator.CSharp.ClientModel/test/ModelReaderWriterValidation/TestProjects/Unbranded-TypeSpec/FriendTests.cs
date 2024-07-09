// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.ClientModel;
using System;
using System.IO;
using System.Threading;
using NUnit.Framework;
using UnbrandedTypeSpec.Models;
using System.Threading.Tasks;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.ModelReaderWriterValidation
{
    internal class FriendTests : ModelJsonTests<Friend>
    {
        protected override string JsonPayload => File.ReadAllText(TestData.GetLocation("Unbranded-TypeSpec/TestData/Friend/Friend.json"));
        protected override string WirePayload => File.ReadAllText(TestData.GetLocation("Unbranded-TypeSpec/TestData/Friend/FriendWireFormat.json"));

        protected override void CompareModels(Friend model, Friend model2, string format)
        {
            Assert.AreEqual(model.Name, model2.Name);

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

        protected override void VerifyModel(Friend model, string format)
        {
            Assert.AreEqual("friendModel", model.Name);

            var rawData = GetRawData(model);
            Assert.IsNotNull(rawData);
            if (format == "J")
            {
                Assert.AreEqual("stuff", rawData["extra"].ToObjectFromJson<string>());
            }
        }

        protected override async Task TestBinaryContentCast(Friend model, ModelReaderWriterOptions options)
        {
            using BinaryContent binaryContent = model;

            Assert.IsNotNull(binaryContent);

            using MemoryStream stream = new();
            await binaryContent.WriteToAsync(stream, CancellationToken.None);
            BinaryData serializedContent = ((IPersistableModel<object>)model).Write(options);

            Assert.AreEqual(serializedContent.ToArray(), stream.ToArray());
        }

        protected override void TestClientResultCast(string serializedResponse)
        {
            var responseWithBody = new MockPipelineResponse(200);
            responseWithBody.SetContent(serializedResponse);
            ClientResult result = ClientResult.FromResponse(responseWithBody);

            Friend friend = (Friend)result;

            Assert.IsNotNull(friend);
            Assert.AreEqual("friendModel", friend.Name);
        }
    }
}
