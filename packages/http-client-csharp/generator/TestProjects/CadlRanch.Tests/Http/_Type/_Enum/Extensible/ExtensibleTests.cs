// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using _Type._Enum.Extensible;
using _Type._Enum.Extensible.Models;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http._Type._Enum.Extensible
{
    internal class ExtensibleTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task GetKnownValue() => Test(async (host) =>
        {
            var response = await new ExtensibleClient(host, null).GetStringClient().GetKnownValueAsync();
            Assert.AreEqual(DaysOfWeekExtensibleEnum.Monday, (DaysOfWeekExtensibleEnum)response);
        });

        [CadlRanchTest]
        public Task GetUnknownValue() => Test(async (host) =>
        {
            var response = await new ExtensibleClient(host, null).GetStringClient().GetUnknownValueAsync();
            Assert.AreEqual(new DaysOfWeekExtensibleEnum("Weekend"), (DaysOfWeekExtensibleEnum)response);
        });

        [CadlRanchTest]
        public Task PutKnownValue() => Test(async (host) =>
        {
            var response = await new ExtensibleClient(host, null).GetStringClient().PutKnownValueAsync(DaysOfWeekExtensibleEnum.Monday);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task PutUnknownValue() => Test(async (host) =>
        {
            var response = await new ExtensibleClient(host, null).GetStringClient().PutUnknownValueAsync(new DaysOfWeekExtensibleEnum("Weekend"));
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
