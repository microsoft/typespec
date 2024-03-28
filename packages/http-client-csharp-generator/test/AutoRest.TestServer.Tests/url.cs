// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using url;
using url.Models;

namespace AutoRest.TestServer.Tests
{
    public class UrlTests : TestServerTestBase
    {
        [Test]
        public Task UrlPathsStringEmpty() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).StringEmptyAsync());

        [Test]
        public Task UrlPathsEnumValid() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).EnumValidAsync( UriColor.GreenColor));

        [Test]
        public Task UrlPathsStringUrlEncoded() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).StringUrlEncodedAsync());

        [Test]
        public Task UrlPathsStringUrlNonEncoded() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).StringUrlNonEncodedAsync());

        [Test]
        public Task UrlStringNullAsync() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<ArgumentNullException>(async () => await new PathsClient(ClientDiagnostics, pipeline, host).StringNullAsync(null));
        }, ignoreScenario: true);

        [Test]
        public Task UrlPathsStringUnicode() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).StringUnicodeAsync());

        [Test]
        public Task UrlPathsArrayCSVInPath() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).ArrayCsvInPathAsync( new[] { "ArrayPath1", "begin!*'();:@ &=+$,/?#[]end", "", "" }));

        [Test]
        public Task UrlPathsStringBase64Url() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).Base64UrlAsync( Encoding.UTF8.GetBytes("lorem")));

        [Test]
        public Task UrlPathsByteEmpty() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).ByteEmptyAsync());

        [Test]
        public Task UrlPathsByteMultiByte() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).ByteMultiByteAsync( TestConstants.ByteArray));

        [Test]
        public void UrlByteNullAsync()
        {
            Assert.ThrowsAsync<ArgumentNullException>(async () => await new PathsClient(ClientDiagnostics, null, null).ByteNullAsync(null));
        }

        [Test]
        [Ignore("Might not apply")]
        public Task UrlUrlDateNullAsync() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).DateNullAsync(new DateTime()));

        [Test]
        [Ignore("Might not apply")]
        public Task UrlEnumNullAsync() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).EnumNullAsync(new UriColor()));

        [Test]
        [Ignore("Might not apply")]
        public Task UrlDateTimeNullAsync() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).DateTimeNullAsync(new DateTime()));

        [Test]
        public Task UrlPathsDateValid() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).DateValidAsync());

        [Test]
        public Task UrlPathsDateTimeValid() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).DateTimeValidAsync());

        [Test]
        public Task UrlPathsLongPositive() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).GetTenBillionAsync());

        [Test]
        public Task UrlPathsIntUnixTime() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).UnixTimeUrlAsync( DateTimeOffset.FromUnixTimeSeconds(1460505600L).UtcDateTime));

        [Test]
        public Task UrlPathsIntNegative() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).GetIntNegativeOneMillionAsync());

        [Test]
        public Task UrlPathsIntPositive() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).GetIntOneMillionAsync());

        [Test]
        public Task UrlPathsBoolTrue() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).GetBooleanTrueAsync());

        [Test]
        public Task UrlPathsBoolFalse() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).GetBooleanFalseAsync());

        [Test]
        public Task UrlPathsLongNegative() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).GetNegativeTenBillionAsync());

        [Test]
        public Task UrlPathsFloatPositive() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).FloatScientificPositiveAsync());

        [Test]
        public Task UrlPathsFloatNegative() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).FloatScientificNegativeAsync());

        [Test]
        public Task UrlPathsDoubleNegative() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).DoubleDecimalNegativeAsync());

        [Test]
        public Task UrlPathsDoublePositive() => TestStatus(async (host, pipeline) => await new PathsClient(ClientDiagnostics, pipeline, host).DoubleDecimalPositiveAsync());


        [Test]
        public void EnumGeneratedNonExtesibleWithoutModelAsString()
        {
            // modelAsString
            Assert.True(typeof(UriColor).IsEnum);
        }
    }
}
