// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class ModelProxyTests
    {
        [Test]
        public void NestedModelReadsUseRegisteredProxy()
        {
            var proxy = new ThingProxy();
            var options = CreateOptions(proxy);

            var page = ReadPage("""{"items":[{"name":"first"},{"name":"second"}]}""", options);
            var roundTrip = ModelReaderWriter.Read<RoundTripModel>(
                BinaryData.FromString("""{"requiredModel":{"name":"nested"}}"""), options, SampleTypeSpecContext.Default);

            Assert.AreEqual(new[] { "proxy:first", "proxy:second" }, page.Items.Select(item => item.Rename));
            Assert.AreEqual("proxy:nested", roundTrip!.RequiredModel.Rename);
            Assert.AreEqual(3, proxy.ReadCount);
        }

        [Test]
        public void NestedModelWritesUseRegisteredProxy()
        {
            var proxy = new ThingProxy();
            var page = new PageThing([CreateThing("first"), CreateThing("second")]);

            var result = ModelReaderWriter.Write(page, CreateOptions(proxy), SampleTypeSpecContext.Default);

            using var document = JsonDocument.Parse(result);
            var items = document.RootElement.GetProperty("items").EnumerateArray().ToArray();
            Assert.AreEqual(new[] { "first", "second" }, items.Select(item => item.GetProperty("proxied").GetString()));
            Assert.AreEqual(2, proxy.WriteCount);
        }

        [Test]
        public void NestedDynamicModelReadsUseRegisteredProxy()
        {
            var proxy = new AnotherDynamicModelProxy();

            var model = ModelReaderWriter.Read<DynamicModel>(
                BinaryData.FromString("""{"name":"root","foo":{"bar":"single"},"listFoo":[{"bar":"item"}],"dictionaryFoo":{"key":{"bar":"value"}}}"""),
                CreateOptions(proxy),
                SampleTypeSpecContext.Default);

            Assert.AreEqual("proxy:single", model!.Foo.Bar);
            Assert.AreEqual("proxy:item", model.ListFoo.Single().Bar);
            Assert.AreEqual("proxy:value", model.DictionaryFoo["key"].Bar);
            Assert.AreEqual(3, proxy.ReadCount);
        }

        [Test]
        public void NestedDynamicModelWritesUseRegisteredProxy()
        {
            var proxy = new AnotherDynamicModelProxy();
            var model = new DynamicModel(
                "root",
                [1],
                new Dictionary<string, int>(),
                new Dictionary<string, int>(),
                new AnotherDynamicModel("single"),
                [new AnotherDynamicModel("item")],
                [],
                new Dictionary<string, AnotherDynamicModel> { ["key"] = new AnotherDynamicModel("value") },
                new Dictionary<string, IDictionary<string, AnotherDynamicModel>>(),
                new Dictionary<string, IList<AnotherDynamicModel>>(),
                []);

            var result = ModelReaderWriter.Write(model, CreateOptions(proxy), SampleTypeSpecContext.Default);

            using var document = JsonDocument.Parse(result);
            var root = document.RootElement;
            Assert.AreEqual("single", root.GetProperty("foo").GetProperty("proxied").GetString());
            Assert.AreEqual("item", root.GetProperty("listFoo")[0].GetProperty("proxied").GetString());
            Assert.AreEqual("value", root.GetProperty("dictionaryFoo").GetProperty("key").GetProperty("proxied").GetString());
            Assert.AreEqual(3, proxy.WriteCount);
        }

        [Test]
        public void DecliningProxyFallsBackToModelSerialization()
        {
            var proxy = new ThingProxy(canHandle: false);
            var options = CreateOptions(proxy);

            var page = ReadPage("""{"items":[{"name":"first"}]}""", options);
            var result = ModelReaderWriter.Write(new PageThing([CreateThing("second")]), options, SampleTypeSpecContext.Default);

            Assert.AreEqual("first", page.Items.Single().Rename);
            using var document = JsonDocument.Parse(result);
            var item = document.RootElement.GetProperty("items")[0];
            Assert.AreEqual("second", item.GetProperty("name").GetString());
            Assert.IsFalse(item.TryGetProperty("proxied", out _));
            Assert.AreEqual(0, proxy.ReadCount);
            Assert.AreEqual(0, proxy.WriteCount);
        }

        [Test]
        public void NestedXmlModelReadsUseRegisteredProxy()
        {
            var nestedProxy = new XmlNestedModelProxy();
            var itemProxy = new XmlItemProxy();
            var options = new ModelReaderWriterOptions("W");
            options.Proxies.Add(nestedProxy);
            options.Proxies.Add(itemProxy);

            var model = ModelReaderWriter.Read<XmlAdvancedModel>(
                BinaryData.FromString("""<XmlAdvancedModel><name>root</name><ItemCollection><Item itemId="1"><itemName>first</itemName><itemValue>1</itemValue></Item></ItemCollection><nestedModel nestedId="7"><value>nested</value></nestedModel></XmlAdvancedModel>"""),
                options,
                SampleTypeSpecContext.Default);

            Assert.AreEqual("proxy:nested", model!.NestedModel.Value);
            Assert.AreEqual(7, model.NestedModel.NestedId);
            Assert.AreEqual("proxy:first", model.Items.Single().ItemName);
            Assert.AreEqual(1, nestedProxy.ReadCount);
            Assert.AreEqual(1, itemProxy.ReadCount);
        }

        // Clients copy the proxies configured on their options into the options they use for every operation.
        [Test]
        public void ClientResponsesUseClientOptionsProxies()
        {
            var proxy = new ThingProxy();
            var handler = new StubHandler(("""{"name":"hi"}""", "application/json"));

            var result = CreateClient(handler, proxy).SayHi("head", "query");

            Assert.AreEqual("proxy:hi", result.Value.Rename);
            Assert.AreEqual(1, proxy.ReadCount);
        }

        [Test]
        public void ClientRequestBodiesUseClientOptionsProxies()
        {
            var proxy = new ThingProxy();
            var handler = new StubHandler(("""{"requiredModel":{"name":"response"}}""", "application/json"));
            var action = new RoundTripModel(
                "value",
                1,
                [],
                new Dictionary<string, StringExtensibleEnum>(),
                CreateThing("request"),
                BinaryData.FromString("1"),
                new Dictionary<string, BinaryData>(),
                new ModelWithRequiredNullableProperties(null, null, null),
                BinaryData.FromBytes([1]));

            var result = CreateClient(handler, proxy).HelloAgain("p2", "p1", action);

            using var request = JsonDocument.Parse(handler.RequestBodies.Single());
            Assert.AreEqual("request", request.RootElement.GetProperty("requiredModel").GetProperty("proxied").GetString());
            Assert.AreEqual("proxy:response", result.Value.RequiredModel.Rename);
            Assert.AreEqual(1, proxy.WriteCount);
            Assert.AreEqual(1, proxy.ReadCount);
        }

        [Test]
        public void ClientPagesUseClientOptionsProxies()
        {
            var proxy = new ThingProxy();
            var handler = new StubHandler(
                ("""{"things":[{"name":"first"}],"next":"https://example.com/link?page=2"}""", "application/json"),
                ("""{"things":[{"name":"second"}]}""", "application/json"));

            var items = CreateClient(handler, proxy).GetWithNextLink().ToArray();

            Assert.AreEqual(new[] { "proxy:first", "proxy:second" }, items.Select(item => item.Rename));
            Assert.AreEqual(2, handler.RequestBodies.Count);
        }

        // Multipart bodies write their model parts with the client's options.
        [Test]
        public void ClientMultipartBodiesUseClientOptionsProxies()
        {
            var proxy = new ThingProxy();
            var handler = new StubHandler(HttpStatusCode.NoContent);
#pragma warning disable SCME0004 // Multipart file parts and content are evaluation-only.
            var cat = new Cat(
                "id",
                true,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                new Dictionary<string, string>(),
                new Dictionary<string, Thing> { ["key"] = CreateThing("value") },
                [],
                [CreateThing("item")],
                [],
                BinaryData.FromString("image"),
                StringExtensibleEnum.One,
                StringFixedEnum.One,
                IntExtensibleEnum.One,
                IntFixedEnum.One);

            CreateClient(handler, proxy).UploadCat(cat);
#pragma warning restore SCME0004

            var body = handler.RequestBodies.Single();
            StringAssert.Contains("""{"proxied":"item"}""", body);
            StringAssert.Contains("""{"proxied":"value"}""", body);
            Assert.AreEqual(2, proxy.WriteCount);
        }

        [Test]
        public void SubClientResponsesUseClientOptionsProxies()
        {
            var proxy = new TreeXmlProxy();
            var handler = new StubHandler(("""<tree><species>tree</species><id>t1</id><height>10</height><age>5</age></tree>""", "application/xml"));

            var result = CreateClient(handler, proxy).GetPlantOperationsClient().GetTree();

            Assert.AreEqual("proxy:t1", result.Value.Id);
            Assert.AreEqual(1, proxy.ReadCount);
            Assert.AreEqual("X", proxy.LastReadFormat);
        }

        [Test]
        public void ShouldReadThroughProxyRequiresProxiesAndBuildableModel()
        {
            var options = new ModelReaderWriterOptions("W");
            Assert.IsFalse(options.ShouldReadThroughProxy<Thing>(SampleTypeSpecContext.Default));

            options.Proxies.Add(new ThingProxy());

            // Repeat each check so the cached per-type answer is exercised as well as the first lookup.
            for (int i = 0; i < 2; i++)
            {
                Assert.IsTrue(options.ShouldReadThroughProxy<Thing>(SampleTypeSpecContext.Default));
                // Internal models are not registered in the generated context, so they keep the static deserializer.
                Assert.IsFalse(options.ShouldReadThroughProxy<PageThing>(SampleTypeSpecContext.Default));
            }
        }

        private static ModelReaderWriterOptions CreateOptions(ModelProxy proxy)
        {
            var options = new ModelReaderWriterOptions("W");
            options.Proxies.Add(proxy);
            return options;
        }

        private static SampleTypeSpecClient CreateClient(StubHandler handler, ModelProxy proxy)
        {
            var options = new SampleTypeSpecClientOptions
            {
                Transport = new HttpClientPipelineTransport(new HttpClient(handler)),
                RetryPolicy = new ClientRetryPolicy(0)
            };
            options.ModelProxies.Add(proxy);
            return new SampleTypeSpecClient(new Uri("https://example.com"), new ApiKeyCredential("key"), options);
        }

        // Returns the queued responses in order, or an empty response with the given status, and records each request body.
        private sealed class StubHandler : HttpMessageHandler
        {
            private readonly Queue<(string Content, string ContentType)> _responses;
            private readonly HttpStatusCode _statusCode = HttpStatusCode.OK;

            public StubHandler(params (string Content, string ContentType)[] responses)
            {
                _responses = new(responses);
            }

            public StubHandler(HttpStatusCode statusCode)
            {
                _responses = new();
                _statusCode = statusCode;
            }

            public List<string> RequestBodies { get; } = [];

            protected override HttpResponseMessage Send(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                RequestBodies.Add(request.Content?.ReadAsStringAsync(cancellationToken).GetAwaiter().GetResult() ?? string.Empty);
                if (_responses.Count == 0)
                {
                    return new HttpResponseMessage(_statusCode);
                }
                var (content, contentType) = _responses.Dequeue();
                return new HttpResponseMessage(_statusCode) { Content = new StringContent(content, Encoding.UTF8, contentType) };
            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
                => Task.FromResult(Send(request, cancellationToken));
        }

        // PageThing is internal, so it is not buildable through the generated context; read it through its own interface.
        private static PageThing ReadPage(string json, ModelReaderWriterOptions options)
            => ((IPersistableModel<PageThing>)new PageThing([])).Create(BinaryData.FromString(json), options)!;

        private static Thing CreateThing(string name)
            => new(name, BinaryData.FromString("\"union\""), "nullable", null, "description", [1], "docs");

        private sealed class ThingProxy : TestProxy<Thing>
        {
            public ThingProxy(bool canHandle = true) : base(canHandle)
            {
            }

            protected override Thing Transform(Thing model)
            {
                model.Rename = $"proxy:{model.Rename}";
                return model;
            }

            protected override string? Describe(Thing model) => model.Rename;
        }

        private sealed class AnotherDynamicModelProxy : TestProxy<AnotherDynamicModel>
        {
            protected override AnotherDynamicModel Transform(AnotherDynamicModel model) => new($"proxy:{model.Bar}");

            protected override string? Describe(AnotherDynamicModel model) => model.Bar;
        }

        private sealed class XmlNestedModelProxy : XmlTestProxy<XmlNestedModel>
        {
            protected override XmlNestedModel Transform(XmlNestedModel model)
            {
                model.Value = $"proxy:{model.Value}";
                return model;
            }
        }

        private sealed class XmlItemProxy : XmlTestProxy<XmlItem>
        {
            protected override XmlItem Transform(XmlItem model)
            {
                model.ItemName = $"proxy:{model.ItemName}";
                return model;
            }
        }

        private sealed class TreeXmlProxy : XmlTestProxy<Tree>
        {
            protected override Tree Transform(Tree model)
            {
                model.Id = $"proxy:{model.Id}";
                return model;
            }
        }

        // XML proxies only implement IPersistableModel<T>; reads transform the model's own XML deserialization.
        private abstract class XmlTestProxy<T> : ModelProxy<T> where T : class
        {
            public int ReadCount { get; private set; }

            public string? LastReadFormat { get; private set; }

            protected abstract T Transform(T model);

            public override T Create(BinaryData data, ModelReaderWriterOptions options)
            {
                ReadCount++;
                LastReadFormat = options.Format;
                return Transform(ModelReaderWriter.Read<T>(data, ModelReaderWriterOptions.Xml, SampleTypeSpecContext.Default)!);
            }

            public override BinaryData Write(ModelReaderWriterOptions options) => throw new NotSupportedException();

            public override string GetFormatFromOptions(ModelReaderWriterOptions options) => "X";
        }

        // Reads by delegating to the model's own serialization and transforming the result, and writes a marker
        // object describing the original model so tests can tell which serializer handled each nested model.
        private abstract class TestProxy<T> : ModelProxy<T>, IJsonModel<T> where T : class
        {
            private readonly bool _canHandle;

            protected TestProxy(bool canHandle = true)
            {
                _canHandle = canHandle;
            }

            public int ReadCount { get; private set; }

            public int WriteCount { get; private set; }

            protected abstract T Transform(T model);

            protected abstract string? Describe(T model);

            public override bool CanHandle(T model, ModelReaderWriterOptions options) => _canHandle;

            public override bool CanHandle(ReadOnlyMemory<byte> data, ModelReaderWriterOptions options) => _canHandle;

            public override bool CanHandle(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => _canHandle;

            public override T Create(BinaryData data, ModelReaderWriterOptions options)
            {
                ReadCount++;
                return Transform(ModelReaderWriter.Read<T>(data, ModelReaderWriterOptions.Json, SampleTypeSpecContext.Default)!);
            }

            void IJsonModel<T>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            {
                WriteCount++;
                writer.WriteStartObject();
                writer.WriteString("proxied", Describe((T)options.ProxiedModel!));
                writer.WriteEndObject();
            }

            T IJsonModel<T>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
                => throw new NotSupportedException();

            public override BinaryData Write(ModelReaderWriterOptions options) => throw new NotSupportedException();

            public override string GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
        }
    }
}
