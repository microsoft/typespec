// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FlattenedParameters;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class FlatArray : InProcTestBase
    {
        private async Task<JsonDocument> TestCore(Func<FlattenedParametersClient, Task> testProc)
        {
            var requestMemoryStream = new MemoryStream();
            using var testServer = new InProcTestServer(async content =>
            {
                await content.Request.Body.CopyToAsync(requestMemoryStream);
            });

            var client = new FlattenedParametersClient(ClientDiagnostics, HttpPipeline, testServer.Address);

            await testProc(client);

            return JsonDocument.Parse(Encoding.UTF8.GetString(requestMemoryStream.ToArray()));
        }

        [Test]
        public async Task FlatArray_NullSerialized()
        {
            var doc = await TestCore(async c => await c.OperationAsync());
            JsonElement items = doc.RootElement.GetProperty("items");
            Assert.NotNull(items);
            Assert.AreEqual(JsonValueKind.Null, items.ValueKind);
        }

        [Test]
        public async Task FlatArray_EmptySerialized()
        {
            var doc = await TestCore(async c => await c.OperationAsync(Enumerable.Empty<string>()));
            JsonElement items = doc.RootElement.GetProperty("items");
            Assert.NotNull(items);
            Assert.AreEqual(0, items.GetArrayLength());
        }

        [Test]
        public async Task FlatArray_NullSerializedNotNullable()
        {
            var doc = await TestCore(async c => await c.OperationNotNullAsync());
            Assert.IsFalse(doc.RootElement.TryGetProperty("items", out JsonElement value));
        }

        [Test]
        public async Task FlatArray_EmptySerializedNotNullable()
        {
            var doc = await TestCore(async c => await c.OperationNotNullAsync(Enumerable.Empty<string>()));
            Assert.IsFalse(doc.RootElement.TryGetProperty("items", out JsonElement value));
        }
    }
}
