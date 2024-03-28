// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using body_string;
using body_string.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class BodyStringTest : TestServerTestBase
    {
        [Test]
        public Task GetStringMultiByteCharacters() => Test(async (host, pipeline) =>
        {
            var result = await new StringClient(ClientDiagnostics, pipeline, host).GetMbcsAsync();
            Assert.AreEqual("啊齄丂狛狜隣郎隣兀﨩ˊ〞〡￤℡㈱‐ー﹡﹢﹫、〓ⅰⅹ⒈€㈠㈩ⅠⅫ！￣ぁんァヶΑ︴АЯаяāɡㄅㄩ─╋︵﹄︻︱︳︴ⅰⅹɑɡ〇〾⿻⺁䜣€", result.Value);
        });

        [Test]
        public Task GetStringNotProvided() => Test((host, pipeline) =>
        {
            // Empty response body
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new StringClient(ClientDiagnostics, pipeline, host).GetNotProvidedAsync());
        });

        [Test]
        public Task GetStringNullBase64UrlEncoding() => Test((host, pipeline) =>
        {
            // Empty response body
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new StringClient(ClientDiagnostics, pipeline, host).GetNullBase64UrlEncodedAsync());
        });

        [Test]
        public Task GetStringBase64Encoded() => Test(async (host, pipeline) =>
        {
            var result = await new StringClient(ClientDiagnostics, pipeline, host).GetBase64EncodedAsync();
            Assert.AreEqual(new byte[] { 97, 32, 115, 116, 114, 105, 110, 103, 32, 116, 104, 97, 116, 32, 103, 101, 116, 115, 32, 101, 110, 99, 111, 100, 101, 100, 32, 119, 105, 116, 104, 32, 98, 97, 115, 101, 54, 52}, result.Value);
        });

        [Test]
        public Task GetStringBase64UrlEncoded() => Test(async (host, pipeline) =>
        {
            var result = await new StringClient(ClientDiagnostics, pipeline, host).GetBase64UrlEncodedAsync();
            Assert.AreEqual(new byte[] { 97, 32, 115, 116, 114, 105, 110, 103, 32, 116, 104, 97, 116, 32, 103, 101, 116, 115, 32, 101, 110, 99, 111, 100, 101, 100, 32, 119, 105, 116, 104, 32, 98, 97, 115, 101, 54, 52, 117, 114, 108 }, result.Value);
        });

        [Test]
        public Task PutStringBase64UrlEncoded() => TestStatus(async (host, pipeline) =>
            await new StringClient(ClientDiagnostics, pipeline, host).PutBase64UrlEncodedAsync( new byte[] { 97, 32, 115, 116, 114, 105, 110, 103, 32, 116, 104, 97, 116, 32, 103, 101, 116, 115, 32, 101, 110, 99, 111, 100, 101, 100, 32, 119, 105, 116, 104, 32, 98, 97, 115, 101, 54, 52, 117, 114, 108 }));

        [Test]
        public Task PutStringMultiByteCharacters() => Test(async (host, pipeline) =>
        {
            var result = await new StringClient(ClientDiagnostics, pipeline, host).PutMbcsAsync();
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task GetStringNull() => Test((host, pipeline) =>
        {
            // Empty response body
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new StringClient(ClientDiagnostics, pipeline, host).GetNullAsync());
        });

        [Test]
        public Task GetStringEmpty() => Test(async (host, pipeline) =>
        {
            var result = await new StringClient(ClientDiagnostics, pipeline, host).GetEmptyAsync();
            Assert.AreEqual("", result.Value);
        });

        [Test]
        public Task PutStringEmpty() => Test(async (host, pipeline) =>
        {
            var result = await new StringClient(ClientDiagnostics, pipeline, host).PutEmptyAsync();
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task PutStringNull() => Test(async (host, pipeline) =>
        {
            var result = await new StringClient(ClientDiagnostics, pipeline, host).PutNullAsync(null);
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task GetStringWithLeadingAndTrailingWhitespace() => Test(async (host, pipeline) =>
        {
            var result = await new StringClient(ClientDiagnostics, pipeline, host).GetWhitespaceAsync();
            Assert.AreEqual("    Now is the time for all good men to come to the aid of their country    ", result.Value);
        });

        [Test]
        public Task PutStringWithLeadingAndTrailingWhitespace() => Test(async (host, pipeline) =>
        {
            var result = await new StringClient(ClientDiagnostics, pipeline, host).PutWhitespaceAsync();
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task GetEnumReferenced() => Test(async (host, pipeline) =>
        {
            var result = await new EnumClient(ClientDiagnostics, pipeline, host).GetReferencedAsync();
            Assert.AreEqual(Colors.RedColor, result.Value);
        });

        [Test]
        public Task GetEnumReferencedConstant() => Test(async (host, pipeline) =>
        {
            var result = await new EnumClient(ClientDiagnostics, pipeline, host).GetReferencedConstantAsync();
            Assert.AreEqual("Sample String", result.Value.Field1);
        });

        [Test]
        public Task GetEnumNotExpandable() => Test(async (host, pipeline) =>
        {
            var result = await new EnumClient(ClientDiagnostics, pipeline, host).GetNotExpandableAsync();
            Assert.AreEqual(Colors.RedColor, result.Value);
        });

        [Test]
        public Task PutEnumReferenced() => TestStatus(async (host, pipeline) =>
            await new EnumClient(ClientDiagnostics, pipeline, host).PutReferencedAsync( Colors.RedColor));

        [Test]
        public Task PutEnumReferencedConstant() => TestStatus(async (host, pipeline) =>
            await new EnumClient(ClientDiagnostics, pipeline, host).PutReferencedConstantAsync( new RefColorConstant()));

        [Test]
        public Task PutEnumNotExpandable() => TestStatus(async (host, pipeline) =>
            await new EnumClient(ClientDiagnostics, pipeline, host).PutNotExpandableAsync( Colors.RedColor));

        [Test]
        public void NonRequiredParameterHasDefaultValue()
        {
            var method = TypeAsserts.HasPublicInstanceMethod(typeof(StringClient), "PutNull");

            var parameter = method.GetParameters().Single(p => p.Name == "stringBody");
            Assert.True(parameter.HasDefaultValue);
        }

        [Test]
        public async Task DoesntSendContentHeadersWhenNoBody()
        {
            List<string> contentTypes = new List<string>();
            using var testServer = new InProcTestServer(async content =>
            {
                contentTypes.Add(content.Request.ContentType);
                await content.Response.Body.FlushAsync();
            });

            var client = new StringClient(ClientDiagnostics, InProcTestBase.HttpPipeline, testServer.Address);
            await client.PutNullAsync(null);
            await client.PutNullAsync("notNull");

            Assert.AreEqual(null, contentTypes[0]);
            Assert.AreEqual("application/json", contentTypes[1]);
        }
    }
}
