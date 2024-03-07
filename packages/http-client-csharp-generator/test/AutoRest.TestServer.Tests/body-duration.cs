// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Threading.Tasks;
using System.Xml;
using AutoRest.TestServer.Tests.Infrastructure;
using body_duration;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class BodyDurationTest: TestServerTestBase
    {
        [Test]
        public Task GetDurationInvalid() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<FormatException>(async () =>
                await new DurationClient(ClientDiagnostics, pipeline, host).GetInvalidAsync());
        });

        [Test]
        [Ignore("Test is commented out in test server scripts")]
        public Task GetDurationNegative() => Test(async (host, pipeline) => { await Task.FromException(new Exception()); });

        [Test]
        public Task GetDurationNull() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new DurationClient(ClientDiagnostics, pipeline, host).GetNullAsync());
        });

        [Test]
        public Task GetDurationPositive() => Test(async (host, pipeline) =>
        {
            var result = await new DurationClient(ClientDiagnostics, pipeline, host).GetPositiveDurationAsync();
            Assert.AreEqual(XmlConvert.ToTimeSpan("P3Y6M4DT12H30M5S"), result.Value);
        });

        [Test]
        [Ignore("Test is commented out in test server scripts")]
        public Task PutDurationNegative() => TestStatus(async (host, pipeline) => { await Task.FromException(new Exception()); return null; });

        [Test]
        public Task PutDurationPositive() => TestStatus(async (host, pipeline) =>
        {
            var value = XmlConvert.ToTimeSpan("P123DT22H14M12.011S");
            return await new DurationClient(ClientDiagnostics, pipeline, host).PutPositiveDurationAsync( value);
        });
    }
}
