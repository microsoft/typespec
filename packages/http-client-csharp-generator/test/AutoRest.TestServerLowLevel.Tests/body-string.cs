// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Azure.Core;
using AutoRest.TestServer.Tests.Infrastructure;
using body_string_LowLevel;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class BodyStringTest : TestServerLowLevelTestBase
    {
        [Test]
        public Task GetStringMultiByteCharacters() => Test(async (host) =>
        {
            var result = await new StringClient(host, Key, null).GetMbcsAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());

            Assert.AreEqual("啊齄丂狛狜隣郎隣兀﨩ˊ〞〡￤℡㈱‐ー﹡﹢﹫、〓ⅰⅹ⒈€㈠㈩ⅠⅫ！￣ぁんァヶΑ︴АЯаяāɡㄅㄩ─╋︵﹄︻︱︳︴ⅰⅹɑɡ〇〾⿻⺁䜣€", (string)responseBody);
        });

        [Test]
        public Task GetStringNotProvided() => Test(async (host) =>
        {
            // Empty response body
            var result = await new StringClient(host, Key, null).GetNotProvidedAsync(new());
            Assert.Zero (result.Content.ToMemory().Length);
        });

        [Test]
        public Task GetStringBase64Encoded() => Test(async (host) =>
        {
            var result = await new StringClient(host, Key, null).GetBase64EncodedAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            var data = Convert.FromBase64String(responseBody.ToString());
            Assert.AreEqual(new byte[] { 97, 32, 115, 116, 114, 105, 110, 103, 32, 116, 104, 97, 116, 32, 103, 101, 116, 115, 32, 101, 110, 99, 111, 100, 101, 100, 32, 119, 105, 116, 104, 32, 98, 97, 115, 101, 54, 52}, data);
        });

        // LLC - BUG - This should not take a JsonData, it should have a fixed constant like HLC
        //[Test]
        public Task PutStringMultiByteCharacters() => Test(async (host) =>
        {
            var result = await new StringClient(host, Key, null).PutMbcsAsync(RequestContent.Create(new JsonData("")));
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task GetStringNull() => Test(async (host) =>
        {
            // Empty response body
            var result = await new StringClient(host, Key, null).GetNullAsync(new());
            Assert.Zero (result.Content.ToMemory().Length);
        });

        [Test]
        public Task GetStringEmpty() => Test(async (host) =>
        {
            var result = await new StringClient(host, Key, null).GetEmptyAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());

            Assert.AreEqual("", (string)responseBody);
        });

        // LLC - BUG - This should not take a JsonData
        [Test]
        public Task PutStringEmpty() => Test(async (host) =>
        {
            var result = await new StringClient(host, Key, null).PutEmptyAsync(RequestContent.Create(new JsonData("")));
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task PutStringNull() => Test(async (host) =>
        {
            var result = await new StringClient(host, Key, null).PutNullAsync(null, new());
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task GetStringWithLeadingAndTrailingWhitespace() => Test(async (host) =>
        {
            var result = await new StringClient(host, Key, null).GetWhitespaceAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());

            Assert.AreEqual("    Now is the time for all good men to come to the aid of their country    ", (string)responseBody);
        });

        // LLC - BUG - This should not take a JsonData, it should have a fixed constant like HLC
        //[Test]
        public Task PutStringWithLeadingAndTrailingWhitespace() => Test(async (host) =>
        {
            var result = await new StringClient(host, Key, null).PutWhitespaceAsync(RequestContent.Create(new JsonData("")));
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task GetEnumReferenced() => Test(async (host) =>
        {
            var result = await new EnumClient(host, Key, null).GetReferencedAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());

            Assert.AreEqual("red color", (string)responseBody);
        });

        [Test]
        public Task GetEnumReferencedConstant() => Test(async (host) =>
        {
            var result = await new EnumClient(host, Key, null).GetReferencedConstantAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());

            Assert.AreEqual("Sample String", (string)responseBody["field1"]);
        });

        [Test]
        public Task GetEnumNotExpandable() => Test(async (host) =>
        {
            var result = await new EnumClient(host, Key, null).GetNotExpandableAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());

            Assert.AreEqual("red color", (string)responseBody);
        });

        [Test]
        public Task PutEnumReferenced() => TestStatus(async (host) =>
            await new EnumClient(host, Key, null).PutReferencedAsync(RequestContent.Create ("\"red color\"")));

        [Test]
        public Task PutEnumNotExpandable() => TestStatus(async (host) =>
            await new EnumClient(host, Key, null).PutNotExpandableAsync(RequestContent.Create ("\"red color\"")));
    }
}
