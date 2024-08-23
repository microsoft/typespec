using System;
using System.ClientModel;
using System.Text.Json;
using System.Threading.Tasks;
using Encode.Duration;
using Encode.Duration.Models;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http.Encode.Duration
{
    public class EncodeDurationTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task Encode_Duration_Header_Default() => Test(async (host) =>
        {
            var input = new TimeSpan(40, 0, 0, 0);
            ClientResult result = await new DurationClient(host, null).GetHeaderClient().DefaultAsync(input);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Header_Float64Seconds() => Test(async (host) =>
        {
            var input = TimeSpan.FromSeconds(35.625);
            var result = await new DurationClient(host, null).GetHeaderClient().Float64SecondsAsync(input);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Header_FloatSeconds() => Test(async (host) =>
        {
            var input = TimeSpan.FromSeconds(35.625);
            var result = await new DurationClient(host, null).GetHeaderClient().FloatSecondsAsync(input);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Header_Int32Seconds() => Test(async (host) =>
        {
            var input = TimeSpan.FromSeconds(36);
            var result = await new DurationClient(host, null).GetHeaderClient().Int32SecondsAsync(input);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Header_ISO8601() => Test(async (host) =>
        {
            var input = new TimeSpan(40, 0, 0, 0);
            var result = await new DurationClient(host, null).GetHeaderClient().Iso8601Async(input);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Header_ISO8601Array() => Test(async (host) =>
        {
            var data1 = new TimeSpan(40, 0, 0, 0);
            var data2 = new TimeSpan(50, 0, 0, 0);
            var result = await new DurationClient(host, null).GetHeaderClient().Iso8601ArrayAsync(new[] { data1, data2 });
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Property_Default() => Test(async (host) =>
        {
            var data = new
            {
                value = "P40D",
            };
            BinaryData binaryData = new BinaryData(data);
            ClientResult result = await new DurationClient(host, null).GetPropertyClient().DefaultAsync(BinaryContent.Create(binaryData), null);
            JsonElement jsonResult = JsonDocument.Parse(result.GetRawResponse().ContentStream!).RootElement;
            Assert.AreEqual("P40D", jsonResult.GetProperty("value").ToString());
        });

        [CadlRanchTest]
        public Task Encode_Duration_Property_Default_Convenience() => Test(async (host) =>
        {
            var body = new DefaultDurationProperty(new TimeSpan(40, 0, 0, 0));
            ClientResult<DefaultDurationProperty> result = await new DurationClient(host, null).GetPropertyClient().DefaultAsync(body);
            Assert.AreEqual(body.Value, result.Value.Value);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Property_ISO8601() => Test(async (host) =>
        {
            var data = new
            {
                value = "P40D",
            };
            BinaryData binaryData = new BinaryData(data);
            ClientResult result = await new DurationClient(host, null).GetPropertyClient().Iso8601Async(BinaryContent.Create(binaryData), null);
            JsonElement jsonResult = JsonDocument.Parse(result.GetRawResponse().ContentStream!).RootElement;
            Assert.AreEqual("P40D", jsonResult.GetProperty("value").ToString());
        });

        [CadlRanchTest]
        public Task Encode_Duration_Property_ISO8601_Convenience() => Test(async (host) =>
        {
            var body = new ISO8601DurationProperty(new TimeSpan(40, 0, 0, 0));
            ClientResult<ISO8601DurationProperty> result = await new DurationClient(host, null).GetPropertyClient().Iso8601Async(body);
            Assert.AreEqual(body.Value, result.Value.Value);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Property_Int32Seconds() => Test(async (host) =>
        {
            var data = new
            {
                value = 36,
            };
            BinaryData binaryData = new BinaryData(data);
            ClientResult result = await new DurationClient(host, null).GetPropertyClient().Int32SecondsAsync(BinaryContent.Create(binaryData), null);
            JsonElement jsonResult = JsonDocument.Parse(result.GetRawResponse().ContentStream!).RootElement;
            Assert.AreEqual("36", jsonResult.GetProperty("value").ToString());
        });

        [CadlRanchTest]
        public Task Encode_Duration_Property_Int32Seconds_Convenience() => Test(async (host) =>
        {
            var body = new Int32SecondsDurationProperty(TimeSpan.FromSeconds(36));
            ClientResult<Int32SecondsDurationProperty> result = await new DurationClient(host, null).GetPropertyClient().Int32SecondsAsync(body);
            Assert.AreEqual(body.Value, result.Value.Value);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Property_FloatSeconds() => Test(async (host) =>
        {
            var data = new
            {
                value = 35.625,
            };
            BinaryData binaryData = new BinaryData(data);
            ClientResult result = await new DurationClient(host, null).GetPropertyClient().FloatSecondsAsync(BinaryContent.Create(binaryData), null);
            JsonElement jsonResult = JsonDocument.Parse(result.GetRawResponse().ContentStream!).RootElement;
            Assert.AreEqual("35.625", jsonResult.GetProperty("value").ToString());
        });

        [CadlRanchTest]
        public Task Encode_Duration_Property_FloatSeconds_Convenience() => Test(async (host) =>
        {
            var body = new FloatSecondsDurationProperty(TimeSpan.FromSeconds(35.625));
            ClientResult<FloatSecondsDurationProperty> result = await new DurationClient(host, null).GetPropertyClient().FloatSecondsAsync(body);
            Assert.AreEqual(body.Value, result.Value.Value);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Property_Float64Seconds() => Test(async (host) =>
        {
            var data = new
            {
                value = 35.625,
            };
            BinaryData binaryData = new BinaryData(data);
            ClientResult result = await new DurationClient(host, null).GetPropertyClient().FloatSecondsAsync(BinaryContent.Create(binaryData), null);
            JsonElement jsonResult = JsonDocument.Parse(result.GetRawResponse().ContentStream!).RootElement;
            Assert.AreEqual("35.625", jsonResult.GetProperty("value").ToString());
        });

        [CadlRanchTest]
        public Task Encode_Duration_Property_Float64Seconds_Convenience() => Test(async (host) =>
        {
            var body = new Float64SecondsDurationProperty(TimeSpan.FromSeconds(35.625));
            ClientResult<Float64SecondsDurationProperty> result = await new DurationClient(host, null).GetPropertyClient().Float64SecondsAsync(body);
            Assert.AreEqual(body.Value, result.Value.Value);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Property_FloatSecondsArray() => Test(async (host) =>
        {
            var data = new
            {
                value = new[] { 35.625, 46.75 }
            };
            BinaryData binaryData = new BinaryData(data);
            ClientResult result = await new DurationClient(host, null).GetPropertyClient().FloatSecondsArrayAsync(BinaryContent.Create(binaryData), null);
            JsonElement jsonResult = JsonDocument.Parse(result.GetRawResponse().ContentStream!).RootElement;
            Assert.AreEqual("35.625", jsonResult.GetProperty("value")[0].ToString());
            Assert.AreEqual("46.75", jsonResult.GetProperty("value")[1].ToString());
        });

        [CadlRanchTest]
        public Task Encode_Duration_Property_FloatSecondsArray_Convenience() => Test(async (host) =>
        {
            var data1 = TimeSpan.FromSeconds(35.625);
            var data2 = TimeSpan.FromSeconds(46.75);
            var body = new FloatSecondsDurationArrayProperty(new[] { data1, data2});
            ClientResult<FloatSecondsDurationArrayProperty> result = await new DurationClient(host, null).GetPropertyClient().FloatSecondsArrayAsync(body);
            Assert.AreEqual(body.Value, result.Value.Value);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Query_Default() => Test(async (host) =>
        {
            var input = new TimeSpan(40, 0, 0, 0);
            ClientResult result = await new DurationClient(host, null).GetQueryClient().DefaultAsync(input);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Query_ISO8601() => Test(async (host) =>
        {
            var input = new TimeSpan(40, 0, 0, 0);
            var result = await new DurationClient(host, null).GetQueryClient().Iso8601Async(input);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Query_Int32Seconds() => Test(async (host) =>
        {
            var input = TimeSpan.FromSeconds(36);
            var result = await new DurationClient(host, null).GetQueryClient().Int32SecondsAsync(input);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Query_FloatSeconds() => Test(async (host) =>
        {
            var input = TimeSpan.FromSeconds(35.625);
            var result = await new DurationClient(host, null).GetQueryClient().FloatSecondsAsync(input);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Query_Float64Seconds() => Test(async (host) =>
        {
            var input = TimeSpan.FromSeconds(35.625);
            var result = await new DurationClient(host, null).GetQueryClient().Float64SecondsAsync(input);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Duration_Query_Int32SecondsArray() => Test(async (host) =>
        {
            var data1 = TimeSpan.FromSeconds(36);
            var data2 = TimeSpan.FromSeconds(47);
            var result = await new DurationClient(host, null).GetQueryClient().Int32SecondsArrayAsync(new[] { data1, data2 });
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });
    }
}
