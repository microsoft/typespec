// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading.Tasks;
using NUnit.Framework;
using SpecialHeaders.ConditionalRequest;
using TestProjects.CadlRanch.Tests;

namespace CadlRanchProjects.Tests.Http.SpecialHeaders.ConditionalRequests
{
    public class ConditionalRequestHeaderTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task Special_Headers_Conditional_Request_PostIfMatch() => Test(async (host) =>
        {
            string ifMatch = new string("valid");
            var response = await new ConditionalRequestClient(host, null).PostIfMatchAsync(ifMatch);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Special_Headers_Conditional_Request_PostIfNoneMatch() => Test(async (host) =>
        {
            string ifNoneMatch = new string("invalid");
            var response = await new ConditionalRequestClient(host, null).PostIfNoneMatchAsync(ifNoneMatch);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Special_Headers_Conditional_Request_HeadIfModifiedSince() => Test(async (host) =>
        {
            DateTimeOffset ifModifiedSince = DateTimeOffset.Parse("Fri, 26 Aug 2022 14:38:00 GMT");
            var response = await new ConditionalRequestClient(host, null).HeadIfModifiedSinceAsync(ifModifiedSince);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Special_Headers_Conditional_Request_PostIfUnmodifiedSince() => Test(async (host) =>
        {
            DateTimeOffset ifUnmodifiedSince = DateTimeOffset.Parse("Fri, 26 Aug 2022 14:38:00 GMT");
            var response = await new ConditionalRequestClient(host, null).HeadIfModifiedSinceAsync(ifUnmodifiedSince);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
