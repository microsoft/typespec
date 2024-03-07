// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using Azure;
using SpreadTypeSpec;
using SpreadTypeSpec.Models;

namespace CadlRanchProjects.Tests
{
    public class SpreadTypeSpecTests : CadlRanchMockApiTestBase
    {
        [Test]
        public Task Spread_SpreadModel() => Test(async (host) =>
        {
            Thing thing = new Thing("dog", 3);
            Response response = await new SpreadTypeSpecClient(host).SpreadModelAsync(thing);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Spread_SpreadAlias() => Test(async (host) =>
        {
            Response response = await new SpreadTypeSpecClient(host).SpreadAliasAsync("dog", 3);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Spread_SpreadMultiTargetAlias() => Test(async (host) =>
        {
            Response response = await new SpreadTypeSpecClient(host).SpreadMultiTargetAliasAsync("1", 1, "dog", 3);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Spread_SpreadAliasWithModel() => Test(async (host) =>
        {
            Thing thing = new Thing("dog", 3);
            Response response = await new SpreadTypeSpecClient(host).SpreadAliasWithModelAsync("1", 1, thing);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Spread_SpreadAliasWithSpreadAlias() => Test(async (host) =>
        {
            Response response = await new SpreadTypeSpecClient(host).SpreadAliasWithSpreadAliasAsync("1", 1, "dog", 3);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Spread_SpreadAliasWithoutOptionalProps() => Test(async (host) =>
        {
            Response response = await new SpreadTypeSpecClient(host).SpreadAliasWithOptionalPropsAsync("1", 1, "dog", new[] { 1, 2, 3 });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Spread_SpreadAliasWithOptionalProps() => Test(async (host) =>
        {
            Response response = await new SpreadTypeSpecClient(host).SpreadAliasWithOptionalPropsAsync("2", 1, "dog", new[] { 1, 2, 3, 4 }, "red", 3, new[] { "a", "b" });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Spread_SpreadAliasWithRequiredAndOptionalCollections() => Test(async (host) =>
        {
            Response response = await new SpreadTypeSpecClient(host).SpreadAliasWithCollectionsAsync(new[] { "a", "b" }, new[] { "c", "d" });
            Assert.AreEqual(204, response.Status);
        });
    }
}
