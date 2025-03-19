// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Threading.Tasks;
using NUnit.Framework;
using Parameters.CollectionFormat;

namespace TestProjects.CadlRanch.Tests.Http.Parameters.CollectionFormat
{
    public class CollectionFormatParametersTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task QueryMulti() => Test(async (host) =>
        {
            List<string> colors = ["blue", "red", "green"];
            var response = await new CollectionFormatClient(host, null).GetQueryClient().MultiAsync(colors);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task QueryMultiAsArray() => Test(async (host) =>
        {
            string[] colors = ["blue", "red", "green"];
            var response = await new CollectionFormatClient(host, null).GetQueryClient().MultiAsync(colors);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task QueryCsv() => Test(async (host) =>
        {
            List<string> colors = ["blue", "red", "green"];
            var response = await new CollectionFormatClient(host, null).GetQueryClient().CsvAsync(colors);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task QuerySsv() => Test(async (host) =>
        {
            List<string> colors = ["blue", "red", "green"];
            var response = await new CollectionFormatClient(host, null).GetQueryClient().SsvAsync(colors);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task QueryTsv() => Test(async (host) =>
        {
            List<string> colors = ["blue", "red", "green"];
            var response = await new CollectionFormatClient(host, null).GetQueryClient().TsvAsync(colors);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task QueryPipes() => Test(async (host) =>
        {
            List<string> colors = ["blue", "red", "green"];
            var response = await new CollectionFormatClient(host, null).GetQueryClient().PipesAsync(colors);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task HeaderCsv() => Test(async (host) =>
        {
            List<string> colors = ["blue", "red", "green"];
            var response = await new CollectionFormatClient(host, null).GetHeaderClient().CsvAsync(colors);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
