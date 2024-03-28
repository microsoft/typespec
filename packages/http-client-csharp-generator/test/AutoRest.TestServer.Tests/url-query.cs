// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using url;
using url.Models;

namespace AutoRest.TestServer.Tests
{
    public class UrlQueryTests : TestServerTestBase
    {
        [Test]
        public Task UrlQueriesBoolTrue() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).GetBooleanTrueAsync());

        [Test]
        public Task UrlQueriesBoolFalse() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).GetBooleanFalseAsync());

        [Test]
        public Task UrlQueriesBoolNull() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).GetBooleanNullAsync( null));

        [Test]
        public Task UrlQueriesIntPositive() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).GetIntOneMillionAsync());

        [Test]
        public Task UrlQueriesIntNegative() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).GetIntNegativeOneMillionAsync());

        [Test]
        public Task UrlQueriesIntNull() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).GetIntNullAsync( null));

        [Test]
        public Task UrlQueriesLongPositive() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).GetTenBillionAsync());

        [Test]
        public Task UrlQueriesLongNegative() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).GetNegativeTenBillionAsync());

        [Test]
        public Task UrlQueriesLongNull() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).GetLongNullAsync( null));

        [Test]
        public Task UrlQueriesFloatPositive() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).FloatScientificPositiveAsync());

        [Test]
        public Task UrlQueriesFloatNegative() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).FloatScientificNegativeAsync());

        [Test]
        public Task UrlQueriesFloatNull() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).FloatNullAsync( null));

        [Test]
        public Task UrlQueriesDoublePositive() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).DoubleDecimalPositiveAsync());

        [Test]
        public Task UrlQueriesDoubleNegative() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).DoubleDecimalNegativeAsync());

        [Test]
        public Task UrlQueriesDoubleNull() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).DoubleNullAsync( null));

        [Test]
        public Task UrlQueriesStringUnicode() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).StringUnicodeAsync());

        [Test]
        public Task UrlQueriesStringUrlEncoded() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).StringUrlEncodedAsync());

        [Test]
        public Task UrlQueriesStringEmpty() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).StringEmptyAsync());

        [Test]
        public Task UrlQueriesStringNull() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).StringNullAsync( null));

        [Test]
        public Task UrlQueriesEnumValid() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).EnumValidAsync( UriColor.GreenColor));

        [Test]
        public Task UrlQueriesEnumNull() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).EnumNullAsync( null));

        [Test]
        public Task UrlQueriesByteMultiByte() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).ByteMultiByteAsync( TestConstants.ByteArray));

        [Test]
        public Task UrlQueriesByteNull() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).ByteNullAsync( null));

        [Test]
        public Task UrlQueriesByteEmpty() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).ByteEmptyAsync());

        [Test]
        public Task UrlQueriesDateValid() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).DateValidAsync());

        [Test]
        public Task UrlQueriesDateNull() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).DateNullAsync( null));

        [Test]
        public Task UrlQueriesDateTimeValid() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).DateTimeValidAsync());

        [Test]
        public Task UrlQueriesDateTimeNull() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).DateTimeNullAsync( null));

        [Test]
        public Task UrlQueriesArrayCsvValid() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).ArrayStringCsvValidAsync( new[] {"ArrayQuery1", "begin!*'();:@ &=+$,/?#[]end", "", ""}));

        [Test]
        public Task UrlQueriesArrayNoCollectionFormatValid() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).ArrayStringNoCollectionFormatEmptyAsync( new[] {"hello", "nihao", "bonjour"}));

        [Test]
        public Task UrlQueriesArrayCsvNull() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).ArrayStringCsvNullAsync( null));

        [Test]
        public Task UrlQueriesArrayCsvEmpty() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).ArrayStringCsvEmptyAsync(Enumerable.Empty<string>()));

        [Test]
        public Task UrlQueriesArraySsvValid() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).ArrayStringSsvValidAsync( new[] { "ArrayQuery1", "begin!*'();:@ &=+$,/?#[]end", "", "" }));

        [Test]
        public Task UrlQueriesArrayTsvValid() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).ArrayStringTsvValidAsync( new[] { "ArrayQuery1", "begin!*'();:@ &=+$,/?#[]end", "", "" }));

        [Test]
        public Task UrlQueriesArrayPipesValid() => TestStatus(async (host, pipeline) => await new QueriesClient(ClientDiagnostics, pipeline, host).ArrayStringPipesValidAsync( new[] { "ArrayQuery1", "begin!*'();:@ &=+$,/?#[]end", "", "" }));

        [Test]
        public Task UrlQueriesArrayMultiNull() => TestStatus(async (host, pipeline) => await new url_multi_collectionFormat.QueriesClient(ClientDiagnostics, pipeline, host).ArrayStringMultiNullAsync( null));

        [Test]
        public Task UrlQueriesArrayMultiEmpty() => TestStatus(async (host, pipeline) => await new url_multi_collectionFormat.QueriesClient(ClientDiagnostics, pipeline, host).ArrayStringMultiEmptyAsync(Enumerable.Empty<string>()));

        [Test]
        public Task UrlQueriesArrayMultiValid() => TestStatus(async (host, pipeline) => await new url_multi_collectionFormat.QueriesClient(ClientDiagnostics, pipeline, host).ArrayStringMultiValidAsync( new[] { "ArrayQuery1", "begin!*'();:@ &=+$,/?#[]end", "", "" }));

        [Test]
        public async Task UrlQueriesLongMaxValue()
        {
            string queryValue = null;
            using var testServer = new InProcTestServer(async content =>
            {
                queryValue = content.Request.Query["longQuery"];
                await content.Response.Body.FlushAsync();
            });

            var client = new QueriesClient(ClientDiagnostics, InProcTestBase.HttpPipeline, testServer.Address);
            await client.GetLongNullAsync(long.MaxValue);

            Assert.AreEqual("9223372036854775807", queryValue);
        }
    }
}
