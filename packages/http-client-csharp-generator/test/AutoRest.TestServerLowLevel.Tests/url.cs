// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using url_LowLevel;

namespace AutoRest.TestServer.Tests
{
    public class UrlTests : TestServerLowLevelTestBase
    {
        [Test]
        public Task UrlPathsStringEmpty() => TestStatus(async (host) => await new PathsClient(host, Key, null).StringEmptyAsync());

        [Test]
        public Task UrlPathsEnumValid() => TestStatus(async (host) => await new PathsClient(host, Key, null).EnumValidAsync( "green color"));

        [Test]
        public Task UrlPathsStringUrlEncoded() => TestStatus(async (host) => await new PathsClient(host, Key, null).StringUrlEncodedAsync());

        [Test]
        public Task UrlPathsStringUrlNonEncoded() => TestStatus(async (host) => await new PathsClient(host, Key, null).StringUrlNonEncodedAsync());

        // LLC - BUG - This test is failing?
        public Task UrlStringNullAsync() => Test(async (host) =>
        {
            var result = await new PathsClient(host, Key, null).StringNullAsync(null);
            Assert.Zero (result.Content.ToMemory().Length);
        }, ignoreScenario: true);

        [Test]
        public Task UrlPathsStringUnicode() => TestStatus(async (host) => await new PathsClient(host, Key, null).StringUnicodeAsync());

        [Test]
        public Task UrlPathsArrayCSVInPath() => TestStatus(async (host) => await new PathsClient(host, Key, null).ArrayCsvInPathAsync( new[] { "ArrayPath1", "begin!*'();:@ &=+$,/?#[]end", "", "" }));

        [Test]
        public Task UrlPathsStringBase64Url() => TestStatus(async (host) => await new PathsClient(host, Key, null).Base64UrlAsync( BinaryData.FromBytes(Encoding.UTF8.GetBytes("lorem"))));

        [Test]
        public Task UrlPathsByteEmpty() => TestStatus(async (host) => await new PathsClient(host, Key, null).ByteEmptyAsync());

        [Test]
        public Task UrlPathsByteMultiByte() => TestStatus(async (host) => await new PathsClient(host, Key, null).ByteMultiByteAsync( BinaryData.FromBytes(TestConstants.ByteArray)));

        [Test]
        public void UrlByteNullAsync()
        {
            Assert.ThrowsAsync<ArgumentNullException>(async () => await new PathsClient(null, null, null).ByteNullAsync(null));
        }

        [Test]
        public Task UrlPathsDateValid() => TestStatus(async (host) => await new PathsClient(host, Key, null).DateValidAsync());

        [Test]
        public Task UrlPathsDateTimeValid() => TestStatus(async (host) => await new PathsClient(host, Key, null).DateTimeValidAsync());

        [Test]
        public Task UrlPathsLongPositive() => TestStatus(async (host) => await new PathsClient(host, Key, null).GetTenBillionAsync());

        [Test]
        public Task UrlPathsIntUnixTime() => TestStatus(async (host) => await new PathsClient(host, Key, null).UnixTimeUrlAsync( DateTimeOffset.FromUnixTimeSeconds(1460505600L).UtcDateTime));

        [Test]
        public Task UrlPathsIntNegative() => TestStatus(async (host) => await new PathsClient(host, Key, null).GetIntNegativeOneMillionAsync());

        [Test]
        public Task UrlPathsIntPositive() => TestStatus(async (host) => await new PathsClient(host, Key, null).GetIntOneMillionAsync());

        [Test]
        public Task UrlPathsBoolTrue() => TestStatus(async (host) => await new PathsClient(host, Key, null).GetBooleanTrueAsync());

        [Test]
        public Task UrlPathsBoolFalse() => TestStatus(async (host) => await new PathsClient(host, Key, null).GetBooleanFalseAsync());

        [Test]
        public Task UrlPathsLongNegative() => TestStatus(async (host) => await new PathsClient(host, Key, null).GetNegativeTenBillionAsync());

        [Test]
        public Task UrlPathsFloatPositive() => TestStatus(async (host) => await new PathsClient(host, Key, null).FloatScientificPositiveAsync());

        [Test]
        public Task UrlPathsFloatNegative() => TestStatus(async (host) => await new PathsClient(host, Key, null).FloatScientificNegativeAsync());

        [Test]
        public Task UrlPathsDoubleNegative() => TestStatus(async (host) => await new PathsClient(host, Key, null).DoubleDecimalNegativeAsync());

        [Test]
        public Task UrlPathsDoublePositive() => TestStatus(async (host) => await new PathsClient(host, Key, null).DoubleDecimalPositiveAsync());
    }
}
