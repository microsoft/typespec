// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class custom_baseURL : TestServerLowLevelTestBase
    {
        [Test]
        public Task CustomBaseUri() => TestStatus(async (host) =>
            await new custom_baseUrl_LowLevel.PathsClient(host.ToString().Replace("http://", string.Empty), Key, null).GetEmptyAsync( string.Empty));

        [Test]
        public Task CustomBaseUriMoreOptions() => TestStatus(async (host) =>
            await new custom_baseUrl_more_options_LowLevel.PathsClient(dnsSuffix:host.ToString(), "test12", Key, null).GetEmptyAsync( string.Empty, string.Empty, "key1",  "v1"));

        [Test]
        public void ThrowsIfHostIsNull()
        {
            Assert.Throws<ArgumentNullException>(() => new custom_baseUrl_LowLevel.PathsClient("host", null));
        }
    }
}
