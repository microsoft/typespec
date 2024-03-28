using System;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using Encode.Datetime;
using Encode.Datetime.Models;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    public class EncodeDateTimeTests : CadlRanchTestBase
    {
        [Test]
        public Task Encode_Datetime_ResponseHeader_default() => Test(async (host) =>
        {
            var response = await new DatetimeClient(host, null).GetResponseHeaderClient().DefaultAsync();
            Assert.AreEqual(204, response.Status);

            // we cannot use the extension method TryGetValue("value", out DateTimeOffset? header) here because it is in an internal static class
            Assert.IsTrue(response.Headers.TryGetValue("value", out string header));

            Assert.AreEqual("Fri, 26 Aug 2022 14:38:00 GMT", header);
        });

        [Test]
        public Task Encode_Datetime_ResponseHeader_rfc3339() => Test(async (host) =>
        {
            var response = await new DatetimeClient(host, null).GetResponseHeaderClient().Rfc3339Async();
            Assert.AreEqual(204, response.Status);

            // we cannot use the extension method TryGetValue("value", out DateTimeOffset? header) here because it is in an internal static class
            Assert.IsTrue(response.Headers.TryGetValue("value", out string header));

            Assert.AreEqual("2022-08-26T18:38:00.000Z", header);
        });

        [Test]
        public Task Encode_Datetime_ResponseHeader_rfc7231() => Test(async (host) =>
        {
            var response = await new DatetimeClient(host, null).GetResponseHeaderClient().Rfc7231Async();
            Assert.AreEqual(204, response.Status);

            // we cannot use the extension method TryGetValue("value", out DateTimeOffset? header) here because it is in an internal static class
            Assert.IsTrue(response.Headers.TryGetValue("value", out string header));

            Assert.AreEqual("Fri, 26 Aug 2022 14:38:00 GMT", header);
        });

        [Test]
        public Task Encode_Datetime_ResponseHeader_unixTimestamp() => Test(async (host) =>
        {
            var response = await new DatetimeClient(host, null).GetResponseHeaderClient().UnixTimestampAsync();
            Assert.AreEqual(204, response.Status);

            Assert.IsTrue(response.Headers.TryGetValue("value", out string header));

            Assert.AreEqual("1686566864", header);
        });

        [Test]
        public Task Encode_DateTime_Header_Default() => Test(async (host) =>
        {
            DateTimeOffset data = DateTimeOffset.Parse("Fri, 26 Aug 2022 14:38:00 GMT");
            Response response = await new DatetimeClient(host, null).GetHeaderClient().DefaultAsync(data);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_DateTime_Header_Rfc3339() => Test(async (host) =>
        {
            DateTimeOffset data = DateTimeOffset.Parse("2022-08-26T18:38:00.000Z");
            Response response = await new DatetimeClient(host, null).GetHeaderClient().Rfc3339Async(data);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_DateTime_Header_Rfc7231() => Test(async (host) =>
        {
            DateTimeOffset data = DateTimeOffset.Parse("Fri, 26 Aug 2022 14:38:00 GMT");
            Response response = await new DatetimeClient(host, null).GetHeaderClient().Rfc7231Async(data);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_DateTime_Header_unixTimestamp() => Test(async (host) =>
        {
            DateTimeOffset data = DateTimeOffset.FromUnixTimeSeconds(1686566864);
            Response response = await new DatetimeClient(host, null).GetHeaderClient().UnixTimestampAsync(data);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_DateTime_Header_unixTimestampArray() => Test(async (host) =>
        {
            DateTimeOffset data1 = DateTimeOffset.FromUnixTimeSeconds(1686566864);
            DateTimeOffset data2 = DateTimeOffset.FromUnixTimeSeconds(1686734256);
            Response response = await new DatetimeClient(host, null).GetHeaderClient().UnixTimestampArrayAsync(new[] { data1, data2 });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_DateTime_Query_Default() => Test(async (host) =>
        {
            DateTimeOffset data = DateTimeOffset.Parse("2022-08-26T18:38:00.000Z");
            Response response = await new DatetimeClient(host, null).GetQueryClient().DefaultAsync(data);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_DateTime_Query_Rfc3339() => Test(async (host) =>
        {
            DateTimeOffset data = DateTimeOffset.Parse("2022-08-26T18:38:00.000Z");
            Response response = await new DatetimeClient(host, null).GetQueryClient().Rfc3339Async(data);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_DateTime_Query_Rfc7231() => Test(async (host) =>
        {
            DateTimeOffset data = DateTimeOffset.Parse("Fri, 26 Aug 2022 14:38:00 GMT");
            Response response = await new DatetimeClient(host, null).GetQueryClient().Rfc7231Async(data);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_DateTime_Query_unixTimestamp() => Test(async (host) =>
        {
            DateTimeOffset data = DateTimeOffset.FromUnixTimeSeconds(1686566864);
            Response response = await new DatetimeClient(host, null).GetQueryClient().UnixTimestampAsync(data);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_DateTime_Query_unixTimestampArray() => Test(async (host) =>
        {
            DateTimeOffset data1 = DateTimeOffset.FromUnixTimeSeconds(1686566864);
            DateTimeOffset data2 = DateTimeOffset.FromUnixTimeSeconds(1686734256);
            Response response = await new DatetimeClient(host, null).GetQueryClient().UnixTimestampArrayAsync(new[] { data1, data2 });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_DateTime_Property_Default() => Test(async (host) =>
        {
            DateTimeOffset data = DateTimeOffset.Parse("2022-08-26T18:38:00.000Z");
            var body = new DefaultDatetimeProperty(data);
            Response<DefaultDatetimeProperty> response = await new DatetimeClient(host, null).GetPropertyClient().DefaultAsync(body);
            Assert.AreEqual(body.Value, response.Value.Value);
        });

        [Test]
        public Task Encode_DateTime_Property_Rfc3339() => Test(async (host) =>
        {
            DateTimeOffset data = DateTimeOffset.Parse("2022-08-26T18:38:00.000Z");
            var body = new Rfc3339DatetimeProperty(data);
            Response<Rfc3339DatetimeProperty> response = await new DatetimeClient(host, null).GetPropertyClient().Rfc3339Async(body);
            Assert.AreEqual(body.Value, response.Value.Value);
        });

        [Test]
        public Task Encode_DateTime_Property_Rfc7231() => Test(async (host) =>
        {
            DateTimeOffset data = DateTimeOffset.Parse("Fri, 26 Aug 2022 14:38:00 GMT");
            var body = new Rfc7231DatetimeProperty(data);
            Response<Rfc7231DatetimeProperty> response = await new DatetimeClient(host, null).GetPropertyClient().Rfc7231Async(body);
            Assert.AreEqual(body.Value, response.Value.Value);
        });


        [Test]
        public Task Encode_DateTime_Property_unixTimestamp() => Test(async (host) =>
        {
            DateTimeOffset data = DateTimeOffset.FromUnixTimeSeconds(1686566864);
            var body = new UnixTimestampDatetimeProperty(data);
            Response<UnixTimestampDatetimeProperty> response = await new DatetimeClient(host, null).GetPropertyClient().UnixTimestampAsync(body);
            Assert.AreEqual(body.Value, response.Value.Value);
        });

        [Test]
        public Task Encode_DateTime_Property_unixTimestampArray() => Test(async (host) =>
        {
            DateTimeOffset data1 = DateTimeOffset.FromUnixTimeSeconds(1686566864);
            DateTimeOffset data2 = DateTimeOffset.FromUnixTimeSeconds(1686734256);
            var body = new UnixTimestampArrayDatetimeProperty(new[] { data1, data2 });
            Response<UnixTimestampArrayDatetimeProperty> response = await new DatetimeClient(host, null).GetPropertyClient().UnixTimestampArrayAsync(body);
            Assert.AreEqual(body.Value, response.Value.Value);
        });
    }
}
