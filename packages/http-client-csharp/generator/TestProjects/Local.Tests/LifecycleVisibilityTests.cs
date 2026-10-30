// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;
using Moq;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class LifecycleVisibilityTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public async Task ReadOnlyXmlRequestsExcludePopulatedResponseProperties(bool isAsync)
        {
            var client = new Mock<VisibilitySamples> { CallBase = true };
            XElement? payload = null;
            var result = ClientResult.FromResponse(Mock.Of<PipelineResponse>());
            void Capture(BinaryContent content, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream);
                payload = XElement.Parse(BinaryData.FromBytes(stream.ToArray()).ToString());
            }
            client.Setup(c => c.ReadOnlyXml(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.ReadOnlyXmlAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            var topic = ModelReaderWriter.Read<LifecycleReadOnlyXmlTopic>(
                BinaryData.FromString("{\"title\":\"title\",\"id\":\"id\"}"))!;

            if (isAsync)
            {
                await client.Object.ReadOnlyXmlAsync(topic);
            }
            else
            {
                client.Object.ReadOnlyXml(topic);
            }

            Assert.AreEqual("id", topic.Id);
            Assert.AreEqual("title", payload!.Element("title")?.Value);
            Assert.IsNull(payload.Element("id"));
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task XmlOnlyRequestsRecognizeTextAndVendorMediaTypes(bool isAsync)
        {
            var client = new Mock<VisibilitySamples> { CallBase = true };
            var payloads = new List<XElement>();
            var result = ClientResult.FromResponse(Mock.Of<PipelineResponse>());
            void Capture(BinaryContent content, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream);
                payloads.Add(XElement.Parse(BinaryData.FromBytes(stream.ToArray()).ToString()));
            }
            client.Setup(c => c.TextXml(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.TextXmlAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.VendorXml(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.VendorXmlAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            var topic = new LifecycleXmlOnlyTopic("title") { State = "active" };

            if (isAsync)
            {
                await client.Object.TextXmlAsync(topic);
                await client.Object.VendorXmlAsync(topic);
            }
            else
            {
                client.Object.TextXml(topic);
                client.Object.VendorXml(topic);
            }

            Assert.AreEqual(2, payloads.Count);
            foreach (var payload in payloads)
            {
                Assert.AreEqual("title", payload.Element("title")?.Value);
                Assert.IsNull(payload.Element("state"));
            }
        }

        private static ChatTopic CreateTopic() => ModelReaderWriter.Read<ChatTopic>(
            BinaryData.FromString("{\"title\":\"title\",\"state\":\"active\",\"createOnly\":\"create\",\"id\":\"id\"}"))!;

        [TestCase(false)]
        [TestCase(true)]
        public async Task PagedRequestsRetainContentUntilEnumeration(bool isAsync)
        {
            using var handler = new PagingHandler();
            using var httpClient = new HttpClient(handler);
            var options = new SampleTypeSpecClientOptions { Transport = new HttpClientPipelineTransport(httpClient) };
            var client = new SampleTypeSpecClient(new Uri("https://example.test"), new ApiKeyCredential("key"), options).GetVisibilitySamplesClient();
            var count = 0;
            if (isAsync)
            {
                var pages = client.PagedAsync(CreateTopic());
                Assert.AreEqual(0, handler.Payloads.Count);
                await foreach (var item in pages)
                {
                    Assert.AreEqual("title", item.Title);
                    count++;
                }
            }
            else
            {
                var pages = client.Paged(CreateTopic());
                Assert.AreEqual(0, handler.Payloads.Count);
                foreach (var item in pages)
                {
                    Assert.AreEqual("title", item.Title);
                    count++;
                }
            }
            Assert.AreEqual(2, count);
            Assert.AreEqual(2, handler.RequestCount);
            Assert.AreEqual(1, handler.Payloads.Count);
            foreach (var payload in handler.Payloads)
            {
                AssertTopic(payload, hasState: false, hasCreateOnly: true);
            }
        }

        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public async Task PagedCollectionRequestsRetainContentUntilEnumeration(bool isAsync, bool dictionary)
        {
            using var handler = new PagingHandler();
            using var httpClient = new HttpClient(handler);
            var options = new SampleTypeSpecClientOptions { Transport = new HttpClientPipelineTransport(httpClient) };
            var client = new SampleTypeSpecClient(new Uri("https://example.test"), new ApiKeyCredential("key"), options).GetVisibilitySamplesClient();
            var topic = CreateTopic();
            var lookup = new Dictionary<string, ChatTopic> { ["topic"] = topic };
            var count = 0;
            if (isAsync)
            {
                var pages = dictionary ? client.PagedDictionaryAsync(lookup) : client.PagedListAsync([topic]);
                Assert.AreEqual(0, handler.Payloads.Count);
                await foreach (var item in pages)
                {
                    Assert.AreEqual("title", item.Title);
                    count++;
                }
            }
            else
            {
                var pages = dictionary ? client.PagedDictionary(lookup) : client.PagedList([topic]);
                Assert.AreEqual(0, handler.Payloads.Count);
                foreach (var item in pages)
                {
                    Assert.AreEqual("title", item.Title);
                    count++;
                }
            }
            Assert.AreEqual(1, count);
            var payload = handler.Payloads.Single();
            AssertTopic(dictionary ? payload.GetProperty("topic") : payload[0], hasState: false, hasCreateOnly: true);
        }

        private sealed class PagingHandler : HttpMessageHandler
        {
            internal List<JsonElement> Payloads { get; } = [];
            internal int RequestCount { get; private set; }

            protected override HttpResponseMessage Send(HttpRequestMessage request, CancellationToken cancellationToken)
                => SendAsync(request, cancellationToken).GetAwaiter().GetResult();

            protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                RequestCount++;
                if (request.Content is not null)
                {
                    using var document = JsonDocument.Parse(await request.Content.ReadAsStringAsync(cancellationToken));
                    Payloads.Add(document.RootElement.Clone());
                }
                var next = RequestCount == 1 ? ",\"next\":\"https://example.test/visibility/paged/next\"" : "";
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("{\"items\":[{\"title\":\"title\"}]" + next + "}", System.Text.Encoding.UTF8, "application/json")
                };
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task RawUnionBodyDoesNotSerializeAnUnusedBuffer(bool isAsync)
        {
            var client = new Mock<VisibilitySamples> { CallBase = true };
            var result = ClientResult.FromResponse(Mock.Of<PipelineResponse>());
            string? payload = null;
            void Capture(BinaryContent content, string contentType, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream);
                payload = BinaryData.FromBytes(stream.ToArray()).ToString();
            }
            client.Setup(c => c.UnionBody(It.IsAny<BinaryContent>(), It.IsAny<string>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, string, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.UnionBodyAsync(It.IsAny<BinaryContent>(), It.IsAny<string>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, string, RequestOptions>(Capture).ReturnsAsync(result);
            var body = BinaryData.FromString("raw request content");
            if (isAsync)
            {
                await client.Object.UnionBodyAsync(body, UnionBodyContentType.ApplicationJson);
            }
            else
            {
                client.Object.UnionBody(body, UnionBodyContentType.ApplicationJson);
            }
            Assert.AreEqual(body.ToString(), payload);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void CollectionHelpersPreserveLifecycleOptions(bool useSpan)
        {
            ChatTopic[] topics = [CreateTopic()];
            var options = new LifecycleModelReaderWriterOptions(LifecycleVisibility.Create, "W");
            using var content = useSpan
                ? BinaryContentHelper.FromEnumerable<ChatTopic>(topics.AsSpan(), options)
                : BinaryContentHelper.FromEnumerable((IEnumerable<ChatTopic>)topics, options);
            using var stream = new MemoryStream();
            content.WriteTo(stream);
            using var document = JsonDocument.Parse(stream.ToArray());

            AssertTopic(document.RootElement[0], hasState: false, hasCreateOnly: true);
            Assert.AreEqual(ChatTopicState.Active, topics[0].State);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void BinaryDataCollectionsPreserveRawJsonWithoutLifecycleOptions(bool passOptions)
        {
            var value = BinaryData.FromString("{\"title\":\"title\"}");
            IEnumerable<BinaryData> values = [value, null!];
            IDictionary<string, BinaryData> lookup = new Dictionary<string, BinaryData> { ["topic"] = value, ["null"] = null! };
            using var arrayContent = passOptions
                ? BinaryContentHelper.FromEnumerable(values, new ModelReaderWriterOptions("W"))
                : BinaryContentHelper.FromEnumerable(values);
            using var dictionaryContent = passOptions
                ? BinaryContentHelper.FromDictionary(lookup, new ModelReaderWriterOptions("W"))
                : BinaryContentHelper.FromDictionary(lookup);
            using var arrayStream = new MemoryStream();
            using var dictionaryStream = new MemoryStream();
            arrayContent.WriteTo(arrayStream);
            dictionaryContent.WriteTo(dictionaryStream);

            Assert.AreEqual("[{\"title\":\"title\"},null]", BinaryData.FromBytes(arrayStream.ToArray()).ToString());
            Assert.AreEqual("{\"topic\":{\"title\":\"title\"},\"null\":null}", BinaryData.FromBytes(dictionaryStream.ToArray()).ToString());
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task UnionCollectionsPreserveRawJson(bool isAsync)
        {
            var client = new Mock<VisibilitySamples> { CallBase = true };
            var payloads = new List<JsonElement>();
            var result = ClientResult.FromResponse(Mock.Of<PipelineResponse>());
            void Capture(BinaryContent content, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream);
                using var document = JsonDocument.Parse(stream.ToArray());
                payloads.Add(document.RootElement.Clone());
            }
            client.Setup(c => c.UnionList(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.UnionListAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.UnionDictionary(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.UnionDictionaryAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            var topic = BinaryData.FromString("{\"title\":\"title\"}");
            var text = BinaryData.FromString("\"text\"");
            BinaryData[] topics = [topic, text, null!];
            var lookup = new Dictionary<string, BinaryData> { ["topic"] = topic, ["text"] = text, ["null"] = null! };

            if (isAsync)
            {
                await client.Object.UnionListAsync(topics);
                await client.Object.UnionDictionaryAsync(lookup);
            }
            else
            {
                client.Object.UnionList(topics);
                client.Object.UnionDictionary(lookup);
            }

            Assert.AreEqual(2, payloads.Count);
            Assert.Multiple(() =>
            {
                Assert.AreEqual("{\"title\":\"title\"}", payloads[0][0].GetRawText());
                Assert.AreEqual("text", payloads[0][1].GetString());
                Assert.AreEqual(JsonValueKind.Null, payloads[0][2].ValueKind);
                Assert.AreEqual("{\"title\":\"title\"}", payloads[1].GetProperty("topic").GetRawText());
                Assert.AreEqual("text", payloads[1].GetProperty("text").GetString());
                Assert.AreEqual(JsonValueKind.Null, payloads[1].GetProperty("null").ValueKind);
            });
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task SharedModelUsesTheRequestLifecycle(bool isAsync)
        {
            var client = CreateClient(out var payloads);
            var topic = CreateTopic();

            if (isAsync)
            {
                await client.CreateAsync(topic);
                await client.UpdateAsync(topic);
                await client.ReplaceAsync(topic);
            }
            else
            {
                client.Create(topic);
                client.Update(topic);
                client.Replace(topic);
            }

            AssertTopic(payloads[0], hasState: false, hasCreateOnly: true);
            AssertTopic(payloads[1], hasState: true, hasCreateOnly: false);
            AssertTopic(payloads[2], hasState: false, hasCreateOnly: true);
            Assert.AreEqual(ChatTopicState.Active, topic.State);
            Assert.AreEqual("id", topic.Id);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task LifecyclePropagatesThroughNestedModelsAndCollections(bool isAsync)
        {
            var client = CreateClient(out var payloads);
            var topic = CreateTopic();
            var envelope = new ChatTopicEnvelope(topic, new[] { topic }, new Dictionary<string, ChatTopic> { ["key"] = topic });

            if (isAsync)
            {
                await client.NestedAsync(envelope);
                await client.SendListAsync(new[] { topic });
                await client.DictionaryAsync(new Dictionary<string, ChatTopic> { ["key"] = topic });
                await client.SpreadAsync(topic, new[] { topic }, new Dictionary<string, ChatTopic> { ["key"] = topic });
            }
            else
            {
                client.Nested(envelope);
                client.SendList(new[] { topic });
                client.Dictionary(new Dictionary<string, ChatTopic> { ["key"] = topic });
                client.Spread(topic, new[] { topic }, new Dictionary<string, ChatTopic> { ["key"] = topic });
            }

            AssertTopic(payloads[0].GetProperty("topic"), hasState: false, hasCreateOnly: true);
            AssertTopic(payloads[0].GetProperty("topics")[0], hasState: false, hasCreateOnly: true);
            AssertTopic(payloads[0].GetProperty("lookup").GetProperty("key"), hasState: false, hasCreateOnly: true);
            AssertTopic(payloads[1][0], hasState: false, hasCreateOnly: true);
            AssertTopic(payloads[2].GetProperty("key"), hasState: false, hasCreateOnly: true);
            AssertTopic(payloads[3].GetProperty("topic"), hasState: false, hasCreateOnly: true);
            AssertTopic(payloads[3].GetProperty("topics")[0], hasState: false, hasCreateOnly: true);
            AssertTopic(payloads[3].GetProperty("lookup").GetProperty("key"), hasState: false, hasCreateOnly: true);
        }

        [Test]
        public void ConstructorDoesNotRequireUpdateOnlyState()
        {
            var topic = new ChatTopic("title");
            Assert.IsNull(topic.State);
            var constructor = typeof(ChatTopic).GetConstructors().Single();
            CollectionAssert.AreEqual(new[] { "title" }, constructor.GetParameters().Select(parameter => parameter.Name));
        }

        [Test]
        public void ReadAndPersistenceRetainAllProperties()
        {
            var topic = CreateTopic();
            Assert.AreEqual(ChatTopicState.Active, topic.State);
            Assert.AreEqual("id", topic.Id);

            using var document = JsonDocument.Parse(ModelReaderWriter.Write(topic));
            Assert.AreEqual("active", document.RootElement.GetProperty("state").GetString());
            Assert.AreEqual("id", document.RootElement.GetProperty("id").GetString());
            Assert.AreEqual("create", document.RootElement.GetProperty("createOnly").GetString());
        }

        [TestCase("{\"title\":\"new title\"}")]
        [TestCase("{\"state\":\"archived\"}")]
        public void RawPatchPreservesOmittedProperties(string json)
        {
            var client = CreateClient(out var payloads);
            using var content = BinaryContent.Create(BinaryData.FromString(json));
            client.Patch(content);
            Assert.AreEqual(json, payloads.Single().GetRawText());
            Assert.IsFalse(typeof(VisibilitySamples).GetMethods().Any(method =>
                method.Name == "Patch" && method.GetParameters()[0].ParameterType == typeof(ChatTopic)));
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task OptionalBodyRemainsOmitted(bool isAsync)
        {
            var client = new Mock<VisibilitySamples> { CallBase = true };
            var payloads = new List<BinaryContent?>();
            void Capture(BinaryContent content, RequestOptions options)
            {
                payloads.Add(content);
            }
            var result = ClientResult.FromResponse(Mock.Of<PipelineResponse>());
            client.Setup(c => c.Optional(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.OptionalAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.OptionalDictionary(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.OptionalDictionaryAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.OptionalList(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.OptionalListAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.OptionalXml(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.OptionalXmlAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.OptionalXmlList(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.OptionalXmlListAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);

            if (isAsync)
            {
                await client.Object.OptionalAsync();
                await client.Object.OptionalDictionaryAsync();
                await client.Object.OptionalListAsync();
                await client.Object.OptionalXmlAsync();
                await client.Object.OptionalXmlListAsync();
            }
            else
            {
                client.Object.Optional();
                client.Object.OptionalDictionary();
                client.Object.OptionalList();
                client.Object.OptionalXml();
                client.Object.OptionalXmlList();
            }

            Assert.AreEqual(5, payloads.Count);
            Assert.That(payloads, Is.All.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task XmlRequestsHandleFullyFilteredChildren(bool isAsync)
        {
            var client = new Mock<VisibilitySamples> { CallBase = true };
            var payloads = new List<XElement>();
            var result = ClientResult.FromResponse(Mock.Of<PipelineResponse>());
            void Capture(BinaryContent content, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream);
                payloads.Add(XElement.Parse(BinaryData.FromBytes(stream.ToArray()).ToString()));
            }
            client.Setup(c => c.EmptyXml(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.EmptyXmlAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.EmptyXmlList(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.EmptyXmlListAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            var child = new LifecycleXmlChild { State = "active" };
            var envelope = new LifecycleXmlEnvelope(child, [child]);
            if (isAsync)
            {
                await client.Object.EmptyXmlAsync(envelope);
                await client.Object.EmptyXmlListAsync([child]);
            }
            else
            {
                client.Object.EmptyXml(envelope);
                client.Object.EmptyXmlList([child]);
            }

            Assert.AreEqual(2, payloads.Count);
            Assert.IsNotNull(payloads[0].Element("child"));
            Assert.IsFalse(payloads[0].Element("child")!.HasElements);
            Assert.IsTrue(payloads[0].Element("children")!.HasElements);
            Assert.IsFalse(payloads[0].Element("children")!.Elements().Single().HasElements);
            Assert.IsFalse(payloads[1].Elements().Single().HasElements);
            Assert.IsFalse(payloads.Any(payload => payload.Descendants("state").Any()));
            Assert.AreEqual("active", child.State);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task XmlRequestsUseTheRequestLifecycle(bool isAsync)
        {
            var client = new Mock<VisibilitySamples> { CallBase = true };
            var payloads = new List<XElement>();
            var result = ClientResult.FromResponse(Mock.Of<PipelineResponse>());
            void Capture(BinaryContent content, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream);
                payloads.Add(XElement.Parse(BinaryData.FromBytes(stream.ToArray()).ToString()));
            }
            client.Setup(c => c.Xml(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.XmlAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.XmlList(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.XmlListAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.SpreadXml(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.SpreadXmlAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);

            if (isAsync)
            {
                await client.Object.XmlAsync(CreateTopic());
                await client.Object.XmlListAsync(new[] { CreateTopic() });
                await client.Object.SpreadXmlAsync(CreateTopic(), new[] { CreateTopic() }, new Dictionary<string, ChatTopic> { ["key"] = CreateTopic() });
            }
            else
            {
                client.Object.Xml(CreateTopic());
                client.Object.XmlList(new[] { CreateTopic() });
                client.Object.SpreadXml(CreateTopic(), new[] { CreateTopic() }, new Dictionary<string, ChatTopic> { ["key"] = CreateTopic() });
            }

            foreach (var payload in new[] { payloads[0], payloads[1].Elements().Single(), payloads[2].Element("topic")! })
            {
                Assert.AreEqual("title", payload.Element("title")?.Value);
                Assert.AreEqual("create", payload.Element("createOnly")?.Value);
                Assert.IsNull(payload.Element("state"));
                Assert.IsNull(payload.Element("id"));
            }
        }

        [Test]
        public async Task JsonLinesRequestsUseTheRequestLifecycle()
        {
            var client = new Mock<VisibilitySamples> { CallBase = true };
            JsonElement payload = default;
            client.Setup(c => c.JsonLinesAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Returns(async (BinaryContent content, RequestOptions options) =>
                {
                    using var stream = new MemoryStream();
                    await content.WriteToAsync(stream);
                    using var document = JsonDocument.Parse(stream.ToArray());
                    payload = document.RootElement.Clone();
                    return ClientResult.FromResponse(Mock.Of<PipelineResponse>());
                });

            await client.Object.JsonLinesAsync(Topics());
            AssertTopic(payload, hasState: false, hasCreateOnly: true);

            static async IAsyncEnumerable<ChatTopic> Topics()
            {
                yield return CreateTopic();
                await Task.CompletedTask;
            }
        }

        [TestCase(false)]
        [TestCase(true)]
#pragma warning disable SCME0004 // Multipart convenience methods are experimental.
        public async Task MultipartRequestsUseTheRequestLifecycle(bool isAsync)
        {
            var client = new Mock<VisibilitySamples> { CallBase = true };
            string? payload = null;
            var result = ClientResult.FromResponse(Mock.Of<PipelineResponse>());
            void Capture(BinaryContent content, string contentType, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream);
                payload = BinaryData.FromBytes(stream.ToArray()).ToString();
            }
            client.Setup(c => c.Multipart(It.IsAny<BinaryContent>(), It.IsAny<string>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, string, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.MultipartAsync(It.IsAny<BinaryContent>(), It.IsAny<string>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, string, RequestOptions>(Capture).ReturnsAsync(result);
            var body = new LifecycleMultipart("title", "active", new LifecycleMultipartTopic("title"), "response-id");

            if (isAsync)
            {
                await client.Object.MultipartAsync(body);
            }
            else
            {
                client.Object.Multipart(body);
            }

            StringAssert.IsMatch("name=\"?title\"?(?:\\r?\\n|;)", payload);
            StringAssert.IsMatch("name=\"?topic\"?(?:\\r?\\n|;)", payload);
            StringAssert.DoesNotContain("state", payload);
            StringAssert.DoesNotContain("response-id", payload);
            Assert.AreEqual("response-id", body.Id);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task ReadOnlyMultipartPartsUseTheRequestLifecycle(bool isAsync)
        {
            var client = new Mock<VisibilitySamples> { CallBase = true };
            string? payload = null;
            var result = ClientResult.FromResponse(Mock.Of<PipelineResponse>());
            void Capture(BinaryContent content, string contentType, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream);
                payload = BinaryData.FromBytes(stream.ToArray()).ToString();
            }
            client.Setup(c => c.ReadOnlyMultipart(It.IsAny<BinaryContent>(), It.IsAny<string>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, string, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.ReadOnlyMultipartAsync(It.IsAny<BinaryContent>(), It.IsAny<string>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, string, RequestOptions>(Capture).ReturnsAsync(result);
            var body = new LifecycleReadOnlyMultipart("title", "response-id");

            if (isAsync)
            {
                await client.Object.ReadOnlyMultipartAsync(body);
            }
            else
            {
                client.Object.ReadOnlyMultipart(body);
            }

            StringAssert.IsMatch("name=\"?title\"?(?:\\r?\\n|;)", payload);
            StringAssert.DoesNotContain("response-id", payload);
            Assert.AreEqual("response-id", body.Id);

            using var persistence = body.ToMultipartFormContent();
            using var stream = new MemoryStream();
            persistence.WriteTo(stream);
            StringAssert.Contains("response-id", BinaryData.FromBytes(stream.ToArray()).ToString());
        }
#pragma warning restore SCME0004

        private static void AssertTopic(JsonElement topic, bool hasState, bool hasCreateOnly)
        {
            Assert.AreEqual("title", topic.GetProperty("title").GetString());
            Assert.AreEqual(hasState, topic.TryGetProperty("state", out _));
            Assert.AreEqual(hasCreateOnly, topic.TryGetProperty("createOnly", out _));
            Assert.IsFalse(topic.TryGetProperty("id", out _));
        }

        private static VisibilitySamples CreateClient(out List<JsonElement> payloads)
        {
            var captured = payloads = new List<JsonElement>();
            var client = new Mock<VisibilitySamples> { CallBase = true };
            var result = ClientResult.FromResponse(Mock.Of<PipelineResponse>());
            void Capture(BinaryContent content, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream, CancellationToken.None);
                using var document = JsonDocument.Parse(stream.ToArray());
                captured.Add(document.RootElement.Clone());
            }

            client.Setup(c => c.Create(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.CreateAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.Update(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.UpdateAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.Replace(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.ReplaceAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.Nested(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.NestedAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.SendList(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.SendListAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.Dictionary(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.DictionaryAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.Spread(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            client.Setup(c => c.SpreadAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(result);
            client.Setup(c => c.Patch(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>())).Callback<BinaryContent, RequestOptions>(Capture).Returns(result);
            return client.Object;
        }
    }
}
