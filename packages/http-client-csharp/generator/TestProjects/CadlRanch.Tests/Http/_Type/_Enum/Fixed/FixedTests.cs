// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Threading.Tasks;
using _Type._Enum.Fixed;
using _Type._Enum.Fixed.Models;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http._Type._Enum.Fixed
{
    internal class FixedTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task GetKnownValue() => Test(async (host) =>
        {
            var response = await new FixedClient(host, null).GetStringClient().GetKnownValueAsync();
            Assert.AreEqual(DaysOfWeekEnum.Monday, response.Value);
        });

        [CadlRanchTest]
        public Task PutKnownValue() => Test(async (host) =>
        {
            var response = await new FixedClient(host, null).GetStringClient().PutKnownValueAsync(DaysOfWeekEnum.Monday);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task PutUnknownValue() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<ClientResultException>(() => new FixedClient(host, null).GetStringClient().PutUnknownValueAsync(BinaryContent.Create(BinaryData.FromObjectAsJson("Weekend")), null));
            Assert.IsNotNull(exception?.GetRawResponse());
            Assert.AreEqual(500, exception?.GetRawResponse()?.Status);
            return Task.CompletedTask;
        });
    }
}
