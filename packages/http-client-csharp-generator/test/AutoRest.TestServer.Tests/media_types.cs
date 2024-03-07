// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Xml;
using AutoRest.TestServer.Tests.Infrastructure;
using media_types;
using media_types.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class MediaTypesTests : TestServerTestBase
    {
        [Test]
        public Task MediaTypeJson() => Test(async (host, pipeline) =>
        {
            var value = new SourcePath
            {
                Source = "anything"
            };
            var response = await new MediaTypesClient(ClientDiagnostics, pipeline, host).AnalyzeBodyAsync(value);
            Assert.AreEqual("Nice job with JSON", response.Value);
        });

        [Test]
        public Task MediaTypePdf() => Test(async (host, pipeline) =>
        {
            await using var value = new MemoryStream(Encoding.UTF8.GetBytes("PDF"));
            var response = await new MediaTypesClient(ClientDiagnostics, pipeline, host).AnalyzeBodyAsync(ContentType.ApplicationPdf, value);
            Assert.AreEqual("Nice job with PDF", response.Value);
        });

        [Test]
        [Ignore("https://github.com/Azure/autorest.csharp/issues/751")]
        public Task MediaTypeWithEncoding() => Test(async (host, pipeline) =>
        {
            var response = await new MediaTypesClient(ClientDiagnostics, pipeline, host).ContentTypeWithEncodingAsync("input");
            Assert.AreEqual("Nice job sending content type with encoding", response.Value);
        });
    }
}
