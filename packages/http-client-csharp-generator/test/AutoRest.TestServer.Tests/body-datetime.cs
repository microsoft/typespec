// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Globalization;
using System.Text.Json;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using body_datetime;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class BodyDateTimeTest: TestServerTestBase
    {
        [Test]
        public Task GetDateTimeInvalid() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<FormatException>(async () =>
                await new DatetimeClient(ClientDiagnostics, pipeline, host).GetInvalidAsync());
        });

        [Test]
        [Ignore("The value of DatTimeOffset in the test server is incorrect, should fix the test server first")]
        public Task GetDateTimeMinLocalNegativeOffset() => Test(async (host, pipeline) =>
        {
            var result = await new DatetimeClient(ClientDiagnostics, pipeline, host).GetLocalNegativeOffsetMinDateTimeAsync();
            Assert.AreEqual(DateTimeOffset.Parse("0001-01-01T00:00:00Z"), result.Value);
        });

        [Test]
        public Task GetDateTimeMinLocalPositiveOffset() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<FormatException>(async () => await new DatetimeClient(ClientDiagnostics, pipeline, host).GetLocalPositiveOffsetMinDateTimeAsync());
        });

        [Test]
        public Task GetDateTimeMinUtc() => Test(async (host, pipeline) =>
        {
            var result = await new DatetimeClient(ClientDiagnostics, pipeline, host).GetUtcMinDateTimeAsync();
            Assert.AreEqual(DateTimeOffset.Parse("0001-01-01T00:00:00Z"), result.Value);
        });

        [Test]
        public Task GetDateTimeNull() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new DatetimeClient(ClientDiagnostics, pipeline, host).GetNullAsync());
        });

        [Test]
        public Task GetDateTimeOverflow() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<FormatException>(async () => await new DatetimeClient(ClientDiagnostics, pipeline, host).GetOverflowAsync());
        });

        [Test]
        public Task GetDateTimeUnderflow() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<FormatException>(async () => await new DatetimeClient(ClientDiagnostics, pipeline, host).GetUnderflowAsync());
        });

        [Test]
        public Task GetDateTimeMaxUtc7MSUppercase() => Test(async (host, pipeline) =>
        {
            var result = await new DatetimeClient(ClientDiagnostics, pipeline, host).GetUtcUppercaseMaxDateTime7DigitsAsync();
            Assert.AreEqual(DateTimeOffset.Parse("9999-12-31T23:59:59.9999999Z"), result.Value);
        });

        [Test]
        public Task PutDateTimeMaxUtc7MS() => TestStatus(async (host, pipeline) =>
        {
            var value = DateTimeOffset.Parse("9999-12-31T23:59:59.9999999Z");
            return await new DatetimeClient(ClientDiagnostics, pipeline, host).PutUtcMaxDateTime7DigitsAsync( value);
        });

        [Test]
        [Ignore("Optional, required value is out of range of supported")]
        public Task PutDateTimeMaxLocalNegativeOffset() => TestStatus(async (host, pipeline) =>
        {
            var value = DateTimeOffset.Parse("9999-12-31T23:59:59.9999999-14:00");
            return await new DatetimeClient(ClientDiagnostics, pipeline, host).PutLocalNegativeOffsetMaxDateTimeAsync( value);
        });

        [Test]
        public Task PutDateTimeMaxLocalPositiveOffset() => TestStatus(async (host, pipeline) =>
        {
            var value = DateTimeOffset.Parse("9999-12-31T09:59:59.9999999Z");
            return await new DatetimeClient(ClientDiagnostics, pipeline, host).PutLocalPositiveOffsetMaxDateTimeAsync( value);
        });

        [Test]
        public Task PutDateTimeMaxUtc() => TestStatus(async (host, pipeline) =>
        {
            var value = DateTimeOffset.Parse("9999-12-31T23:59:59.9999999Z");
            return await new DatetimeClient(ClientDiagnostics, pipeline, host).PutUtcMaxDateTimeAsync( value);
        });

        [Test]
        public Task PutDateTimeMinLocalNegativeOffset() => TestStatus(async (host, pipeline) =>
        {
            var value = DateTimeOffset.Parse("0001-01-01T00:00:00-14:00");
            return await new DatetimeClient(ClientDiagnostics, pipeline, host).PutLocalNegativeOffsetMinDateTimeAsync( value);
        });

        [Test]
        [Ignore("Value outside the DateTimeOffset range")]
        public Task PutDateTimeMinLocalPositiveOffset() => TestStatus(async (host, pipeline) =>
        {
            var value = DateTimeOffset.Parse("0001-01-01T00:00:00+14:00");
            return await new DatetimeClient(ClientDiagnostics, pipeline, host).PutLocalPositiveOffsetMinDateTimeAsync( value);
        });

        [Test]
        public Task PutDateTimeMinUtc() => TestStatus(async (host, pipeline) =>
        {
            var value = DateTimeOffset.Parse("0001-01-01T00:00:00Z");
            return await new DatetimeClient(ClientDiagnostics, pipeline, host).PutUtcMinDateTimeAsync( value);
        });

        [Test]
        public Task GetDateTimeMinLocalNoOffset() => Test(async (host, pipeline) =>
        {
            var response = await new DatetimeClient(ClientDiagnostics, pipeline, host).GetLocalNoOffsetMinDateTimeAsync();
            Assert.AreEqual(DateTimeOffset.Parse("0001-01-01T00:00:00Z"), response.Value);
        });

        [Test]
        public Task GetDateTimeMaxLocalNegativeOffsetLowercase() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<FormatException>(), async () => await new DatetimeClient(ClientDiagnostics, pipeline, host).GetLocalNegativeOffsetLowercaseMaxDateTimeAsync());
        });

        [Test]
        public Task GetDateTimeMaxLocalNegativeOffsetUppercase() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<FormatException>(), async () => await new DatetimeClient(ClientDiagnostics, pipeline, host).GetLocalNegativeOffsetUppercaseMaxDateTimeAsync());
        });

        [Test]
        public Task GetDateTimeMaxLocalPositiveOffsetLowercase() => Test(async (host, pipeline) =>
        {
            var response = await new DatetimeClient(ClientDiagnostics, pipeline, host).GetLocalPositiveOffsetLowercaseMaxDateTimeAsync();
            Assert.AreEqual(DateTimeOffset.Parse("9999-12-31T23:59:59.999+14:00"), response.Value);
        });

        [Test]
        public Task GetDateTimeMaxLocalPositiveOffsetUppercase() => Test(async (host, pipeline) =>
        {
            var response = await new DatetimeClient(ClientDiagnostics, pipeline, host).GetLocalPositiveOffsetUppercaseMaxDateTimeAsync();
            Assert.AreEqual(DateTimeOffset.Parse("9999-12-31T23:59:59.999+14:00"), response.Value);
        });

        [Test]
        public Task GetDateTimeMaxUtcLowercase() => Test(async (host, pipeline) =>
        {
            var response = await new DatetimeClient(ClientDiagnostics, pipeline, host).GetUtcLowercaseMaxDateTimeAsync();
            Assert.AreEqual(DateTimeOffset.Parse("9999-12-31 23:59:59.999+00:00"), response.Value);
        });

        [Test]
        public Task GetDateTimeMaxUtcUppercase() => Test(async (host, pipeline) =>
        {
            var response = await new DatetimeClient(ClientDiagnostics, pipeline, host).GetUtcUppercaseMaxDateTimeAsync();
            Assert.AreEqual(DateTimeOffset.Parse("9999-12-31 23:59:59.999+00:00"), response.Value);
        });
    }
}
