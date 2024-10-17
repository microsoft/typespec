// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using NUnit.Framework;
using Server.Path.Multiple;

namespace TestProjects.CadlRanch.Tests.Http.Server.Path.Multiple
{
    internal class MultipleTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task NoOperationParams() => Test(async (host) =>
        {
            var result = await new MultipleClient(host, null).NoOperationParamsAsync();
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task WithOperationPathParam() => Test(async (host) =>
        {
            var result = await new MultipleClient(host, null).WithOperationPathParamAsync("test");
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });
    }
}
