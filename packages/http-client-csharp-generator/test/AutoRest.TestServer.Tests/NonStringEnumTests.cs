// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using non_string_enum;
using non_string_enum.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class NonStringEnumTests : TestServerTestBase
    {
        [Test]
        public Task NonStringEnumsGetFloat() => TestStatus(async (host, pipeline) =>
        {
            var response = await new FloatClient(ClientDiagnostics, pipeline, host).GetAsync();
            Assert.AreEqual(response.Value, FloatEnum.FourHundredTwentyNine1);
            return response.GetRawResponse();
        });

        [Test]
        public Task NonStringEnumsGetInt() => TestStatus(async (host, pipeline) =>
        {
            var response = await new IntClient(ClientDiagnostics, pipeline, host).GetAsync();
            Assert.AreEqual(response.Value, IntEnum.FourHundredTwentyNine);
            return response.GetRawResponse();
        });

        [Test]
        public Task NonStringEnumsPostInt() => TestStatus(async (host, pipeline) =>
        {
            var response = await new IntClient(ClientDiagnostics, pipeline, host).PutAsync(IntEnum.TwoHundred);
            Assert.AreEqual("Nice job posting an int enum", response.Value);
            return response.GetRawResponse();
        });

        [Test]
        public Task NonStringEnumsPostFloat() => TestStatus(async (host, pipeline) =>
        {
            var response = await new FloatClient(ClientDiagnostics, pipeline, host).PutAsync(FloatEnum.TwoHundred4);
            Assert.AreEqual("Nice job posting a float enum", response.Value);
            return response.GetRawResponse();
        });
    }
}
