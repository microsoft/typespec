// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using Azure;
using System.Collections.Generic;
using Parameters.CollectionFormat;

namespace CadlRanchProjects.Tests
{
    public class ParametersCollectionFormatTests : CadlRanchTestBase
    {
        [Test]
        public Task Parameters_CollectionFormat_Query_multi() => Test(async (host) =>
        {
            List<string> colors = new List<string>() { "blue", "red", "green" };
            Response response = await new CollectionFormatClient(host, null).GetQueryClient().MultiAsync(colors, new RequestContext());
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Parameters_CollectionFormat_Query_csv() => Test(async (host) =>
        {
            List<string> colors = new List<string>() { "blue", "red", "green" };
            Response response = await new CollectionFormatClient(host, null).GetQueryClient().CsvAsync(colors, new RequestContext());
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Parameters_CollectionFormat_Query_ssv() => Test(async (host) =>
        {
            List<string> colors = new List<string>() { "blue", "red", "green" };
            Response response = await new CollectionFormatClient(host, null).GetQueryClient().SsvAsync(colors, new RequestContext());
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Parameters_CollectionFormat_Query_tsv() => Test(async (host) =>
        {
            List<string> colors = new List<string>() { "blue", "red", "green" };
            Response response = await new CollectionFormatClient(host, null).GetQueryClient().TsvAsync(colors, new RequestContext());
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Parameters_CollectionFormat_Query_pipes() => Test(async (host) =>
        {
            List<string> colors = new List<string>() { "blue", "red", "green" };
            Response response = await new CollectionFormatClient(host, null).GetQueryClient().PipesAsync(colors, new RequestContext());
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Parameters_CollectionFormat_Header_csv() => Test(async (host) =>
        {
            List<string> colors = new List<string>() { "blue", "red", "green" };
            Response response = await new CollectionFormatClient(host, null).GetHeaderClient().CsvAsync(colors, new RequestContext());
            Assert.AreEqual(204, response.Status);
        });
    }
}
