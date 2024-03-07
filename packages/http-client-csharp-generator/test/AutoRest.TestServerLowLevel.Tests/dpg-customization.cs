using System;
using System.Linq;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using Azure.Core;
using Azure.Core.Tests;
using dpg_customization_LowLevel;
using dpg_customization_LowLevel.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class DpgCustomizationTest : TestServerLowLevelTestBase
    {
        [Test]
        public Task GetRawModel() => Test(async (host) =>
        {
            Response result = await new DPGClient(host, Key, null).GetModelAsync("raw", new());
            JsonData responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.AreEqual("raw", (string)responseBody["received"]);
        });

        [Test]
        public Task GetHandwrittenModel() => Test(async (host) =>
        {
            using var diagnosticListener = new ClientDiagnosticListener("dpg_customization_LowLevel", asyncLocal: true);
            var scopes = diagnosticListener.Scopes;
            CollectionAssert.IsEmpty(diagnosticListener.Scopes);

            Response<Product> result = await new DPGClient(host, Key, null).GetModelValueAsync("model");
            Assert.AreEqual(1, scopes.Count);
            Assert.AreEqual("DPGClient.GetModelValue", scopes[0].Name);
            Assert.True(scopes[0].IsCompleted);
            Assert.AreEqual("model", $"{result.Value.Received}");
        });

        [Test]
        public Task PostRawModel() => Test(async (host) =>
        {
            var value = new
            {
                hello = "world!"
            };
            Response result = await new DPGClient(host, Key, null).PostModelAsync("raw", RequestContent.Create(value));
            Assert.AreEqual(200, result.Status);
            JsonData responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.AreEqual("raw", (string)responseBody["received"]);
        });

        [Test]
        public Task PostHandwrittenModel() => Test(async (host) =>
        {
            using var diagnosticListener = new ClientDiagnosticListener("dpg_customization_LowLevel", asyncLocal: true);
            var scopes = diagnosticListener.Scopes;
            CollectionAssert.IsEmpty(diagnosticListener.Scopes);

            Input input = new Input("world!");
            Response<Product> result = await new DPGClient(host, Key, null).PostModelAsync("model", input);
            Assert.True(scopes.Count == 1);
            Assert.AreEqual(scopes[0].Name, "DPGClient.PostModel");
            Assert.True(scopes[0].IsCompleted);
            Assert.AreEqual("model", $"{result.Value.Received}");
        });

        [Test]
        public Task GetRawPages() => Test(async (host) =>
        {
            AsyncPageable<BinaryData> allPages = new DPGClient(host, Key, null).GetPagesAsync("raw", new());
            await foreach (Page<BinaryData> page in allPages.AsPages())
            {
                var firstItem = JsonData.FromBytes(page.Values.First());
                Assert.AreEqual("raw", (string)firstItem["received"]);
            }
        });

        [Test]
        public Task GetHandwrittenModelPages() => Test(async (host) =>
        {
            using var diagnosticListener = new ClientDiagnosticListener("dpg_customization_LowLevel", asyncLocal: true);
            CollectionAssert.IsEmpty(diagnosticListener.Scopes);

            AsyncPageable<Product> allPages = new DPGClient(host, Key, null).GetPageValuesAsync("model");
            var pagesCount = 0;
            await foreach (Page<Product> page in allPages.AsPages())
            {
                pagesCount++;
                Assert.AreEqual("model", $"{page.Values.First().Received}");
            }

            Assert.AreEqual(pagesCount, diagnosticListener.Scopes.Count);
        });

        [Test]
        public Task RawLRO() => Test(async (host) =>
        {
            using var diagnosticListener = new ClientDiagnosticListener("dpg_customization_LowLevel", asyncLocal: true);
            CollectionAssert.IsEmpty(diagnosticListener.Scopes);

            Operation<BinaryData> result = await new DPGClient(host, Key, null).LroAsync(WaitUntil.Started, "raw", new());
            diagnosticListener.AssertAndRemoveScope("DPGClient.Lro");
            CollectionAssert.IsEmpty(diagnosticListener.Scopes);

            await result.WaitForCompletionAsync();
            diagnosticListener.AssertAndRemoveScope("DPGClient.Lro.WaitForCompletion");
            CollectionAssert.IsEmpty(diagnosticListener.Scopes);

            JsonData responseBody = JsonData.FromBytes(result.Value.ToMemory());
            Assert.AreEqual("raw", (string)responseBody["received"]);
        });

        [Test]
        public Task HandwrittenModelLro() => Test(async (host) =>
        {
            using var diagnosticListener = new ClientDiagnosticListener("dpg_customization_LowLevel", asyncLocal: true);
            CollectionAssert.IsEmpty(diagnosticListener.Scopes);

            Operation<Product> lro = await new DPGClient(host, Key, null).LroValueAsync(WaitUntil.Started, "model");
            diagnosticListener.AssertAndRemoveScope("DPGClient.LroValue");
            CollectionAssert.IsEmpty(diagnosticListener.Scopes);

            await lro.WaitForCompletionAsync();
            diagnosticListener.AssertAndRemoveScope("DPGClient.LroValue.WaitForCompletion");
            CollectionAssert.IsEmpty(diagnosticListener.Scopes);
            Assert.AreEqual("model", $"{lro.Value.Received}");
        });

        [Test]
        public Task HandwrittenModelLro_ManualIteration() => Test(async (host) =>
        {
            using var diagnosticListener = new ClientDiagnosticListener("dpg_customization_LowLevel", asyncLocal: true);
            CollectionAssert.IsEmpty(diagnosticListener.Scopes);

            Operation<Product> lro = await new DPGClient(host, Key, null).LroValueAsync(WaitUntil.Started, "model");
            diagnosticListener.AssertAndRemoveScope("DPGClient.LroValue");
            CollectionAssert.IsEmpty(diagnosticListener.Scopes);

            while (!lro.HasCompleted)
            {
                await lro.UpdateStatusAsync();
                diagnosticListener.AssertAndRemoveScope("DPGClient.LroValue.UpdateStatus");
                CollectionAssert.IsEmpty(diagnosticListener.Scopes);
            }
        });

        [Test]
        public Task HandwrittenModelLro_WaitUntilCompleted() => Test(async (host) =>
        {
            using var diagnosticListener = new ClientDiagnosticListener("dpg_customization_LowLevel", asyncLocal: true);
            CollectionAssert.IsEmpty(diagnosticListener.Scopes);

            Operation<Product> lro = await new DPGClient(host, Key, null).LroValueAsync(WaitUntil.Completed, "model");
            diagnosticListener.AssertAndRemoveScope("DPGClient.LroValue");
            CollectionAssert.IsEmpty(diagnosticListener.Scopes);
            Assert.AreEqual("model", $"{lro.Value.Received}");
        });

        [Test]
        public Task DPGGlassBreaker() => Test(async (host) =>
        {
            var pipeline = new DPGClient(host, Key, null).Pipeline;
            HttpMessage message = pipeline.CreateMessage();
            Request request = message.Request;
            request.Method = RequestMethod.Get;
            var uri = new RawRequestUriBuilder();
            uri.Reset(host);
            uri.AppendPath("/servicedriven/glassbreaker", false);
            request.Uri = uri;
            request.Headers.Add("Accept", "application/json");
            Response result = await pipeline.ProcessMessageAsync(message, null).ConfigureAwait(false);

            Assert.AreEqual(200, result.Status);
        });
    }
}
