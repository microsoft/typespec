// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Azure.Core;
using AutoRest.TestServer.Tests.Infrastructure;
using dpg_update1_LowLevel;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class DpgUpdate1Test : DpgInitialTest
    {
        [Test]
        [Description("Test for v2 client HEAD request that adds an optional query parameter from v1 which has no query parameters")]
        public Task DpgAddOptionalInput_NoParams_V2() => Test(async (host) => await DpgAddOptionalInput_NoParams(host));

        internal override async Task DpgAddOptionalInput_NoParams(Uri host)
        {
            // compatible with dpg_initial
            await base.DpgAddOptionalInput_NoParams(host);

            // test new cases in dpg_update1
            var result3 = await new ParamsClient(host, Key, null).HeadNoParamsAsync("newParam", new());
            Assert.IsEmpty(result3.Content.ToArray());
            Assert.AreEqual(200, result3.Status);
            Assert.AreEqual(123, result3.Headers.ContentLength);

            var result4 = await new ParamsClient(host, Key, null).HeadNoParamsAsync("newParam", new Azure.RequestContext());
            Assert.IsEmpty(result4.Content.ToArray());
            Assert.AreEqual(200, result4.Status);
            Assert.AreEqual(123, result4.Headers.ContentLength);
        }

        [Test]
        [Description("Test for v2 client GET request that adds an optional query parameter from v1 which has one required query parameter")]
        public Task DpgAddOptionalInput_V2() => Test(async (host) => await DpgAddOptionalInput(host));

        internal override async Task DpgAddOptionalInput(Uri host)
        {
            // compatible with dpg_initial
            await base.DpgAddOptionalInput(host);

            // test new cases in dpg_update1
            var result4 = await new ParamsClient(host, Key, null).GetRequiredAsync("param", "newParam", new());
            var responseBody4 = JsonData.FromBytes(result4.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody4["message"]);

            var result5 = await new ParamsClient(host, Key, null).GetRequiredAsync("param", "newParam", default);
            var responseBody5 = JsonData.FromBytes(result5.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody5["message"]);

            var result6 = await new ParamsClient(host, Key, null).GetRequiredAsync("param", context: default, newParameter: "newParam");
            var responseBody6 = JsonData.FromBytes(result6.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody6["message"]);
        }

        [Test]
        [Description("Test for v2 client PUT request that adds an optional query parameter from v1 which has one required query parameter and one optional parameter")]
        public Task DpgAddOptionalInput_RequiredOptionalParam_V2() => Test(async (host) => await DpgAddOptionalInput_RequiredOptionalParam(host));

        internal override async Task DpgAddOptionalInput_RequiredOptionalParam(Uri host)
        {
            // compatible with dpg_initial
            await base.DpgAddOptionalInput_RequiredOptionalParam(host);

            // test new cases in dpg_update1
            var result5 = await new ParamsClient(host, Key, null).PutRequiredOptionalAsync("requiredParam", null, newParameter: "newParam", new());
            var responseBody5 = JsonData.FromBytes(result5.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody5["message"]);

            var result6 = await new ParamsClient(host, Key, null).PutRequiredOptionalAsync("requiredParam", "optionalParam", "newParam", new());
            var responseBody6 = JsonData.FromBytes(result6.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody6["message"]);

            var result7 = await new ParamsClient(host, Key, null).PutRequiredOptionalAsync("requiredParam", "optionalParam", "newParam", new Azure.RequestContext());
            var responseBody7 = JsonData.FromBytes(result7.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody7["message"]);

            var result8 = await new ParamsClient(host, Key, null).PutRequiredOptionalAsync("requiredParam", optionalParam: null, newParameter: "newParam", context: new Azure.RequestContext());
            var responseBody8 = JsonData.FromBytes(result8.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody8["message"]);
        }

        [Test]
        [Description("Test for v2 client GET request that adds an optional query parameter from v1 which has one optional query parameter")]
        public Task DpgAddOptionalInput_OptionalParam_V2() => Test(async (host) => await DpgAddOptionalInput_OptionalParam(host));

        internal override async Task DpgAddOptionalInput_OptionalParam(Uri host)
        {
            // compatible with dpg_initial
            await base.DpgAddOptionalInput_OptionalParam(host);

            // test new cases in dpg_update1
            var result5 = await new ParamsClient(host, Key, null).GetOptionalAsync(optionalParam: null, newParameter: "newParam", new());
            var responseBody5 = JsonData.FromBytes(result5.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody5["message"]);

            var result6 = await new ParamsClient(host, Key, null).GetOptionalAsync("optionalParam", "newParam", new());
            var responseBody6 = JsonData.FromBytes(result6.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody6["message"]);

            var result7 = await new ParamsClient(host, Key, null).GetOptionalAsync("optionalParam", "newParam", new Azure.RequestContext());
            var responseBody7 = JsonData.FromBytes(result7.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody7["message"]);

            var result8 = await new ParamsClient(host, Key, null).GetOptionalAsync(optionalParam: null, newParameter: "newParam", context: new Azure.RequestContext());
            var responseBody8 = JsonData.FromBytes(result8.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody8["message"]);
        }

        [Test]
        [Description("Test for v2 client POST request that supports the application/json content type existing since v1 and the image/jpeg content type added newly")]
        public Task DpgNewBodyType_V2() => Test(async (host) => await DpgNewBodyType(host));

        internal override async Task DpgNewBodyType(Uri host)
        {
            // compatible with dpg_initial
            await base.DpgNewBodyType(host);

            // test new cases in dpg_update1
            var value = new
            {
                url = "http://example.org/myimage.jpeg"
            };
            var result4 = await new ParamsClient(host, Key, null).PostParametersAsync(RequestContent.Create(value), ContentType.ApplicationJson);
            Assert.AreEqual(200, result4.Status);

            var result5 = await new ParamsClient(host, Key, null).PostParametersAsync(RequestContent.Create(value), ContentType.ApplicationJson, default);
            Assert.AreEqual(200, result5.Status);

            await using var jpegValue = new MemoryStream(Encoding.UTF8.GetBytes("JPEG"));
            var result6 = await new ParamsClient(host, Key, null).PostParametersAsync(RequestContent.Create(jpegValue), new ContentType("image/jpeg"));
            Assert.AreEqual(200, result6.Status);
        }

        [Test]
        [Description("Test for v2 client Delete request that is newly added in an existing path")]
        public Task DpgAddNewOperation_V2() => Test(async (host) =>
        {
            var result = await new ParamsClient(host, Key, null).DeleteParametersAsync();
            Assert.AreEqual(204, result.Status);
        });

        [Test]
        [Description("Test for v2 client GET request that is newly added in a new path")]
        public Task DpgAddNewPath_V2() => Test(async (host) =>
        {
            var result = await new ParamsClient(host, Key, null).GetNewOperationAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.AreEqual("An object was successfully returned", (string)responseBody["message"]);
        });
    }
}
