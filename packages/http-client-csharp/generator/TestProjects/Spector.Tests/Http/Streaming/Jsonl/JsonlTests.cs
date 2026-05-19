// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading.Tasks;
using NUnit.Framework;
using Streaming.Jsonl;

namespace TestProjects.Spector.Tests.Http.Streaming.Jsonl
{
    public class JsonlTests : SpectorTestBase
    {
        private const string ExpectedJsonl = "{\"desc\": \"one\"}\n{\"desc\": \"two\"}\n{\"desc\": \"three\"}";

        [SpectorTest]
        public Task BasicSend() => Test(async (host) =>
        {
            var client = new JsonlClient(host, null).GetBasicClient();
            var stream = StreamingJsonlModelFactory.JsonlStreamInfo(BinaryData.FromString(ExpectedJsonl));
            var response = await client.SendAsync(stream);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task BasicReceive() => Test(async (host) =>
        {
            var client = new JsonlClient(host, null).GetBasicClient();
            var response = await client.ReceiveAsync();

            Assert.AreEqual(200, response.GetRawResponse().Status);
            BinaryDataAssert.AreEqual(BinaryData.FromString(ExpectedJsonl), response.Value);
        });
    }
}
