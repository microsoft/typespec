// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.TestServer.Tests;
using System.Text;
using NUnit.Framework;
using MgmtPagination;
using Microsoft.Extensions.Primitives;
using System.Threading.Tasks;
using System;

namespace AutoRest.CSharp.Output.Models.Requests.Tests
{
    public class PageSizeTests : InProcTestBase
    {
        private InProcTestServer testServer = new InProcTestServer(async content =>
        {
            StringValues pageSize;
            Assert.True(content.Request.Query.TryGetValue("maxpagesize", out pageSize));
            Assert.That(pageSize, Has.Count.EqualTo(1));
            Assert.AreEqual("123", pageSize);
            await content.Response.Body.WriteAsync(Encoding.UTF8.GetBytes("{\"value\":[]}"));
        });

        [Test]
        public async Task ValidateInteger() => await new PageSizeIntegerModelsRestOperations(HttpPipeline, "testAppId", testServer.Address).ListAsync("test", "test", 123);

        [Test]
        public async Task ValidateInt64() => await new PageSizeInt64ModelsRestOperations(HttpPipeline, "testAppId", testServer.Address).ListAsync("test", "test", 123);

        [Test]
        public async Task ValidateInt32() => await new PageSizeInt32ModelsRestOperations(HttpPipeline, "testAppId", testServer.Address).ListAsync("test", "test", 123);

        [Test]
        public async Task ValidateNumeric() => await new PageSizeNumericModelsRestOperations(HttpPipeline, "testAppId", testServer.Address).ListAsync("test", "test", 123);

        [Test]
        public async Task ValidateFloat() => await new PageSizeFloatModelsRestOperations(HttpPipeline, "testAppId", testServer.Address).ListAsync("test", "test", 123);

        [Test]
        public async Task ValidateDouble() => await new PageSizeDoubleModelsRestOperations(HttpPipeline, "testAppId", testServer.Address).ListAsync("test", "test", 123);

        [Test]
        public async Task ValidateDecimal() => await new PageSizeDecimalModelsRestOperations(HttpPipeline, "testAppId", testServer.Address).ListAsync("test", "test", 123);

        [Test]
        public async Task ValidateString() => await new PageSizeStringModelsRestOperations(HttpPipeline, "testAppId", testServer.Address).ListAsync("test", "test", Convert.ToString(123));
    }
}
