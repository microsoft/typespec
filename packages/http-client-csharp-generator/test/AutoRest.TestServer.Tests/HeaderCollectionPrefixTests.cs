// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HeaderCollectionPrefix;
using Microsoft.AspNetCore.Http;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class HeaderCollectionPrefixTests: InProcTestBase
    {
        [Test]
        public async Task CanSendAndReceivePrefixedHeaders()
        {
            Dictionary<string, string> requestHeaders = null;
            using var testServer = new InProcTestServer(async content =>
            {
                requestHeaders = content.Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString());
                content.Response.Headers.Add("x-ms-meta-a", "a");
                content.Response.Headers.Add("x-ms-meta-b", "b");
                content.Response.Headers.Add("x-ms-meta-c", "c");
                await content.Response.Body.FlushAsync();
            });

            var client = new HeaderCollectionPrefixRestClient(ClientDiagnostics, HttpPipeline, testServer.Address);

            var responseHeaders = await client.OperationAsync(new Dictionary<string, string>()
            {
                {"a", "a"},
                {"b", "b"},
                {"c", "c"},
            });

            Assert.True(requestHeaders.TryGetValue("x-ms-meta-a", out var value) && value == "a");
            Assert.True(requestHeaders.TryGetValue("x-ms-meta-b", out value) && value == "b");
            Assert.True(requestHeaders.TryGetValue("x-ms-meta-c", out value) && value == "c");

            Assert.True(responseHeaders.Headers.Metadata.TryGetValue("a", out value) && value == "a");
            Assert.True(responseHeaders.Headers.Metadata.TryGetValue("A", out value) && value == "a");
            Assert.True(responseHeaders.Headers.Metadata.TryGetValue("b", out value) && value == "b");
            Assert.True(responseHeaders.Headers.Metadata.TryGetValue("c", out value) && value == "c");

            Assert.False(responseHeaders.Headers.Metadata.IsReadOnly);
        }
    }
}
