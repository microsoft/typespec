// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Xml;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using _Type._Array;
using _Type._Array.Models;

namespace CadlRanchProjects.Tests
{
    public class TypeArrayTests : CadlRanchTestBase
    {
        [Test]
        public Task Type_Array_Int32Value_get() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetInt32ValueClient().GetInt32ValueAsync();
            Assert.AreEqual(1, response.Value.First());
            Assert.AreEqual(2, response.Value.Last());
        });

        [Test]
        public Task Type_Array_Int32Value_put() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetInt32ValueClient().PutAsync(new List<int> { 1, 2});
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Array_Int64Value_get() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetInt64ValueClient().GetInt64ValueAsync();
            Assert.AreEqual(9007199254740991, response.Value.First());
            Assert.AreEqual(-9007199254740991, response.Value.Last());
        });

        [Test]
        public Task Type_Array_Int64Value_put() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetInt64ValueClient().PutAsync(new List<long> { 9007199254740991, -9007199254740991 });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Array_BooleanValue_get() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetBooleanValueClient().GetBooleanValueAsync();
            Assert.AreEqual(true, response.Value.First());
            Assert.AreEqual(false, response.Value.Last());
        });

        [Test]
        public Task Type_Array_BooleanValue_put() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetBooleanValueClient().PutAsync(new List<bool> { true, false });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Array_StringValue_get() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetStringValueClient().GetStringValueAsync();
            Assert.AreEqual("hello", response.Value.First());
            Assert.AreEqual("", response.Value.Last());
        });

        [Test]
        public Task Type_Array_StringValue_put() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetStringValueClient().PutAsync(new List<string> { "hello", "" });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Array_Float32Value_get() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetFloat32ValueClient().GetFloat32ValueAsync();
            Assert.AreEqual(43.125f, response.Value.First());
        });

        [Test]
        public Task Type_Array_Float32Value_put() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetFloat32ValueClient().PutAsync(new List<float> { 43.125f });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Array_DatetimeValue_get() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetDatetimeValueClient().GetDatetimeValueAsync();
            Assert.AreEqual(DateTimeOffset.Parse("2022-08-26T18:38:00Z"), response.Value.First());
        });

        [Test]
        public Task Type_Array_DatetimeValue_put() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetDatetimeValueClient().PutAsync(new List<DateTimeOffset> { DateTimeOffset.Parse("2022-08-26T18:38:00Z") });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Array_DurationValue_get() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetDurationValueClient().GetDurationValueAsync();
            Assert.AreEqual(XmlConvert.ToTimeSpan("P123DT22H14M12.011S"), response.Value.First());
        });

        [Test]
        public Task Type_Array_DurationValue_put() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetDurationValueClient().PutAsync(new List<TimeSpan> { XmlConvert.ToTimeSpan("P123DT22H14M12.011S")});
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Array_UnknownValue_get() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetUnknownValueClient().GetUnknownValueAsync();
            var expected = new List<object?> { 1, "hello", null };
            var actual = response.Value.Select(item => item?.ToObjectFromJson()).ToArray();
            CollectionAssert.AreEqual(expected, actual);
        });

        [Test]
        public Task Type_Array_UnknownValue_put() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetUnknownValueClient().PutAsync(new List<BinaryData> { new BinaryData(1), new BinaryData("\"hello\""), null });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Array_ModelValue_get() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetModelValueClient().GetModelValueAsync();
            Assert.AreEqual("hello", response.Value.First().Property);
            Assert.AreEqual("world", response.Value.Last().Property);
        });

        [Test]
        public Task Type_Array_ModelValue_put() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetModelValueClient().PutAsync(new List<InnerModel> { new InnerModel("hello"), new InnerModel("world") });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Array_NullableFloatValue_get() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetNullableFloatValueClient().GetNullableFloatValueAsync();
            var result = response.Value.ToList();
            Assert.AreEqual(1.2f, result[0]);
            Assert.AreEqual(null, result[1]);
            Assert.AreEqual(3.0f, result[2]);
        });

        [Test]
        public Task Type_Array_NullableFloatValue_put() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetNullableFloatValueClient().PutAsync(new List<float?> { 1.2f, null, 3.0f });
            Assert.AreEqual(204, response.Status);
        });
    }
}
