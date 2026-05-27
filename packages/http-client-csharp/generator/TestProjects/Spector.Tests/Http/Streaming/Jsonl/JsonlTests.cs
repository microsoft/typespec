// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Collections.Generic;
using System.IO;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using Streaming.Jsonl;

namespace TestProjects.Spector.Tests.Http.Streaming.Jsonl
{
    public class JsonlTests : SpectorTestBase
    {
        [SpectorTest]
        public Task BasicSend() => Test(async (host) =>
        {
            var client = new JsonlClient(host, null).GetBasicClient();

            // Build the JSONL payload line-by-line from Info objects, demonstrating
            // the streaming-friendly pattern: each line is independently serialized.
            var items = new[] { new Info("one"), new Info("two"), new Info("three") };
            var jsonlPayload = string.Join("\n", Array.ConvertAll(items, i => JsonSerializer.Serialize(i)));

            var stream = StreamingJsonlModelFactory.JsonlStreamInfo(BinaryData.FromString(jsonlPayload));
            var response = await client.SendAsync(stream);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task BasicReceive() => Test(async (host) =>
        {
            var client = new JsonlClient(host, null).GetBasicClient();

            // Use the protocol method to get the raw response stream, then
            // enumerate JSONL lines as IAsyncEnumerable<Info> without buffering
            // the entire payload into memory.
            ClientResult result = await client.ReceiveAsync(options: null);
            var rawResponse = result.GetRawResponse();
            Assert.AreEqual(200, rawResponse.Status);
            Assert.IsNotNull(rawResponse.ContentStream);

            var received = new List<Info>();
            await foreach (var info in EnumerateJsonlAsync<Info>(rawResponse.ContentStream!))
            {
                received.Add(info);
            }

            Assert.AreEqual(3, received.Count);
            Assert.AreEqual("one", received[0].Desc);
            Assert.AreEqual("two", received[1].Desc);
            Assert.AreEqual("three", received[2].Desc);
        });

        /// <summary>
        /// Reads a stream of JSONL (JSON Lines) data and yields each line as a
        /// deserialized <typeparamref name="T"/> instance. This demonstrates the
        /// <see cref="IAsyncEnumerable{T}"/> pattern that the generator should
        /// eventually emit for streaming operations — reading line-by-line avoids
        /// buffering the entire payload into memory.
        /// </summary>
        private static async IAsyncEnumerable<T> EnumerateJsonlAsync<T>(
            Stream contentStream,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            using var reader = new StreamReader(contentStream, Encoding.UTF8);
            string? line;
            while ((line = await reader.ReadLineAsync(cancellationToken)) is not null)
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue;
                yield return JsonSerializer.Deserialize<T>(line)!;
            }
        }

        /// <summary>
        /// Local representation of the Streaming.Jsonl.Basic.Info model for test
        /// deserialization. The generator does not yet emit this type because the
        /// JSONL body is treated as raw bytes in the current code model.
        /// </summary>
        private sealed class Info
        {
            public Info() { }

            public Info(string desc)
            {
                Desc = desc;
            }

            [System.Text.Json.Serialization.JsonPropertyName("desc")]
            public string? Desc { get; set; }
        }
    }
}
