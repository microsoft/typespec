// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using System.Xml;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using url_LowLevel;

namespace AutoRest.TestServer.Tests
{
    public class RequestContextTests : TestServerLowLevelTestBase
    {
        [Test]
        public Task RequestThrowsByDefault () => Test(host =>
        {
            PathsClient paths = new PathsClient(host, Key, null);
            Assert.ThrowsAsync<Azure.RequestFailedException>(async () => await paths.EnumValidAsync("no color"));
        }, ignoreScenario: true);

        [Test]
        public Task RequestThrowsCanBeDisabled () => Test(host =>
        {
            PathsClient paths = new PathsClient(host, Key, null);
            Assert.DoesNotThrowAsync(async () => await paths.EnumValidAsync("no color", ErrorOptions.NoThrow));
        }, ignoreScenario: true);
    }
}
