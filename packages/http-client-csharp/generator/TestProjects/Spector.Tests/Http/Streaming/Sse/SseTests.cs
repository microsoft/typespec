// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Net.ServerSentEvents;
using System.Text.Json;
using System.Threading.Tasks;
using NUnit.Framework;
using Streaming.Sse;
using Streaming.Sse._Retrieve;

namespace TestProjects.Spector.Tests.Http.Streaming.Sse
{
    public class SseTests : SpectorTestBase
    {
        [SpectorTest]
        public Task Unnamed() => Test(async (host) =>
        {
            var client = new SseClient(host, null).GetUnnamedClient();
            await using var response = await client.ReceiveAsync();
            var descriptions = new List<string>();
            await foreach (var item in response)
            {
                Assert.AreEqual("message", item.EventType);
                descriptions.Add(item.Data.Desc);
            }

            CollectionAssert.AreEqual(new[] { "one", "two", "three" }, descriptions);
        });

        [SpectorTest]
        public Task Named() => Test(async (host) =>
        {
            var client = new SseClient(host, null).GetNamedClient();
            await using var response = await client.ReceiveAsync();
            var events = new List<(string Type, string Value)>();
            await foreach (var item in response)
            {
                using var document = JsonDocument.Parse(item.Data.ToMemory());
                var value = item.EventType == "responseCreated"
                    ? document.RootElement.GetProperty("id").GetString()!
                    : document.RootElement.GetProperty("delta").GetString()!;
                events.Add((item.EventType, value));
            }

            CollectionAssert.AreEqual(
                new[]
                {
                    ("responseCreated", "resp_1"),
                    ("responseDelta", "Hello"),
                    ("responseDelta", " world"),
                },
                events);
        });

        [SpectorTest]
        public Task Retrieve() => Test(async (host) =>
        {
            var client = new SseClient(host, null).GetRetrieveClient();
            await using var response = await client.StreamAsync(
                new RetrievalRequest("what is typespec?"));
            var events = new List<(string Type, string Value)>();
            await foreach (var item in response)
            {
                using var document = JsonDocument.Parse(item.Data.ToMemory());
                var value = item.EventType == "partialResult"
                    ? document.RootElement.GetProperty("text").GetString()!
                    : string.Join(
                        ",",
                        document.RootElement.GetProperty("references")
                            .EnumerateArray()
                            .Select(element => element.GetString()));
                events.Add((item.EventType, value));
            }

            CollectionAssert.AreEqual(
                new[]
                {
                    ("partialResult", "partial one"),
                    ("partialResult", "partial two"),
                    ("finalResult", "doc1,doc2"),
                },
                events);
        });

        [SpectorTest]
        public Task WithEnvelope() => Test(async (host) =>
        {
            var client = new SseClient(host, null).GetProtocolClient().GetProtocolDataClient();
            await using var response = await client.WithEnvelopeAsync();
            var item = await ReadSingleEventAsync(response);

            Assert.AreEqual("withEnvelope", item.EventType);
            Assert.AreEqual("hello", item.Data.ToString());
        });

        [SpectorTest]
        public Task WithoutEnvelope() => Test(async (host) =>
        {
            var client = new SseClient(host, null).GetProtocolClient().GetProtocolDataClient();
            await using var response = await client.WithoutEnvelopeAsync();
            var item = await ReadSingleEventAsync(response);

            Assert.AreEqual("withoutEnvelope", item.EventType);
            using var document = JsonDocument.Parse(item.Data.ToMemory());
            Assert.AreEqual("world", document.RootElement.GetProperty("contents").GetString());
            Assert.AreEqual("test", document.RootElement.GetProperty("metadata").GetProperty("source").GetString());
        });

        [SpectorTest]
        public Task Id() => Test(async (host) =>
        {
            var client = new SseClient(host, null).GetProtocolClient();
            await using var response = await client.IdAsync();
            var item = await ReadSingleEventAsync(response);

            Assert.AreEqual("message", item.EventType);
            Assert.AreEqual("event-1", item.EventId);
            Assert.AreEqual("hello", item.Data.Message);
        });

        [SpectorTest]
        public Task InvalidId() => Test(async (host) =>
        {
            var client = new SseClient(host, null).GetProtocolClient();
            await using var response = await client.InvalidIdAsync();
            var item = await ReadSingleEventAsync(response);

            Assert.AreEqual("message", item.EventType);
            Assert.IsNull(item.EventId);
            Assert.AreEqual("hello", item.Data.Message);
        });

        [SpectorTest]
        public Task Retry() => Test(async (host) =>
        {
            var client = new SseClient(host, null).GetProtocolClient();
            await using var response = await client.RetryAsync();
            var item = await ReadSingleEventAsync(response);

            Assert.AreEqual("message", item.EventType);
            Assert.AreEqual(TimeSpan.FromMilliseconds(1000), item.ReconnectionInterval);
            Assert.AreEqual("hello", item.Data.Message);
        });

        [SpectorTest]
        public Task InvalidRetry() => Test(async (host) =>
        {
            var client = new SseClient(host, null).GetProtocolClient();
            await using var response = await client.InvalidRetryAsync();
            var item = await ReadSingleEventAsync(response);

            Assert.AreEqual("message", item.EventType);
            Assert.IsNull(item.ReconnectionInterval);
            Assert.AreEqual("hello", item.Data.Message);
        });

        [SpectorTest]
        public Task Reconnect() => Test(async (host) =>
        {
            var client = new SseClient(host, null).GetProtocolClient();
            string lastEventId;
            await using (var response = await client.ReconnectAsync())
            {
                var item = await ReadSingleEventAsync(response);
                Assert.AreEqual("message", item.EventType);
                Assert.AreEqual("event-1", item.EventId);
                Assert.AreEqual("hello", item.Data.Message);
                lastEventId = item.EventId!;
            }

            var options = new RequestOptions();
            options.SetHeader("Last-Event-ID", lastEventId);
            await using var reconnectedResponse = await client.ReconnectAsync(options);
            var reconnectedItem = await ReadSingleEventAsync(reconnectedResponse);

            Assert.AreEqual("message", reconnectedItem.EventType);
            Assert.AreEqual("event-2", reconnectedItem.EventId);
            using var document = JsonDocument.Parse(reconnectedItem.Data.ToMemory());
            Assert.AreEqual("world", document.RootElement.GetProperty("message").GetString());
        });

        private static async Task<SseItem<T>> ReadSingleEventAsync<T>(IAsyncEnumerable<SseItem<T>> response)
        {
            await using var enumerator = response.GetAsyncEnumerator();
            Assert.IsTrue(await enumerator.MoveNextAsync(), "Expected one SSE event.");
            var item = enumerator.Current;
            Assert.IsFalse(await enumerator.MoveNextAsync(), "Expected the SSE stream to end after one event.");
            return item;
        }
    }
}
