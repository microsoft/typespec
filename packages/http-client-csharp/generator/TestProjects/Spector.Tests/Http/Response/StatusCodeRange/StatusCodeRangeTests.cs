// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;
using NUnit.Framework;
using Response.StatusCodeRange;

namespace TestProjects.Spector.Tests.Http.Response.StatusCodeRange
{
    public class StatusCodeRangeTests : SpectorTestBase
    {
        [SpectorTest]
        public Task StatusCodeNotFound() => Test((host) =>
        {
            var options = new StatusCodeRangeClientOptions();
            var client = new StatusCodeRangeClient(host, options);
            var ex = Assert.ThrowsAsync<ClientResultException>(async() => await client.ErrorResponseStatusCode404Async());
            var error = ModelReaderWriter.Read<NotFoundError>(ex!.GetRawResponse()!.Content);
            Assert.IsNotNull(error);
            Assert.AreEqual("not-found", error!.Code);
            Assert.AreEqual("resource1", error.ResourceId);

            return Task.CompletedTask;
        });

        [SpectorTest]
        public Task StatusCodeInRange() => Test((host) =>
        {
            var options = new StatusCodeRangeClientOptions();
            var client = new StatusCodeRangeClient(host, options);
            var ex = Assert.ThrowsAsync<ClientResultException>(async() => await client.ErrorResponseStatusCodeInRangeAsync());
            var error = ModelReaderWriter.Read<ErrorInRange>(ex!.GetRawResponse()!.Content);
            Assert.IsNotNull(error);
            Assert.AreEqual("request-header-too-large", error!.Code);
            Assert.AreEqual("Request header too large", error.Message);

            return Task.CompletedTask;
        });
    }
}
