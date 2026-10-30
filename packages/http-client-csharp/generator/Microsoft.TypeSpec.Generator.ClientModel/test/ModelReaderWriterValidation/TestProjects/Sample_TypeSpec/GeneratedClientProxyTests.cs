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
            proxiedOptions.AddProxy<Tree>(new TreeProxy());
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

            foreach (var request in proxiedHandler.Requests)
            {
                Assert.AreEqual(HttpMethod.Put, request.Method);
                Assert.AreEqual("/plants/tree/as-plant/json", request.Path);
                using var document = JsonDocument.Parse(request.Body);
                Assert.AreEqual("request-tree", document.RootElement.GetProperty("id").GetString());
            }
        }

        private sealed class ExternalTree : Tree
        {
            public ExternalTree(string id, int height, int age) : base(id, height, age)
            {
            }
        }

        private sealed class TreeProxy : IPersistableModel<Tree>
        {
            public Tree Create(BinaryData data, ModelReaderWriterOptions options)
            {
                using var document = JsonDocument.Parse(data);
                JsonElement root = document.RootElement;
                return new ExternalTree(
                    root.GetProperty("id").GetString()!,
                    root.GetProperty("height").GetInt32(),
                    root.GetProperty("age").GetInt32());
            }

            public BinaryData Write(ModelReaderWriterOptions options)
            {
                if (options.ProxiedModel is not Tree tree)
                {
                    throw new InvalidOperationException("A Tree must be present during proxy serialization.");
                }
                return ((IPersistableModel<Tree>)tree).Write(new ModelReaderWriterOptions(options.Format));
            }

            public string GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
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
