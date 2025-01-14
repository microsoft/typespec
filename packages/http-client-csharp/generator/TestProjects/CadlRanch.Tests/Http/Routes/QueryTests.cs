// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Threading.Tasks;
using NUnit.Framework;
using Routes;

namespace TestProjects.CadlRanch.Tests.Http.Routes
{
    public class QueryParameterTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task QueryAnnotationOnly() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetQueryParametersClient().AnnotationOnlyAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task QueryExplicit() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetQueryParametersClient().ExplicitAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task QueryTemplateOnly() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetQueryParametersClient().TemplateOnlyAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task QueryExpansionPrimitive() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetQueryParametersClient()
                .GetQueryParametersQueryExpansionClient()
                .GetQueryParametersQueryExpansionStandardClient()
                .PrimitiveAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task QueryExpansionArray() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetQueryParametersClient()
                .GetQueryParametersQueryExpansionClient()
                .GetQueryParametersQueryExpansionStandardClient()
                .ArrayAsync(["a", "b"]);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task QueryExpansionRecord() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetQueryParametersClient()
                .GetQueryParametersQueryExpansionClient()
                .GetQueryParametersQueryExpansionStandardClient()
                .RecordAsync(new Dictionary<string, int> {{"a", 1}, {"b", 2}});
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/microsoft/typespec/issues/5134")]
        public Task QueryExpansionExplodePrimitive() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetQueryParametersClient()
                .GetQueryParametersQueryExpansionClient()
                .GetQueryParametersQueryExpansionExplodeClient()
                .PrimitiveAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/microsoft/typespec/issues/5134")]
        public Task QueryExpansionExplodeArray() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetQueryParametersClient()
                .GetQueryParametersQueryExpansionClient()
                .GetQueryParametersQueryExpansionExplodeClient()
                .ArrayAsync(["a", "b"]);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/microsoft/typespec/issues/5134")]
        public Task QueryExpansionExplodeRecord() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetQueryParametersClient()
                .GetQueryParametersQueryExpansionClient()
                .GetQueryParametersQueryExpansionExplodeClient()
                .RecordAsync(new Dictionary<string, int> {{"a", 1}, {"b", 2}});
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/microsoft/typespec/issues/5139")]
        public Task QueryContinuationPrimitive() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetQueryParametersClient()
                .GetQueryParametersQueryContinuationClient()
                .GetQueryParametersQueryContinuationStandardClient()
                .PrimitiveAsync("a");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/microsoft/typespec/issues/5139")]
        public Task QueryContinuationArray() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetQueryParametersClient()
                .GetQueryParametersQueryContinuationClient()
                .GetQueryParametersQueryContinuationStandardClient()
                .ArrayAsync(["a", "b"]);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/microsoft/typespec/issues/5139")]
        public Task QueryContinuationRecord() => Test(async (host) =>
        {
            var response = await new RoutesClient(host, null).GetQueryParametersClient()
                .GetQueryParametersQueryContinuationClient()
                .GetQueryParametersQueryContinuationStandardClient()
                .RecordAsync(new Dictionary<string, int> {{"a", 1}, {"b", 2}});
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
