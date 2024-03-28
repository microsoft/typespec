// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Globalization;
using System.Text.Json;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using body_date;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class BodyDateTest: TestServerTestBase
    {
        [Test]
        public Task GetDateInvalid() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<FormatException>(async () =>
                await new DateClient(ClientDiagnostics, pipeline, host).GetInvalidDateAsync());
        });

        [Test]
        public Task GetDateMax() => Test(async (host, pipeline) =>
        {
            var result = await new DateClient(ClientDiagnostics, pipeline, host).GetMaxDateAsync();
            Assert.AreEqual(DateTimeOffset.Parse("9999-12-31", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal), result.Value);
        });

        [Test]
        public Task GetDateMin() => Test(async (host, pipeline) =>
        {
            var result = await new DateClient(ClientDiagnostics, pipeline, host).GetMinDateAsync();
            Assert.AreEqual(DateTimeOffset.MinValue, result.Value);
        });

        [Test]
        public Task GetDateNull() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new DateClient(ClientDiagnostics, pipeline, host).GetNullAsync());
        });

        [Test]
        public Task GetDateOverflow() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<FormatException>(async () =>
                await new DateClient(ClientDiagnostics, pipeline, host).GetOverflowDateAsync());
        });

        [Test]
        public Task GetDateUnderflow() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<FormatException>(async () =>
                await new DateClient(ClientDiagnostics, pipeline, host).GetUnderflowDateAsync());
        });

        [Test]
        public Task PutDateMax() => TestStatus(async (host, pipeline) =>
        {
            return await new DateClient(ClientDiagnostics, pipeline, host).PutMaxDateAsync(DateTimeOffset.MaxValue);
        });

        [Test]
        public Task PutDateMin() => TestStatus(async (host, pipeline) =>
        {
            return await new DateClient(ClientDiagnostics, pipeline, host).PutMinDateAsync(DateTimeOffset.MinValue);
        });
    }
}
