// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading.Tasks;
using Azure;
using Azure.Core;
using AutoRest.TestServer.Tests.Infrastructure;
using dpg_initial_LowLevel;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class DpgInitialTest : TestServerLowLevelTestBase
    {
        [Test]
        [Description("Test for v1 client HEAD request that initially has no query parameters")]
        public Task DpgAddOptionalInput_NoParams_V1() => Test(async (host) => await DpgAddOptionalInput_NoParams(host));

        internal virtual async Task DpgAddOptionalInput_NoParams(Uri host)
        {
            var result = await new ParamsClient(host, Key, null).HeadNoParamsAsync(new());
            Assert.IsEmpty(result.Content.ToArray());
            Assert.AreEqual(200, result.Status);
            Assert.AreEqual(123, result.Headers.ContentLength);

            var result2 = await new ParamsClient(host, Key, null).HeadNoParamsAsync(new Azure.RequestContext());
            Assert.IsEmpty(result2.Content.ToArray());
            Assert.AreEqual(200, result2.Status);
            Assert.AreEqual(123, result2.Headers.ContentLength);

            var result3 = await new ParamsClient(host, Key, null).HeadNoParamsAsync(default);
            Assert.IsEmpty(result3.Content.ToArray());
            Assert.AreEqual(200, result3.Status);
            Assert.AreEqual(123, result3.Headers.ContentLength);
        }

        [Test]
        [Description("Test for v1 client GET request that initially has one required query parameter")]
        public Task DpgAddOptionalInput_V1() => Test(async (host) => await DpgAddOptionalInput(host));

        internal virtual async Task DpgAddOptionalInput(Uri host)
        {
            var result = await new ParamsClient(host, Key, null).GetRequiredAsync("param", new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody["message"]);

            var result2 = await new ParamsClient(host, Key, null).GetRequiredAsync("param", default);
            var responseBody2 = JsonData.FromBytes(result2.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody2["message"]);

            var result3 = await new ParamsClient(host, Key, null).GetRequiredAsync("param", context: ErrorOptions.NoThrow);
            var responseBody3 = JsonData.FromBytes(result3.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody3["message"]);
        }

        [Test]
        [Description("Test for v1 client PUT request that initially has one required query parameter and one optional parameter")]
        public Task DpgAddOptionalInput_RequiredOptionalParam_V1() => Test(async (host) => await DpgAddOptionalInput_RequiredOptionalParam(host));

        internal virtual async Task DpgAddOptionalInput_RequiredOptionalParam(Uri host)
        {
            var result = await new ParamsClient(host, Key, null).PutRequiredOptionalAsync("requiredParam", null, new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody["message"]);

            var result2 = await new ParamsClient(host, Key, null).PutRequiredOptionalAsync("requiredParam", "optionalParam", new());
            var responseBody2 = JsonData.FromBytes(result2.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody2["message"]);

            var result3 = await new ParamsClient(host, Key, null).PutRequiredOptionalAsync("requiredParam", "optionalParam", ErrorOptions.NoThrow);
            var responseBody3 = JsonData.FromBytes(result3.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody3["message"]);

            var result4 = await new ParamsClient(host, Key, null).PutRequiredOptionalAsync("requiredParam", null, context: new Azure.RequestContext());
            var responseBody4 = JsonData.FromBytes(result4.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody4["message"]);
            Assert.ThrowsAsync<ArgumentNullException>(async () => await new ParamsClient(host, Key, null).PutRequiredOptionalAsync(null, null, new()));
        }

        [Test]
        [Description("Test for v1 client GET request that initially has one optional query parameter")]
        public Task DpgAddOptionalInput_OptionalParam_V1() => Test(async (host) => await DpgAddOptionalInput_OptionalParam(host));

        internal virtual async Task DpgAddOptionalInput_OptionalParam(Uri host)
        {
            var result = await new ParamsClient(host, Key, null).GetOptionalAsync(null, new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody["message"]);

            var result2 = await new ParamsClient(host, Key, null).GetOptionalAsync("optionalParam", new());
            var responseBody2 = JsonData.FromBytes(result2.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody2["message"]);

            var result3 = await new ParamsClient(host, Key, null).GetOptionalAsync("optionalParam", default);
            var responseBody3 = JsonData.FromBytes(result3.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody3["message"]);

            var result4 = await new ParamsClient(host, Key, null).GetOptionalAsync(null, context: new Azure.RequestContext());
            var responseBody4 = JsonData.FromBytes(result4.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody4["message"]);
        }

        [Test]
        [Description("Test for v1 client POST request that initially has one application/json content type")]
        public Task DpgNewBodyType_V1() => Test(async (host) => await DpgNewBodyType(host));

        internal virtual async Task DpgNewBodyType(Uri host)
        {
            var value = new
            {
                url = "http://example.org/myimage.jpeg"
            };
            var result = await new ParamsClient(host, Key, null).PostParametersAsync(RequestContent.Create(value));
            Assert.AreEqual(200, result.Status);

            var result2 = await new ParamsClient(host, Key, null).PostParametersAsync(RequestContent.Create(value), default);
            Assert.AreEqual(200, result2.Status);

            var result3 = await new ParamsClient(host, Key, null).PostParametersAsync(RequestContent.Create(value), context: ErrorOptions.Default);
            Assert.AreEqual(200, result3.Status);
        }
    }
}
