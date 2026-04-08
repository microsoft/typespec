// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Threading.Tasks;
using NUnit.Framework;
using Parameters.Query;

namespace TestProjects.Spector.Tests.Http.Parameters.Query
{
    public class QueryTests : SpectorTestBase
    {
        [SpectorTest]
        public Task Constant() => Test(async (host) =>
        {
            ClientResult result = await new QueryClient(host, null).GetConstantClient().PostAsync();
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });
    }
}
