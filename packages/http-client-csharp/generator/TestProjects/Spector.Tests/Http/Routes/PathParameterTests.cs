// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Threading.Tasks;
using NUnit.Framework;
using Routes;

namespace TestProjects.Spector.Tests.Http.Routes
{
    public class PathParameterTests : SpectorTestBase
    {
        [SpectorTest]
        public Task InInterface() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetInInterfaceClient().FixedAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task Fixed() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).FixedAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task PathAnnotationOnly() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient().AnnotationOnlyAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task PathExplicit() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient().ExplicitAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task PathTemplateOnly() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient().TemplateOnlyAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task ReservedAnnotation() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersReservedExpansionClient()
                .AnnotationAsync("foo/bar baz");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task ReservedTemplate() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersReservedExpansionClient()
                .TemplateAsync("foo/bar baz");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task Explicit() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient().ExplicitAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        [Ignore("https://github.com/Azure/cadl-ranch/issues/772")]
        public Task LabelExpansionExplodeArray() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersLabelExpansionClient()
                .GetPathParametersLabelExpansionExplodeClient()
                .ArrayAsync(["a, b"]);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        [Ignore("https://github.com/Azure/cadl-ranch/issues/772")]
        public Task LabelExpansionArray() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersLabelExpansionClient()
                .GetPathParametersLabelExpansionStandardClient()
                .ArrayAsync(["a", "b"]);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        [Ignore("https://github.com/Azure/cadl-ranch/issues/772")]
        public Task LabelExpansionExplodePrimitive() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersLabelExpansionClient()
                .GetPathParametersLabelExpansionExplodeClient()
                .PrimitiveAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        [Ignore("https://github.com/Azure/cadl-ranch/issues/772")]
        public Task LabelExpansionPrimitive() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersLabelExpansionClient()
                .GetPathParametersLabelExpansionExplodeClient()
                .PrimitiveAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        [Ignore("https://github.com/Azure/cadl-ranch/issues/772")]
        public Task LabelExpansionExplodeRecord() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersLabelExpansionClient()
                .GetPathParametersLabelExpansionExplodeClient()
                .RecordAsync(new Dictionary<string, int> {{"a", 1}, {"b", 2}});
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        [Ignore("https://github.com/Azure/cadl-ranch/issues/772")]
        public Task LabelExpansionRecord() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersLabelExpansionClient()
                .GetPathParametersLabelExpansionStandardClient()
                .RecordAsync(new Dictionary<string, int> {{"a", 1}, {"b", 2}});
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task SimpleExpansionPrimitive() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersSimpleExpansionClient()
                .GetPathParametersSimpleExpansionStandardClient()
                .PrimitiveAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task SimpleExpansionArray() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersSimpleExpansionClient()
                .GetPathParametersSimpleExpansionStandardClient()
                .ArrayAsync(["a", "b"]);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task SimpleExpansionRecord() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersSimpleExpansionClient()
                .GetPathParametersSimpleExpansionStandardClient()
                .RecordAsync(new Dictionary<string, int> {{"a", 1}, {"b", 2}});
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task SimpleExpansionExplodePrimitive() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersSimpleExpansionClient()
                .GetPathParametersSimpleExpansionExplodeClient()
                .PrimitiveAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task SimpleExpansionExplodeArray() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersSimpleExpansionClient()
                .GetPathParametersSimpleExpansionExplodeClient()
                .ArrayAsync(["a", "b"]);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task SimpleExpansionExplodeRecord() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersSimpleExpansionClient()
                .GetPathParametersSimpleExpansionExplodeClient()
                .RecordAsync(new Dictionary<string, int> {{"a", 1}, {"b", 2}});
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task PathExpansionPrimitive() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersPathExpansionClient()
                .GetPathParametersPathExpansionStandardClient()
                .PrimitiveAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task PathExpansionArray() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersPathExpansionClient()
                .GetPathParametersPathExpansionStandardClient()
                .ArrayAsync(["a", "b"]);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task PathExpansionRecord() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersPathExpansionClient()
                .GetPathParametersPathExpansionStandardClient()
                .RecordAsync(new Dictionary<string, int> {{"a", 1}, {"b", 2}});
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task PathExpansionExplodePrimitive() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersPathExpansionClient()
                .GetPathParametersPathExpansionExplodeClient()
                .PrimitiveAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task PathExpansionExplodeArray() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersPathExpansionClient()
                .GetPathParametersPathExpansionExplodeClient()
                .ArrayAsync(["a", "b"]);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task PathExpansionExplodeRecord() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersPathExpansionClient()
                .GetPathParametersPathExpansionExplodeClient()
                .RecordAsync(new Dictionary<string, int> {{"a", 1}, {"b", 2}});
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task MatrixExpansionPrimitive() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersMatrixExpansionClient()
                .GetPathParametersMatrixExpansionStandardClient()
                .PrimitiveAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task MatrixExpansionArray() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersMatrixExpansionClient()
                .GetPathParametersMatrixExpansionStandardClient()
                .ArrayAsync(["a", "b"]);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task MatrixExpansionRecord() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersMatrixExpansionClient()
                .GetPathParametersMatrixExpansionStandardClient()
                .RecordAsync(new Dictionary<string, int> {{"a", 1}, {"b", 2}});
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task MatrixExpansionExplodePrimitive() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersMatrixExpansionClient()
                .GetPathParametersMatrixExpansionExplodeClient()
                .PrimitiveAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task MatrixExpansionExplodeArray() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersMatrixExpansionClient()
                .GetPathParametersMatrixExpansionExplodeClient()
                .ArrayAsync(["a", "b"]);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task MatrixExpansionExplodeRecord() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersMatrixExpansionClient()
                .GetPathParametersMatrixExpansionExplodeClient()
                .RecordAsync(new Dictionary<string, int> {{"a", 1}, {"b", 2}});
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
