// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using object_type;

namespace AutoRest.TestServer.Tests
{
    public class ObjectTypeTest : TestServerTestBase
    {
        [Test]
        public Task ObjectTypeErrorResponse() => Test((host, pipeline) =>
        {
            var value = "anything goes here";
            var content = "{ \"message\": \"The object you passed was incorrect\" }";
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new ObjectTypeClient(ClientDiagnostics, pipeline, host).RestClient.PutAsync(value));
            Assert.AreEqual(400, exception.Status);
            Assert.IsTrue(exception.Message.Contains(content));
        });

        [Test]
        public Task ObjectTypePut() => TestStatus(async (host, pipeline) =>
        {
            var value = new Dictionary<string, object> { { "foo", "bar" } };
            return await new ObjectTypeClient(ClientDiagnostics, pipeline, host).RestClient.PutAsync(value);
        });

        [Test]
        public Task ObjectTypeResponse() => Test(async (host, pipeline) =>
        {
            var result = await new ObjectTypeClient(ClientDiagnostics, pipeline, host).RestClient.GetAsync();
            var dictionary = result.Value as Dictionary<string, object>;
            Assert.IsNotNull(dictionary);
            Assert.IsTrue(dictionary.ContainsKey("message"));
            Assert.AreEqual("An object was successfully returned", dictionary["message"].ToString());
        });
    }
}
