// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using url_LowLevel;

namespace AutoRest.TestServer.Tests
{
    public class UrlQueryTests : TestServerLowLevelTestBase
    {
        [Test]
        public Task UrlQueriesBoolTrue() => TestStatus(async (host) => await new QueriesClient(host, Key, null).GetBooleanTrueAsync());

        [Test]
        public Task UrlQueriesBoolFalse() => TestStatus(async (host) => await new QueriesClient(host, Key, null).GetBooleanFalseAsync());

        [Test]
        public Task UrlQueriesBoolNull() => TestStatus(async (host) => await new QueriesClient(host, Key, null).GetBooleanNullAsync( null));

        [Test]
        public Task UrlQueriesIntPositive() => TestStatus(async (host) => await new QueriesClient(host, Key, null).GetIntOneMillionAsync());

        [Test]
        public Task UrlQueriesIntNegative() => TestStatus(async (host) => await new QueriesClient(host, Key, null).GetIntNegativeOneMillionAsync());

        [Test]
        public Task UrlQueriesIntNull() => TestStatus(async (host) => await new QueriesClient(host, Key, null).GetIntNullAsync( null));

        [Test]
        public Task UrlQueriesLongPositive() => TestStatus(async (host) => await new QueriesClient(host, Key, null).GetTenBillionAsync());

        [Test]
        public Task UrlQueriesLongNegative() => TestStatus(async (host) => await new QueriesClient(host, Key, null).GetNegativeTenBillionAsync());

        [Test]
        public Task UrlQueriesLongNull() => TestStatus(async (host) => await new QueriesClient(host, Key, null).GetLongNullAsync( null));

        [Test]
        public Task UrlQueriesFloatPositive() => TestStatus(async (host) => await new QueriesClient(host, Key, null).FloatScientificPositiveAsync());

        [Test]
        public Task UrlQueriesFloatNegative() => TestStatus(async (host) => await new QueriesClient(host, Key, null).FloatScientificNegativeAsync());

        [Test]
        public Task UrlQueriesFloatNull() => TestStatus(async (host) => await new QueriesClient(host, Key, null).FloatNullAsync( null));

        [Test]
        public Task UrlQueriesDoublePositive() => TestStatus(async (host) => await new QueriesClient(host, Key, null).DoubleDecimalPositiveAsync());

        [Test]
        public Task UrlQueriesDoubleNegative() => TestStatus(async (host) => await new QueriesClient(host, Key, null).DoubleDecimalNegativeAsync());

        [Test]
        public Task UrlQueriesDoubleNull() => TestStatus(async (host) => await new QueriesClient(host, Key, null).DoubleNullAsync( null));

        [Test]
        public Task UrlQueriesStringUnicode() => TestStatus(async (host) => await new QueriesClient(host, Key, null).StringUnicodeAsync());

        [Test]
        public Task UrlQueriesStringUrlEncoded() => TestStatus(async (host) => await new QueriesClient(host, Key, null).StringUrlEncodedAsync());

        [Test]
        public Task UrlQueriesStringEmpty() => TestStatus(async (host) => await new QueriesClient(host, Key, null).StringEmptyAsync());

        [Test]
        public Task UrlQueriesStringNull() => TestStatus(async (host) => await new QueriesClient(host, Key, null).StringNullAsync( null));

        [Test]
        public Task UrlQueriesEnumValid() => TestStatus(async (host) => await new QueriesClient(host, Key, null).EnumValidAsync( "green color"));

        [Test]
        public Task UrlQueriesEnumNull() => TestStatus(async (host) => await new QueriesClient(host, Key, null).EnumNullAsync( null));

        [Test]
        public Task UrlQueriesByteMultiByte() => TestStatus(async (host) => await new QueriesClient(host, Key, null).ByteMultiByteAsync( BinaryData.FromBytes(TestConstants.ByteArray)));

        [Test]
        public Task UrlQueriesByteNull() => TestStatus(async (host) => await new QueriesClient(host, Key, null).ByteNullAsync( null));

        [Test]
        public Task UrlQueriesByteEmpty() => TestStatus(async (host) => await new QueriesClient(host, Key, null).ByteEmptyAsync());

        [Test]
        public Task UrlQueriesDateValid() => TestStatus(async (host) => await new QueriesClient(host, Key, null).DateValidAsync());

        [Test]
        public Task UrlQueriesDateNull() => TestStatus(async (host) => await new QueriesClient(host, Key, null).DateNullAsync( null));

        [Test]
        public Task UrlQueriesDateTimeValid() => TestStatus(async (host) => await new QueriesClient(host, Key, null).DateTimeValidAsync());

        [Test]
        public Task UrlQueriesDateTimeNull() => TestStatus(async (host) => await new QueriesClient(host, Key, null).DateTimeNullAsync( null));

        [Test]
        public Task UrlQueriesArrayCsvValid() => TestStatus(async (host) => await new QueriesClient(host, Key, null).ArrayStringCsvValidAsync( new[] {"ArrayQuery1", "begin!*'();:@ &=+$,/?#[]end", "", ""}));

        [Test]
        public Task UrlQueriesArrayNoCollectionFormatValid() => TestStatus(async (host) => await new QueriesClient(host, Key, null).ArrayStringNoCollectionFormatEmptyAsync( new[] {"hello", "nihao", "bonjour"}));

        [Test]
        public Task UrlQueriesArrayCsvNull() => TestStatus(async (host) => await new QueriesClient(host, Key, null).ArrayStringCsvNullAsync( null));

        [Test]
        public Task UrlQueriesArrayCsvEmpty() => TestStatus(async (host) => await new QueriesClient(host, Key, null).ArrayStringCsvEmptyAsync(Enumerable.Empty<string>()));

        [Test]
        public Task UrlQueriesArraySsvValid() => TestStatus(async (host) => await new QueriesClient(host, Key, null).ArrayStringSsvValidAsync( new[] { "ArrayQuery1", "begin!*'();:@ &=+$,/?#[]end", "", "" }));

        [Test]
        public Task UrlQueriesArrayTsvValid() => TestStatus(async (host) => await new QueriesClient(host, Key, null).ArrayStringTsvValidAsync( new[] { "ArrayQuery1", "begin!*'();:@ &=+$,/?#[]end", "", "" }));

        [Test]
        public Task UrlQueriesArrayPipesValid() => TestStatus(async (host) => await new QueriesClient(host, Key, null).ArrayStringPipesValidAsync( new[] { "ArrayQuery1", "begin!*'();:@ &=+$,/?#[]end", "", "" }));

        [Test]
        public Task UrlQueriesArrayMultiNull() => TestStatus(async (host) => await new url_multi_collectionFormat_LowLevel.QueriesClient(host, Key, null).ArrayStringMultiNullAsync( null));

        [Test]
        [Ignore("https://github.com/Azure/autorest.csharp/issues/1161")]
        public Task UrlQueriesArrayMultiEmpty() => TestStatus(async (host) => await new url_multi_collectionFormat_LowLevel.QueriesClient(host, Key, null).ArrayStringMultiEmptyAsync(Enumerable.Empty<string>()));

        [Test]
        public Task UrlQueriesArrayMultiValid() => TestStatus(async (host) => await new url_multi_collectionFormat_LowLevel.QueriesClient(host, Key, null).ArrayStringMultiValidAsync( new[] { "ArrayQuery1", "begin!*'();:@ &=+$,/?#[]end", "", "" }));
    }
}
