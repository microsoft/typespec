using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using Azure.Core;
using Encode.Duration;
using Encode.Duration.Models;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    public class EncodeDurationTests : CadlRanchTestBase
    {
        [Test]
        public Task Encode_Duration_Header_Default() => Test(async (host) =>
        {
            var input = new TimeSpan(40, 0, 0, 0);
            Response response = await new DurationClient(host, null).GetHeaderClient().DefaultAsync(input);
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Encode_Duration_Header_FloatSeconds() => Test(async (host) =>
        {
            var input = TimeSpan.FromSeconds(35.621);
            var response = await new DurationClient(host, null).GetHeaderClient().FloatSecondsAsync(input);
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Encode_Duration_Header_Int32Seconds() => Test(async (host) =>
        {
            var input = TimeSpan.FromSeconds(36);
            var response = await new DurationClient(host, null).GetHeaderClient().Int32SecondsAsync(input);
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Encode_Duration_Header_ISO8601() => Test(async (host) =>
        {
            var input = new TimeSpan(40, 0, 0, 0);
            var response = await new DurationClient(host, null).GetHeaderClient().Iso8601Async(input);
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Encode_Duration_Header_ISO8601Array() => Test(async (host) =>
        {
            var data1 = new TimeSpan(40, 0, 0, 0);
            var data2 = new TimeSpan(50, 0, 0, 0);
            var response = await new DurationClient(host, null).GetHeaderClient().Iso8601ArrayAsync(new[] { data1, data2 });
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Encode_Duration_Property_Default() => Test(async (host) =>
        {
            var data = new
            {
                value = "P40D",
            };
            Response response = await new DurationClient(host, null).GetPropertyClient().DefaultAsync(RequestContent.Create(data));
            JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
            Assert.AreEqual("P40D", result.GetProperty("value").ToString());
        });

        [Test]
        public Task Encode_Duration_Property_Default_Convenience() => Test(async (host) =>
        {
            var body = new DefaultDurationProperty(new TimeSpan(40, 0, 0, 0));
            Response<DefaultDurationProperty> response = await new DurationClient(host, null).GetPropertyClient().DefaultAsync(body);
            Assert.AreEqual(body.Value, response.Value.Value);
        });

        [Test]
        public Task Encode_Duration_Property_ISO8601() => Test(async (host) =>
        {
            var data = new
            {
                value = "P40D",
            };
            Response response = await new DurationClient(host, null).GetPropertyClient().Iso8601Async(RequestContent.Create(data));
            JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
            Assert.AreEqual("P40D", result.GetProperty("value").ToString());
        });

        [Test]
        public Task Encode_Duration_Property_ISO8601_Convenience() => Test(async (host) =>
        {
            var body = new ISO8601DurationProperty(new TimeSpan(40, 0, 0, 0));
            Response<ISO8601DurationProperty> response = await new DurationClient(host, null).GetPropertyClient().Iso8601Async(body);
            Assert.AreEqual(body.Value, response.Value.Value);
        });

        [Test]
        public Task Encode_Duration_Property_Int32Seconds() => Test(async (host) =>
        {
            var data = new
            {
                value = 36,
            };
            Response response = await new DurationClient(host, null).GetPropertyClient().Int32SecondsAsync(RequestContent.Create(data));
            JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
            Assert.AreEqual("36", result.GetProperty("value").ToString());
        });

        [Test]
        public Task Encode_Duration_Property_Int32Seconds_Convenience() => Test(async (host) =>
        {
            var body = new Int32SecondsDurationProperty(TimeSpan.FromSeconds(36));
            Response<Int32SecondsDurationProperty> response = await new DurationClient(host, null).GetPropertyClient().Int32SecondsAsync(body);
            Assert.AreEqual(body.Value, response.Value.Value);
        });

        [Test]
        public Task Encode_Duration_Property_FloatSeconds() => Test(async (host) =>
        {
            var data = new
            {
                value = 35.621,
            };
            Response response = await new DurationClient(host, null).GetPropertyClient().FloatSecondsAsync(RequestContent.Create(data));
            JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
            Assert.AreEqual("35.621", result.GetProperty("value").ToString());
        });

        [Test]
        public Task Encode_Duration_Property_FloatSeconds_Convenience() => Test(async (host) =>
        {
            var body = new FloatSecondsDurationProperty(TimeSpan.FromSeconds(35.621));
            Response<FloatSecondsDurationProperty> response = await new DurationClient(host, null).GetPropertyClient().FloatSecondsAsync(body);
            Assert.AreEqual(body.Value, response.Value.Value);
        });

        [Test]
        public Task Encode_Duration_Property_FloatSecondsArray() => Test(async (host) =>
        {
            var data = new
            {
                value = new[] { 35.621, 46.781 }
            };
            Response response = await new DurationClient(host, null).GetPropertyClient().FloatSecondsArrayAsync(RequestContent.Create(data));
            JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
            Assert.AreEqual("35.621", result.GetProperty("value")[0].ToString());
            Assert.AreEqual("46.781", result.GetProperty("value")[1].ToString());
        });

        [Test]
        public Task Encode_Duration_Property_FloatSecondsArray_Convenience() => Test(async (host) =>
        {
            var data1 = TimeSpan.FromSeconds(35.621);
            var data2 = TimeSpan.FromSeconds(46.781);
            var body = new FloatSecondsDurationArrayProperty(new[] { data1, data2});
            Response<FloatSecondsDurationArrayProperty> response = await new DurationClient(host, null).GetPropertyClient().FloatSecondsArrayAsync(body);
            Assert.AreEqual(body.Value, response.Value.Value);
        });

        [Test]
        public Task Encode_Duration_Query_Default() => Test(async (host) =>
        {
            var input = new TimeSpan(40, 0, 0, 0);
            Response response = await new DurationClient(host, null).GetQueryClient().DefaultAsync(input);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_Duration_Query_ISO8601() => Test(async (host) =>
        {
            var input = new TimeSpan(40, 0, 0, 0);
            var response = await new DurationClient(host, null).GetQueryClient().Iso8601Async(input);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_Duration_Query_Int32Seconds() => Test(async (host) =>
        {
            var input = TimeSpan.FromSeconds(36);
            var response = await new DurationClient(host, null).GetQueryClient().Int32SecondsAsync(input);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_Duration_Query_FloatSeconds() => Test(async (host) =>
        {
            var input = TimeSpan.FromSeconds(35.621);
            var response = await new DurationClient(host, null).GetQueryClient().FloatSecondsAsync(input);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Encode_Duration_Query_Int32SecondsArray() => Test(async (host) =>
        {
            var data1 = TimeSpan.FromSeconds(36);
            var data2 = TimeSpan.FromSeconds(47);
            var response = await new DurationClient(host, null).GetQueryClient().Int32SecondsArrayAsync(new[] { data1, data2 });
            Assert.AreEqual(204, response.Status);
        });
    }
}
