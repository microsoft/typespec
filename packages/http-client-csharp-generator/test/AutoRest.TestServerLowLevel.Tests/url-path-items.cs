// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using url_LowLevel;

namespace AutoRest.TestServer.Tests
{
    public class UrlPathItemsTests : TestServerLowLevelTestBase
    {
        [Test]
        public Task UrlPathItemGetAll() => TestStatus(async (host) =>
        {
            var options = new AutoRestUrlTestServiceClientOptions()
            {
                GlobalStringQuery = "globalStringQuery"
            };
            return await new PathItemsClient(globalStringPath: "globalStringPath",
                    credential: Key,
                    endpoint: host,
                    options: options)
                .GetAllWithValuesAsync(
                    pathItemStringPath: "pathItemStringPath",
                    pathItemStringQuery: "pathItemStringQuery",
                    localStringPath: "localStringPath",
                    localStringQuery: "localStringQuery");
        });

        [Test]
        public Task UrlPathItemGetPathItemAndLocalNull() => TestStatus(async (host) =>
        {
            var options = new AutoRestUrlTestServiceClientOptions()
            {
                GlobalStringQuery = "globalStringQuery"
            };
            return await new PathItemsClient(globalStringPath: "globalStringPath",
                    credential: Key,
                    endpoint: host,
                    options: options)
                .GetLocalPathItemQueryNullAsync(
                    pathItemStringPath: "pathItemStringPath",
                    pathItemStringQuery: null,
                    localStringPath: "localStringPath",
                    localStringQuery: null);
        });


        [Test]
        public Task UrlPathItemGetGlobalNull() => TestStatus(async (host) =>
        {
            var options = new AutoRestUrlTestServiceClientOptions()
            {
                GlobalStringQuery = null
            };
            return await new PathItemsClient(globalStringPath: "globalStringPath",
                        endpoint: host,
                        credential: Key,
                        options: options)
                    .GetGlobalQueryNullAsync(
                        pathItemStringPath: "pathItemStringPath",
                        pathItemStringQuery: "pathItemStringQuery",
                        localStringPath: "localStringPath",
                        localStringQuery: "localStringQuery");
        });

        [Test]
        public Task UrlPathItemGetGlobalAndLocalNull() => TestStatus(async (host) =>
        {
            var options = new AutoRestUrlTestServiceClientOptions()
            {
                GlobalStringQuery = null
            };
            return await new PathItemsClient(
                        globalStringPath: "globalStringPath",
                        endpoint: host,
                        credential: Key,
                        options: options)
                    .GetGlobalAndLocalQueryNullAsync(
                    pathItemStringPath: "pathItemStringPath",
                    pathItemStringQuery: "pathItemStringQuery",
                    localStringPath: "localStringPath",
                    localStringQuery: null);
        });
    }
}
