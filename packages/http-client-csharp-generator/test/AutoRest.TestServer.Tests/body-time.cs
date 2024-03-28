// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using body_date;
using body_time;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class BodyTimeTest: TestServerTestBase
    {
        [Test]
        public Task BodyTimeGet() => Test(async (host, pipeline) =>
        {
            var result = await new TimeClient(ClientDiagnostics, pipeline, host).GetAsync();
            Assert.AreEqual(TimeSpan.Parse("11:34:56"), result.Value);
        });

        [Test]
        public Task BodyTimePut() => TestStatus(async (host, pipeline) =>
        {
            var response = await new TimeClient(ClientDiagnostics, pipeline, host).PutAsync(new TimeSpan(0, 8, 7, 56));
            Assert.AreEqual("Nice job posting time", response.Value);
            return response.GetRawResponse();
        });
    }
}
