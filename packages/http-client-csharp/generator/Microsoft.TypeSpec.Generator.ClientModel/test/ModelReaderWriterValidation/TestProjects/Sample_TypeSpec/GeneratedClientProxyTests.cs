// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using SampleTypeSpec;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Sample_TypeSpec
{
    internal class GeneratedClientProxyTests
    {
        private const string ResponseJson = "{\"species\":\"tree\",\"id\":\"response-tree\",\"height\":12,\"age\":5}";

        [Test]
        public async Task SeparateGeneratedClientsKeepProxyRegistrationsThroughSubclients()
        {
            var endpoint = new Uri("https://example.test");
            var credential = new ApiKeyCredential("test-key");
            using var proxiedHandler = new TreeResponseHandler(ResponseJson);
            using var unproxiedHandler = new TreeResponseHandler(ResponseJson);
            using var proxiedTransport = new HttpClientPipelineTransport(new HttpClient(proxiedHandler));
            using var unproxiedTransport = new HttpClientPipelineTransport(new HttpClient(unproxiedHandler));

            var proxiedOptions = new SampleTypeSpecClientOptions { Transport = proxiedTransport };
            var treeProxy = new TreeProxy();
            proxiedOptions.ModelProxies.Add(treeProxy);
            var proxiedClient = new SampleTypeSpecClient(endpoint, credential, proxiedOptions);
            var unproxiedClient = new SampleTypeSpecClient(
                endpoint, credential, new SampleTypeSpecClientOptions { Transport = unproxiedTransport });

            Tree proxied = (await proxiedClient.GetPlantOperationsClient()
                .UpdateTreeAsJsonAsync(new Tree("request-tree", 7, 3))).Value;
            Tree unproxied = (await unproxiedClient.GetPlantOperationsClient()
                .UpdateTreeAsJsonAsync(new Tree("request-tree", 7, 3))).Value;

            Assert.IsInstanceOf<ExternalTree>(proxied);
            Assert.AreEqual(typeof(GeneratedClientProxyTests).Assembly, proxied.GetType().Assembly);
            Assert.AreEqual("response-tree", proxied.Id);
            Assert.AreEqual(12, proxied.Height);
            Assert.AreEqual(5, proxied.Age);
            Assert.AreEqual(typeof(Tree), unproxied.GetType());
            Assert.AreEqual("response-tree", unproxied.Id);
            Assert.AreEqual(1, proxiedHandler.Requests.Count);
            Assert.AreEqual(1, unproxiedHandler.Requests.Count);
            Assert.AreEqual(1, treeProxy.Writes);
            Assert.AreEqual(1, treeProxy.Reads);

            foreach (var request in proxiedHandler.Requests)
            {
                Assert.AreEqual(HttpMethod.Put, request.Method);
                Assert.AreEqual("/plants/tree/as-plant/json", request.Path);
                using var document = JsonDocument.Parse(request.Body);
                Assert.AreEqual("request-tree", document.RootElement.GetProperty("id").GetString());
            }
        }

        [Test]
        public async Task BaseModelProxyAppliesToDerivedModelWrittenByGeneratedClient()
        {
            using var handler = new TreeResponseHandler(ResponseJson);
            using var transport = new HttpClientPipelineTransport(new HttpClient(handler));
            var options = new SampleTypeSpecClientOptions { Transport = transport };
            var plantProxy = new WriteOnlyPlantProxy();
            options.ModelProxies.Add(plantProxy);
            var client = new SampleTypeSpecClient(new Uri("https://example.test"), new ApiKeyCredential("test-key"), options);

            Tree response = (await client.GetPlantOperationsClient()
                .UpdateTreeAsJsonAsync(new Tree("request-tree", 7, 3))).Value;

            Assert.AreEqual(1, plantProxy.Writes);
            Assert.AreEqual(typeof(Tree), plantProxy.LastProxiedModelType);
            Assert.AreEqual(1, handler.Requests.Count);
            using (var document = JsonDocument.Parse(handler.Requests[0].Body))
            {
                Assert.AreEqual("proxied:request-tree", document.RootElement.GetProperty("id").GetString());
                Assert.AreEqual(3, document.RootElement.GetProperty("age").GetInt32());
            }

            // The proxy declines reads, so the response is deserialized by the generated Tree serializer.
            Assert.AreEqual(typeof(Tree), response.GetType());
            Assert.AreEqual("response-tree", response.Id);
        }

        private sealed class ExternalTree : Tree
        {
            public ExternalTree(string id, int height, int age) : base(id, height, age)
            {
            }
        }

        private sealed class TreeProxy : ModelProxy<Tree>
        {
            private int _reads;
            private int _writes;

            public int Reads => Volatile.Read(ref _reads);

            public int Writes => Volatile.Read(ref _writes);

            public override Tree Create(BinaryData data, ModelReaderWriterOptions options)
            {
                Interlocked.Increment(ref _reads);
                using var document = JsonDocument.Parse(data);
                JsonElement root = document.RootElement;
                return new ExternalTree(
                    root.GetProperty("id").GetString()!,
                    root.GetProperty("height").GetInt32(),
                    root.GetProperty("age").GetInt32());
            }

            public override BinaryData Write(ModelReaderWriterOptions options)
            {
                Interlocked.Increment(ref _writes);
                if (options.ProxiedModel is not IJsonModel<Tree> tree)
                {
                    throw new InvalidOperationException("A Tree must be present during proxy serialization.");
                }
                return WriteJson(writer => tree.Write(writer, options));
            }

            public override string GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
        }

        // Registered for the Plant base model; it must be selected when the client writes a Tree.
        private sealed class WriteOnlyPlantProxy : ModelProxy<Plant>
        {
            private int _writes;

            public int Writes => Volatile.Read(ref _writes);

            public Type? LastProxiedModelType { get; private set; }

            public override bool CanHandle(ReadOnlyMemory<byte> data, ModelReaderWriterOptions options) => false;

            public override bool CanHandle(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => false;

            public override Plant Create(BinaryData data, ModelReaderWriterOptions options)
                => throw new InvalidOperationException("This proxy declines reads.");

            public override BinaryData Write(ModelReaderWriterOptions options)
            {
                Interlocked.Increment(ref _writes);
                if (options.ProxiedModel is not Plant plant)
                {
                    throw new InvalidOperationException("A Plant must be present during proxy serialization.");
                }
                LastProxiedModelType = plant.GetType();

                // Pass through to the original model's writer, then replace the id to show the proxy output is sent.
                BinaryData original = WriteJson(writer => ((IJsonModel<Plant>)plant).Write(writer, options));
                using var document = JsonDocument.Parse(original);
                return WriteJson(writer =>
                {
                    writer.WriteStartObject();
                    foreach (JsonProperty property in document.RootElement.EnumerateObject())
                    {
                        if (property.NameEquals("id"))
                        {
                            writer.WriteString("id", "proxied:" + property.Value.GetString());
                        }
                        else
                        {
                            property.WriteTo(writer);
                        }
                    }
                    writer.WriteEndObject();
                });
            }

            public override string GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
        }

        private static BinaryData WriteJson(Action<Utf8JsonWriter> write)
        {
            using var stream = new System.IO.MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                write(writer);
            }
            return BinaryData.FromBytes(stream.ToArray());
        }

        private sealed class TreeResponseHandler : HttpMessageHandler
        {
            private readonly string _responseJson;
            public List<(HttpMethod Method, string Path, string Body)> Requests { get; } = new();

            public TreeResponseHandler(string responseJson)
            {
                _responseJson = responseJson;
            }

            protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                string body = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);
                Requests.Add((
                    request.Method,
                    request.RequestUri?.AbsolutePath ?? throw new InvalidOperationException("Request URI is missing."),
                    body));
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(_responseJson, Encoding.UTF8, "application/json")
                };
            }
        }
    }
}
