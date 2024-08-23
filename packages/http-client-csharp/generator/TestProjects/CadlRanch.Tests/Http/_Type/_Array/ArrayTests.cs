// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Xml;
using _Type._Array;
using _Type._Array.Models;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http._Type._Array
{
    internal class ArrayTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task Int32ValueGet() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetInt32ValueClient().GetAsync();
            CollectionAssert.AreEqual(new[] { 1, 2 }, response.Value);
        });

        [CadlRanchTest]
        public Task Int32ValuePut() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetInt32ValueClient().PutAsync(new List<int> { 1, 2 });
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Int64ValueGet() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetInt64ValueClient().GetAsync();
            CollectionAssert.AreEqual(new[] { 9007199254740991, -9007199254740991 }, response.Value);
        });

        [CadlRanchTest]
        public Task Int64ValuePut() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetInt64ValueClient().PutAsync(new List<long> { 9007199254740991, -9007199254740991 });
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task BooleanValueGet() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetBooleanValueClient().GetAsync();
            CollectionAssert.AreEqual(new[] { true, false }, response.Value);
        });

        [CadlRanchTest]
        public Task BooleanValuePut() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetBooleanValueClient().PutAsync(new List<bool> { true, false });
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task StringValueGet() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetStringValueClient().GetAsync();
            CollectionAssert.AreEqual(new[] { "hello", "" }, response.Value);
        });

        [CadlRanchTest]
        public Task StringValuePut() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetStringValueClient().PutAsync(new List<string> { "hello", "" });
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Float32ValueGet() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetFloat32ValueClient().GetAsync();
            CollectionAssert.AreEqual(new[] { 43.125f }, response.Value);
        });

        [CadlRanchTest]
        public Task Float32ValuePut() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetFloat32ValueClient().PutAsync(new List<float> { 43.125f });
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task DatetimeValueGet() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetDatetimeValueClient().GetAsync();
            Assert.AreEqual(1, response.Value.Count);
            Assert.AreEqual(DateTimeOffset.Parse("2022-08-26T18:38:00Z"), response.Value[0]);
        });

        [CadlRanchTest]
        public Task DatetimeValuePut() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetDatetimeValueClient().PutAsync(new List<DateTimeOffset> { DateTimeOffset.Parse("2022-08-26T18:38:00Z") });
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task DurationValueGet() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetDurationValueClient().GetAsync();
            Assert.AreEqual(1, response.Value.Count);
            Assert.AreEqual(XmlConvert.ToTimeSpan("P123DT22H14M12.011S"), response.Value[0]);
        });

        [CadlRanchTest]
        public Task DurationValuePut() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetDurationValueClient().PutAsync(new List<TimeSpan> { XmlConvert.ToTimeSpan("P123DT22H14M12.011S") });
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task UnknownValueGet() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetUnknownValueClient().GetAsync();
            Assert.AreEqual(1, response.Value[0].ToObjectFromJson<int>());
            Assert.AreEqual("hello", response.Value[1].ToObjectFromJson<string>());
            Assert.IsNull(response.Value[2]);
        });

        [CadlRanchTest]
        public Task UnknownValuePut() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetUnknownValueClient().PutAsync(new List<BinaryData?> { new BinaryData(1), new BinaryData("\"hello\""), null });
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task ModelValueGet() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetModelValueClient().GetAsync();
            Assert.AreEqual(2, response.Value.Count);
            Assert.AreEqual("hello", response.Value[0].Property);
            Assert.AreEqual("world", response.Value[1].Property);
        });

        [CadlRanchTest]
        public Task ModelValuePut() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetModelValueClient().PutAsync(new List<InnerModel> { new InnerModel("hello"), new InnerModel("world") });
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task NullableFloatValueGet() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetNullableFloatValueClient().GetAsync();
            CollectionAssert.AreEqual(new float?[] { 1.25f, null, 3.0f }, response.Value);
        });

        [CadlRanchTest]
        public Task NullableFloatValuePut() => Test(async (host) =>
        {
            var response = await new ArrayClient(host, null).GetNullableFloatValueClient().PutAsync(new List<float?> { 1.25f, null, 3.0f });
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
