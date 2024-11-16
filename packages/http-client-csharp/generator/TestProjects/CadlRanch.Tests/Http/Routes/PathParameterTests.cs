// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Threading.Tasks;
using NUnit.Framework;
using Routes;

namespace TestProjects.CadlRanch.Tests.Http.Routes
{
    public class PathParameterTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task InInterface() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetInInterfaceClient().FixedAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Fixed() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).FixedAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task PathAnnotationOnly() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient().AnnotationOnlyAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task PathExplicit() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient().ExplicitAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task PathTemplateOnly() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient().TemplateOnlyAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task ReservedAnnotation() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersReservedExpansionClient()
                .AnnotationAsync("foo/bar baz");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task ReservedTemplate() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersReservedExpansionClient()
                .TemplateAsync("foo/bar baz");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/Azure/cadl-ranch/issues/772")]
        public Task Explicit() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient().ExplicitAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/Azure/cadl-ranch/issues/772")]
        public Task LabelExpansionExplodeArray() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersLabelExpansionClient()
                .GetPathParametersLabelExpansionExplodeClient()
                .ArrayAsync(["a, b"]);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/Azure/cadl-ranch/issues/772")]
        public Task LabelExpansionArray() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersLabelExpansionClient()
                .GetPathParametersLabelExpansionStandardClient()
                .ArrayAsync(["a", "b"]);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/Azure/cadl-ranch/issues/772")]
        public Task LabelExpansionExplodePrimitive() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersLabelExpansionClient()
                .GetPathParametersLabelExpansionExplodeClient()
                .PrimitiveAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/Azure/cadl-ranch/issues/772")]
        public Task LabelExpansionPrimitive() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersLabelExpansionClient()
                .GetPathParametersLabelExpansionExplodeClient()
                .PrimitiveAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/Azure/cadl-ranch/issues/772")]
        public Task LabelExpansionExplodeRecord() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersLabelExpansionClient()
                .GetPathParametersLabelExpansionExplodeClient()
                .RecordAsync(new Dictionary<string, int> {{"a", 1}, {"b", 2}});
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/Azure/cadl-ranch/issues/772")]
        public Task LabelExpansionRecord() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetPathParametersClient()
                .GetPathParametersLabelExpansionClient()
                .GetPathParametersLabelExpansionStandardClient()
                .RecordAsync(new Dictionary<string, int> {{"a", 1}, {"b", 2}});
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
