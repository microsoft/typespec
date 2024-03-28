// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Xml;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure.Core;
using media_types_LowLevel;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class MediaTypesTests : TestServerLowLevelTestBase
    {
        [Test]
        public Task MediaTypeJson() => Test(async (host) =>
        {
            var value = new
            {
                source = "anything"
            };
            var response = await new MediaTypesClient(host, Key, null).AnalyzeBodyAsync(RequestContent.Create(value), ContentType.ApplicationJson, new());
            Assert.AreEqual("Nice job with JSON", response.Content.ToObjectFromJson<string>());
        });

        [Test]
        public Task MediaTypePdf() => Test(async (host) =>
        {
            await using var value = new MemoryStream(Encoding.UTF8.GetBytes("PDF"));
            var response = await new MediaTypesClient(host, Key, null).AnalyzeBodyAsync(RequestContent.Create(value), new ContentType("application/pdf"), new());
            Assert.AreEqual("Nice job with PDF", response.Content.ToObjectFromJson<string>());
            JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
        });

        [Ignore("TODO: need to test octet-stream")]
        [Test]
        public Task MediaTypeOctetStream() => Test(async (host) =>
        {
            await using var value = new MemoryStream(Encoding.UTF8.GetBytes("PDF"));
            var response = await new MediaTypesClient(host, Key, null).AnalyzeBodyAsync(RequestContent.Create(value), ContentType.ApplicationOctetStream, new());
            JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
        });
    }
}
