// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using body_number;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class NumberTest : TestServerTestBase
    {
        [Test]
        public Task PutFloatBigScientificNotation() => TestStatus(async (host, pipeline) => await new NumberClient(ClientDiagnostics, pipeline, host).PutBigFloatAsync(3.402823e+20f));

        [Test]
        public Task PutFloatSmallScientificNotation() => TestStatus(async (host, pipeline) => await new NumberClient(ClientDiagnostics, pipeline, host).PutSmallFloatAsync(3.402823e-20f));

        [Test]
        public Task PutDoubleSmallScientificNotation() => TestStatus(async (host, pipeline) => await new NumberClient(ClientDiagnostics, pipeline, host).PutSmallDoubleAsync(2.5976931e-101d));

        [Test]
        public Task PutDoubleBigScientificNotation() => TestStatus(async (host, pipeline) => await new NumberClient(ClientDiagnostics, pipeline, host).PutBigDoubleAsync(2.5976931e+101d));

        [Test]
        public Task PutDecimalBigPositiveDecimal() => TestStatus(async (host, pipeline) => await new NumberClient(ClientDiagnostics, pipeline, host).PutBigDecimalPositiveDecimalAsync());

        [Test]
        public Task PutDecimalBig() => Test((host, pipeline) =>
        {
            // Value 2.5976931e+101m is out of range of C# decimal
            var value = decimal.MaxValue;
            Assert.ThrowsAsync<RequestFailedException>(async () => await new NumberClient(ClientDiagnostics, pipeline, host).PutBigDecimalAsync(value));
        }, ignoreScenario: true);

        [Test]
        public Task PutDecimalBigNegativeDecimal() => TestStatus(async (host, pipeline) => await new NumberClient(ClientDiagnostics, pipeline, host).PutBigDecimalNegativeDecimalAsync());

        [Test]
        public Task PutDecimalSmall() => Test((host, pipeline) =>
        {
            // Value 2.5976931e-101m is out of range of C# decimal
            var value = decimal.MinValue;
            Assert.ThrowsAsync<RequestFailedException>(async () => await new NumberClient(ClientDiagnostics, pipeline, host).PutSmallDecimalAsync(value));
        }, ignoreScenario: true);

        [Test]
        public Task PutDoubleBigNegativeDecimal() => TestStatus(async (host, pipeline) => await new NumberClient(ClientDiagnostics, pipeline, host).PutBigDoubleNegativeDecimalAsync());

        [Test]
        public Task PutDoubleBigPositiveDecimal() => TestStatus(async (host, pipeline) => await new NumberClient(ClientDiagnostics, pipeline, host).PutBigDoublePositiveDecimalAsync());

        [Test]
        public Task GetDecimalInvalid() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new NumberClient(ClientDiagnostics, pipeline, host).GetInvalidDecimalAsync());
        });

        [Test]
        public Task GetDoubleInvalid() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new NumberClient(ClientDiagnostics, pipeline, host).GetInvalidDoubleAsync());
        });

        [Test]
        public Task GetFloatInvalid() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new NumberClient(ClientDiagnostics, pipeline, host).GetInvalidFloatAsync());
        });

        [Test]
        public Task GetDecimalBig() => Test((host, pipeline) =>
        {
            // Value 2.5976931e+101m is out of range of C# decimal
            Assert.ThrowsAsync<FormatException>(async () => await new NumberClient(ClientDiagnostics, pipeline, host).GetBigDecimalAsync());
        });

        [Test]
        public Task GetDecimalBigNegativeDecimal() => TestStatus(async (host, pipeline) =>
        {
            var response = await new NumberClient(ClientDiagnostics, pipeline, host).GetBigDecimalNegativeDecimalAsync();
            Assert.AreEqual(-99999999.99m, response.Value);
            return response.GetRawResponse();
        });

        [Test]
        public Task GetDecimalBigPositiveDecimal() => TestStatus(async (host, pipeline) =>
        {
            var response = await new NumberClient(ClientDiagnostics, pipeline, host).GetBigDecimalPositiveDecimalAsync();
            Assert.AreEqual(99999999.99m, response.Value);
            return response.GetRawResponse();
        });

        [Test]
        public Task GetDecimalSmall() => Test(async (host, pipeline) =>
        {
            // Value 2.5976931e-101m is out of range of C# decimal
            // This call should normally fail with a FormatException, but there is an issue in the runtime
            // https://github.com/dotnet/runtime/issues/35586
            var response = await new NumberClient(ClientDiagnostics, pipeline, host).GetSmallDecimalAsync();
            Assert.AreEqual(0m, response.Value);
        });

        [Test]
        public Task GetDoubleBigScientificNotation() => TestStatus(async (host, pipeline) =>
        {
            var response = await new NumberClient(ClientDiagnostics, pipeline, host).GetBigDoubleAsync();
            Assert.AreEqual(2.5976931E+101d, response.Value);
            return response.GetRawResponse();
        });

        [Test]
        public Task GetDoubleBigNegativeDecimal() => TestStatus(async (host, pipeline) =>
        {
            var response = await new NumberClient(ClientDiagnostics, pipeline, host).GetBigDoubleNegativeDecimalAsync();
            Assert.AreEqual(-99999999.989999995d, response.Value);
            return response.GetRawResponse();
        });

        [Test]
        public Task GetDoubleBigPositiveDecimal() => TestStatus(async (host, pipeline) =>
        {
            var response = await new NumberClient(ClientDiagnostics, pipeline, host).GetBigDoublePositiveDecimalAsync();
            Assert.AreEqual(99999999.989999995d, response.Value);
            return response.GetRawResponse();
        });

        [Test]
        public Task GetDoubleSmallScientificNotation() => TestStatus(async (host, pipeline) =>
        {
            var response = await new NumberClient(ClientDiagnostics, pipeline, host).GetSmallDoubleAsync();
            Assert.AreEqual(2.5976931000000001E-101d, response.Value);
            return response.GetRawResponse();
        });

        [Test]
        public Task GetFloatBigScientificNotation() => TestStatus(async (host, pipeline) =>
        {
            var response = await new NumberClient(ClientDiagnostics, pipeline, host).GetBigFloatAsync();
            Assert.AreEqual(3.40282312E+20f, response.Value);
            return response.GetRawResponse();
        });

        [Test]
        public Task GetFloatSmallScientificNotation() => TestStatus(async (host, pipeline) =>
        {
            var response = await new NumberClient(ClientDiagnostics, pipeline, host).GetSmallFloatAsync();
            Assert.AreEqual(3.4028229999999997E-20d, response.Value);
            return response.GetRawResponse();
        });

        [Test]
        public Task GetNumberNull() => Test((host, pipeline) =>
        {
            // Empty response body
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new NumberClient(ClientDiagnostics, pipeline, host).GetNullAsync());
        });
    }
}
