// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Threading.Tasks;
using NUnit.Framework;
using Specs.Azure.ClientGenerator.Core.ResponseReplacement;

namespace TestProjects.Spector.Tests.Http.Azure.ClientGeneratorCore.ResponseReplacement
{
    public class ResponseReplacementTests : SpectorTestBase
    {
        [SpectorTest]
        public Task VoidResponse() => Test(host =>
        {
            ClientResult response = new ResponseReplacementClient(host, null).VoidResponse();
            Assert.AreEqual(typeof(ClientResult), response.GetType());
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("{\"name\":\"widget\"}", response.GetRawResponse().Content.ToString());
            return Task.CompletedTask;
        });

        [SpectorTest]
        public Task VoidResponseAsync() => Test(async host =>
        {
            ClientResult response = await new ResponseReplacementClient(host, null).VoidResponseAsync();
            Assert.AreEqual(typeof(ClientResult), response.GetType());
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("{\"name\":\"widget\"}", response.GetRawResponse().Content.ToString());
        });

        [SpectorTest]
        public Task BytesResponse() => Test(host =>
        {
            ClientResult<BinaryData> response = new ResponseReplacementClient(host, null).BytesResponse();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("{\"name\":\"widget\"}", response.Value.ToString());
            CollectionAssert.AreEqual(response.GetRawResponse().Content.ToArray(), response.Value.ToArray());
            return Task.CompletedTask;
        });

        [SpectorTest]
        public Task BytesResponseAsync() => Test(async host =>
        {
            ClientResult<BinaryData> response = await new ResponseReplacementClient(host, null).BytesResponseAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("{\"name\":\"widget\"}", response.Value.ToString());
            CollectionAssert.AreEqual(response.GetRawResponse().Content.ToArray(), response.Value.ToArray());
        });
    }
}
