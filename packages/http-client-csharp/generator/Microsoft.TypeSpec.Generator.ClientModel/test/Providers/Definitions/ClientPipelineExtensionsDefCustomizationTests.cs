// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Moq;
using Moq.Protected;
using NUnit.Framework;
using SampleTypeSpec;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions
{
    public class ClientPipelineExtensionsDefCustomizationTests
    {
        [Test]
        public async Task HeadResponseAsBoolProcessesStatus([Values(204, 404)] int status, [Values] bool isAsync, [Values] bool isProtocol)
        {
            using var httpClient = CreateHttpClient(status);
            var client = CreateHeadClient(httpClient);
            var result = isAsync
                ? isProtocol ? await client.HeadAsBooleanAsync("id", new RequestOptions()) : await client.HeadAsBooleanAsync("id")
                : isProtocol ? client.HeadAsBoolean("id", new RequestOptions()) : client.HeadAsBoolean("id");

            Assert.AreEqual(status != 404, result.Value);
            Assert.AreEqual(status, result.GetRawResponse().Status);
            Assert.IsFalse(result.GetRawResponse().IsError);
        }

        [Test]
        public void HeadResponseAsBoolThrowsForUnexpectedStatusCodes([Values(200, 299, 400, 401, 403, 412, 500)] int status, [Values] bool isAsync, [Values] bool isProtocol)
        {
            using var httpClient = CreateHttpClient(status);
            var client = CreateHeadClient(httpClient);
            var exception = Assert.ThrowsAsync<ClientResultException>(async () =>
            {
                if (isAsync)
                {
                    _ = isProtocol ? await client.HeadAsBooleanAsync("id", new RequestOptions()) : await client.HeadAsBooleanAsync("id");
                }
                else
                {
                    _ = isProtocol ? client.HeadAsBoolean("id", new RequestOptions()) : client.HeadAsBoolean("id");
                }
            });

            Assert.AreEqual(status, exception!.Status);
        }

        [Test]
        public async Task HeadResponseAsBoolPreservesNoThrowErrors([Values(200, 299, 403, 412, 500)] int status, [Values] bool isAsync)
        {
            using var httpClient = CreateHttpClient(status);
            var client = CreateHeadClient(httpClient);
            var options = new RequestOptions { ErrorOptions = ClientErrorBehaviors.NoThrow };
            var result = isAsync
                ? await client.HeadAsBooleanAsync("id", options)
                : client.HeadAsBoolean("id", options);

            Assert.AreEqual(status, result.GetRawResponse().Status);
            Assert.IsTrue(result.GetRawResponse().IsError);
            Assert.Throws<ClientResultException>(() => _ = result.Value);
        }

        private static SampleTypeSpecClient CreateHeadClient(HttpClient httpClient)
            => new(new Uri("https://example.com"), new ApiKeyCredential("test-key"), new SampleTypeSpecClientOptions
            {
                Transport = new HttpClientPipelineTransport(httpClient),
                RetryPolicy = new ClientRetryPolicy(0)
            });

        private static HttpClient CreateHttpClient(int status)
        {
            var handler = new Mock<HttpMessageHandler>();
            handler.Protected().Setup<HttpResponseMessage>("Send",
                ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
                .Returns(() => new HttpResponseMessage((HttpStatusCode)status));
            handler.Protected().Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(() => new HttpResponseMessage((HttpStatusCode)status));
            return new HttpClient(handler.Object);
        }

        [TestCase("ProcessHeadAsBoolMessage")]
        [TestCase("ProcessHeadAsBoolMessageAsync")]
        public void HeadResponseAsBoolOnlyMaps404ToFalse(string methodName)
        {
            MockHelpers.LoadMockGenerator();
            var method = new ClientPipelineExtensionsDefinition().Methods.Single(m => m.Signature.Name == methodName);
            var tree = CSharpSyntaxTree.ParseText(method.BodyStatements!.ToDisplayString());
            var statement = tree.GetRoot().DescendantNodes().OfType<SwitchStatementSyntax>().Single();
            var label = statement.Sections[1].Labels.Single();

            Assert.IsInstanceOf<CaseSwitchLabelSyntax>(label);
            Assert.AreEqual("404", ((CaseSwitchLabelSyntax)label).Value.ToString());
        }

        [Test]
        public async Task CanReplaceMethod()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Find the extension definition
            var definition = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientPipelineExtensionsDefinition);
            Assert.IsNotNull(definition);

            // The definitions should not have the custom method
            var definitionMethods = definition!.Methods;
            Assert.AreEqual(3, definitionMethods.Count);
            Assert.IsFalse(definitionMethods.Any(m => m.Signature.Name == "ProcessMessageAsync"));

            // The custom code view should contain the method
            var customCodeView = definition.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            var customMethods = customCodeView!.Methods;
            Assert.AreEqual(1, customMethods.Count);
            Assert.AreEqual("ProcessMessageAsync", customMethods[0].Signature.Name);
        }
    }
}
