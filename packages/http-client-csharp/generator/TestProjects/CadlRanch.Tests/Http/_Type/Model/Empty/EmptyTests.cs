// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using _Type.Model.Empty;
using _Type.Model.Empty.Models;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http._Type.Model.Empty
{
    internal class EmptyTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task Type_Model_Empty_putEmpty() => Test(async (host) =>
        {
            var response = await new EmptyClient(host, null).PutEmptyAsync(new EmptyInput());
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Type_Model_Empty_getEmpty() => Test(async (host) =>
        {
            var response = await new EmptyClient(host, null).GetEmptyAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Type_Model_Empty_postRoundTripEmpty() => Test(async (host) =>
        {
            var response = await new EmptyClient(host, null).PostRoundTripEmptyAsync(new EmptyInputOutput());
            Assert.AreEqual(200, response.GetRawResponse().Status);
        });
    }
}
