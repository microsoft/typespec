// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using System.Xml;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure.Core;
using Azure.Core.Pipeline;
using body_complex_LowLevel;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class BodyComplexTest: TestServerLowLevelTestBase
    {
        [Test]
        public Task GetComplexBasicValid() => Test(async (host) =>
        {
            var result = await new BasicClient(host, Key, null).GetValidAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.AreEqual("abc", (string)responseBody["name"]);
            Assert.AreEqual(2, (int)responseBody["id"]);
            Assert.AreEqual("YELLOW", (string)responseBody["color"]);
        });

        [Test]
        public Task PutComplexBasicValid() => TestStatus(async (host) =>
        {
            var data = new JsonData(new Dictionary<string, object> {
                ["name"] = "abc",
                ["id"] = 2,
                ["color"] = "Magenta"
            });
            return await new BasicClient(host, Key, null).PutValidAsync(RequestContent.Create(data));
        });

        [Test]
        public Task GetComplexBasicEmpty() => Test(async (host) =>
        {
            var result = await new BasicClient(host,Key, null).GetEmptyAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.Zero (responseBody.Properties.Count());
        });

        [Test]
        public Task GetComplexBasicNotProvided() => Test(async (host) =>
        {
            var result = await new BasicClient(host, Key, null).GetNotProvidedAsync(new());
            Assert.Zero (result.Content.ToMemory().Length);
        });

        [Test]
        public Task GetComplexBasicNull() => Test(async (host) =>
        {
            var result = await new BasicClient(host, Key, null).GetNullAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.AreEqual(null, (string?)responseBody["name"]);
            Assert.AreEqual(null, (int?)responseBody["id"]);
        });

        [Test]
        public Task GetComplexBasicInvalid() => Test(async (host) =>
        {
            var result = await new BasicClient(host, Key, null).GetInvalidAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.AreEqual("abc", (string?)responseBody["name"]);
            Assert.AreEqual("a", (string?)responseBody["id"]);
        });

        [Test]
        public Task GetComplexPrimitiveInteger() => Test(async (host) =>
        {
            var result = await new PrimitiveClient(host, Key, null).GetIntAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.AreEqual(-1, (int)responseBody["field1"]);
            Assert.AreEqual(2, (int)responseBody["field2"]);
        });

        [Test]
        public Task PutComplexPrimitiveInteger() => TestStatus(async (host) =>
        {
            var data = new JsonData(new Dictionary<string, object> {
                ["field1"] = -1,
                ["field2"] = 2,
            });
            return await new PrimitiveClient(host, Key, null).PutIntAsync(RequestContent.Create(data));
        });

        [Test]
        public Task GetComplexPrimitiveLong() => Test(async (host) =>
        {
            var result = await new PrimitiveClient(host, Key, null).GetLongAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.AreEqual(1099511627775L, (long)responseBody["field1"]);
            Assert.AreEqual(-999511627788L, (long)responseBody["field2"]);
        });

        [Test]
        public Task PutComplexPrimitiveLong() => TestStatus(async (host) =>
        {
            var data = new JsonData(new Dictionary<string, object> {
                ["field1"] = 1099511627775L,
                ["field2"] = -999511627788L,
            });
            return await new PrimitiveClient(host, Key, null).PutLongAsync(RequestContent.Create(data));
        });

        [Test]
        public Task GetComplexArrayValid() => Test(async (host) =>
        {
            var result = await new ArrayClient(host, Key, null).GetValidAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            var array = responseBody["array"];
            Assert.AreEqual("1, 2, 3, 4", (string)array[0]);
            Assert.AreEqual("", (string)array[1]);
            Assert.AreEqual(null, (string)array[2]);
            Assert.AreEqual("&S#$(*Y", (string)array[3]);
            Assert.AreEqual("The quick brown fox jumps over the lazy dog", (string)array[4]);
        });

        [Test]
        public Task PutComplexArrayValid() => TestStatus(async (host) =>
        {
            var data = new JsonData(new Dictionary<string, string[]> {
                ["array"] = new string[] { "1, 2, 3, 4", "", (string)null, "&S#$(*Y","The quick brown fox jumps over the lazy dog"}
            });
            return await new ArrayClient(host, Key, null).PutValidAsync(RequestContent.Create(data));
        });

        [Test]
        public Task GetComplexDictionaryValid() => Test(async (host) =>
        {
            var result = await new DictionaryClient(host, Key, null).GetValidAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            var array = responseBody["defaultProgram"];

            Assert.AreEqual("notepad", (string)array["txt"]);
            Assert.AreEqual("mspaint", (string)array["bmp"]);
            Assert.AreEqual("excel", (string)array["xls"]);
            Assert.AreEqual("", (string)array["exe"]);
            Assert.AreEqual(null, (string)array[""]);
        });

        [Test]
        public Task PutComplexDictionaryValid() => TestStatus(async (host) =>
        {
            var data = new JsonData(
                new Dictionary<string, object> {
                    ["defaultProgram"] = new Dictionary<string, string?> {
                    { "txt", "notepad" },
                    { "bmp", "mspaint" },
                    { "xls", "excel" },
                    { "exe", string.Empty },
                    { string.Empty, null }
                }});
            return await new DictionaryClient(host, Key, null).PutValidAsync(RequestContent.Create(data));
        });
    }
}
