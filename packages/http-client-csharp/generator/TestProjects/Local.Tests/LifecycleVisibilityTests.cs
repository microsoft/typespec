// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
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
            var body = new LifecycleMultipart("title", new LifecycleMultipartTopic("title")) { State = "active" };

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
