// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using body_integer;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class IntegerTest : TestServerTestBase
    {
        [Test]
        public Task GetIntegerOverflow() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<FormatException>(async () => await new IntClient(ClientDiagnostics, pipeline, host).GetOverflowInt32Async());
        });

        [Test]
        public Task GetIntegerUnderflow() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<FormatException>(async () => await new IntClient(ClientDiagnostics, pipeline, host).GetUnderflowInt32Async());
        });

        [Test]
        public Task GetIntegerInvalid() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new IntClient(ClientDiagnostics, pipeline, host).GetInvalidAsync());
        });

        [Test]
        public Task GetLongOverflow() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<FormatException>(async () => await new IntClient(ClientDiagnostics, pipeline, host).GetOverflowInt64Async());
        });

        [Test]
        public Task GetLongUnderflow() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<FormatException>(async () => await new IntClient(ClientDiagnostics, pipeline, host).GetUnderflowInt64Async());
        });

        [Test]
        public Task GetUnixTime() => TestStatus(async (host, pipeline) =>
        {
            var response = await new IntClient(ClientDiagnostics, pipeline, host).GetUnixTimeAsync();
            Assert.AreEqual(DateTimeOffset.FromUnixTimeSeconds(1460505600), response.Value);
            return response.GetRawResponse();
        });

        [Test]
        public Task GetNullUnixTime() => Test((host, pipeline) =>
        {
            // Empty response body
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new IntClient(ClientDiagnostics, pipeline, host).GetNullUnixTimeAsync());
        });

        [Test]
        public Task GetIntegerNull() => Test((host, pipeline) =>
        {
            // Empty response body
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new IntClient(ClientDiagnostics, pipeline, host).GetNullAsync());
        });

        [Test]
        public Task GetInvalidUnixTime() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(),async () => await new IntClient(ClientDiagnostics, pipeline, host).GetInvalidUnixTimeAsync());
        });

        [Test]
        public Task PutIntegerMax() => TestStatus(async (host, pipeline) => await new IntClient(ClientDiagnostics, pipeline, host).PutMax32Async( int.MaxValue));

        [Test]
        public Task PutLongMax() => TestStatus(async (host, pipeline) => await new IntClient(ClientDiagnostics, pipeline, host).PutMax64Async( long.MaxValue));

        [Test]
        public Task PutIntegerMin() => TestStatus(async (host, pipeline) => await new IntClient(ClientDiagnostics, pipeline, host).PutMin32Async( int.MinValue));

        [Test]
        public Task PutLongMin() => TestStatus(async (host, pipeline) => await new IntClient(ClientDiagnostics, pipeline, host).PutMin64Async( long.MinValue));

        [Test]
        public Task PutUnixTime() => TestStatus(async (host, pipeline) => await new IntClient(ClientDiagnostics, pipeline, host).PutUnixTimeDateAsync( DateTimeOffset.FromUnixTimeSeconds(1460505600)));
    }
}
