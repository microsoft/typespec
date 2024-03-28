// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using url;

namespace AutoRest.TestServer.Tests
{
    public class UrlPathItemsTests : TestServerTestBase
    {
        [Test]
        public Task UrlPathItemGetAll() => TestStatus(async (host, pipeline) =>
            await new PathItemsClient(ClientDiagnostics,
                    pipeline,
                    globalStringPath: "globalStringPath",
                    globalStringQuery: "globalStringQuery",
                    endpoint: host)
                .GetAllWithValuesAsync(
                    pathItemStringPath: "pathItemStringPath",
                    pathItemStringQuery: "pathItemStringQuery",
                    localStringPath: "localStringPath",
                    localStringQuery: "localStringQuery"));

        [Test]
        public Task UrlPathItemGetPathItemAndLocalNull() => TestStatus(async (host, pipeline) =>
            await new PathItemsClient(
                    ClientDiagnostics,
                    pipeline,
                    globalStringPath: "globalStringPath",
                    globalStringQuery: "globalStringQuery",
                    endpoint: host)
                .GetLocalPathItemQueryNullAsync(
                    pathItemStringPath: "pathItemStringPath",
                    pathItemStringQuery: null,
                    localStringPath: "localStringPath",
                    localStringQuery: null));

        [Test]
        public Task UrlPathItemGetGlobalNull() => TestStatus(async (host, pipeline) =>
            await new PathItemsClient(
                    ClientDiagnostics,
                    pipeline,
                    globalStringPath: "globalStringPath",
                    host,
                    globalStringQuery: null)
                .GetGlobalQueryNullAsync(
                    pathItemStringPath: "pathItemStringPath",
                    pathItemStringQuery: "pathItemStringQuery",
                    localStringPath: "localStringPath",
                    localStringQuery: "localStringQuery"));

        [Test]
        public Task UrlPathItemGetGlobalAndLocalNull() => TestStatus(async (host, pipeline) =>
            await new PathItemsClient(
                    ClientDiagnostics,
                    pipeline,
                    globalStringPath: "globalStringPath",
                    host,
                    globalStringQuery: null)
                .GetGlobalAndLocalQueryNullAsync(
                pathItemStringPath: "pathItemStringPath",
                pathItemStringQuery: "pathItemStringQuery",
                localStringPath: "localStringPath",
                localStringQuery: null));
    }
}
