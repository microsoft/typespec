// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Linq;
using System.Threading.Tasks;
using System.Xml;
using _Type.Property.Nullable;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http._Type.Property.Nullable
{
    internal class NullableTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task StringGetNonNull() => Test(async (host) =>
        {
            var response = await new NullableClient(host, null).GetStringClient().GetNonNullAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.RequiredProperty);
            Assert.AreEqual("hello", response.Value.NullableProperty);
        });

        [CadlRanchTest]
        public Task StringGetNull() => Test(async (host) =>
        {
            var response = await new NullableClient(host, null).GetStringClient().GetNullAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.RequiredProperty);
            Assert.IsNull(response.Value.NullableProperty);
        });

        [CadlRanchTest]
        public Task StringPatchNonNull() => Test(async (host) =>
        {
            var value = new
            {
                requiredProperty = "foo",
                nullableProperty = "hello"
            };
            var response = await new NullableClient(host, null).GetStringClient().PatchNonNullAsync(BinaryContent.Create(BinaryData.FromObjectAsJson(value)), null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task StringPatchNull() => Test(async (host) =>
        {
            string value = "{ \"requiredProperty\": \"foo\", \"nullableProperty\": null }";
            var response = await new NullableClient(host, null).GetStringClient().PatchNullAsync(BinaryContent.Create(BinaryData.FromString(value)), null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task BytesGetNonNull() => Test(async (host) =>
        {
            var response = await new NullableClient(host, null).GetBytesClient().GetNonNullAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.RequiredProperty);
            BinaryDataAssert.AreEqual(BinaryData.FromString("hello, world!"), response.Value.NullableProperty);
        });

        [CadlRanchTest]
        public Task BytesGetNull() => Test(async (host) =>
        {
            var response = await new NullableClient(host, null).GetBytesClient().GetNullAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.RequiredProperty);
            Assert.IsNull(response.Value.NullableProperty);
        });

        [CadlRanchTest]
        public Task BytesPatchNonNull() => Test(async (host) =>
        {
            var value = new
            {
                requiredProperty = "foo",
                // cspell: disable-next-line
                nullableProperty = "aGVsbG8sIHdvcmxkIQ=="
            };
            var response = await new NullableClient(host, null).GetBytesClient().PatchNonNullAsync(BinaryContent.Create(BinaryData.FromObjectAsJson(value)), null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task BytesPatchNull() => Test(async (host) =>
        {
            string value = "{ \"requiredProperty\": \"foo\", \"nullableProperty\": null }";
            var response = await new NullableClient(host, null).GetBytesClient().PatchNullAsync(BinaryContent.Create(BinaryData.FromString(value)), null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task DatetimeTetNonNull() => Test(async (host) =>
        {
            var response = await new NullableClient(host, null).GetDatetimeClient().GetNonNullAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.RequiredProperty);
            Assert.AreEqual(DateTimeOffset.Parse("2022-08-26T18:38:00Z"), response.Value.NullableProperty);
        });

        [CadlRanchTest]
        public Task DatetimeGetNull() => Test(async (host) =>
        {
            var response = await new NullableClient(host, null).GetDatetimeClient().GetNullAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.RequiredProperty);
            Assert.IsNull(response.Value.NullableProperty);
        });

        [CadlRanchTest]
        public Task DatetimePatchNonNull() => Test(async (host) =>
        {
            var value = new
            {
                requiredProperty = "foo",
                nullableProperty = DateTimeOffset.Parse("2022-08-26T18:38:00Z")
            };
            var response = await new NullableClient(host, null).GetDatetimeClient().PatchNonNullAsync(BinaryContent.Create(BinaryData.FromObjectAsJson(value)), null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Datetime_patchNull() => Test(async (host) =>
        {
            string value = "{ \"requiredProperty\": \"foo\", \"nullableProperty\": null }";
            var response = await new NullableClient(host, null).GetDatetimeClient().PatchNullAsync(BinaryContent.Create(BinaryData.FromString(value)), null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task DurationGetNonNull() => Test(async (host) =>
        {
            var response = await new NullableClient(host, null).GetDurationClient().GetNonNullAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.RequiredProperty);
            Assert.AreEqual(XmlConvert.ToTimeSpan("P123DT22H14M12.011S"), response.Value.NullableProperty);
        });

        [CadlRanchTest]
        public Task Type_Property_Nullable_Duration_getNull() => Test(async (host) =>
        {
            var response = await new NullableClient(host, null).GetDurationClient().GetNullAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.RequiredProperty);
            Assert.IsNull(response.Value.NullableProperty);
        });

        [CadlRanchTest]
        public Task DurationPatchNonNull() => Test(async (host) =>
        {
            var value = new
            {
                requiredProperty = "foo",
                nullableProperty = "P123DT22H14M12.011S"
            };
            var response = await new NullableClient(host, null).GetDurationClient().PatchNonNullAsync(BinaryContent.Create(BinaryData.FromObjectAsJson(value)), null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task DurationPatchNull() => Test(async (host) =>
        {
            string value = "{ \"requiredProperty\": \"foo\", \"nullableProperty\": null }";
            var response = await new NullableClient(host, null).GetDurationClient().PatchNullAsync(BinaryContent.Create(BinaryData.FromString(value)), null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task CollectionsByteGetNonNull() => Test(async (host) =>
        {
            var response = await new NullableClient(host, null).GetCollectionsByteClient().GetNonNullAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.RequiredProperty);
            Assert.AreEqual(2, response.Value.NullableProperty.Count);
            BinaryDataAssert.AreEqual(BinaryData.FromString("hello, world!"), response.Value.NullableProperty.First());
            BinaryDataAssert.AreEqual(BinaryData.FromString("hello, world!"), response.Value.NullableProperty.Last());
        });

        [CadlRanchTest]
        public Task CollectionsByteGetNull() => Test(async (host) =>
        {
            var response = await new NullableClient(host, null).GetCollectionsByteClient().GetNullAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.RequiredProperty);
            Assert.IsNotNull(response.Value.NullableProperty);
        });

        [CadlRanchTest]
        public Task CollectionsBytePatchNonNull() => Test(async (host) =>
        {
            var value = new
            {
                requiredProperty = "foo",
                // cspell: disable-next-line
                nullableProperty = new[] { "aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ==" }
            };
            var response = await new NullableClient(host, null).GetCollectionsByteClient().PatchNonNullAsync(BinaryContent.Create(BinaryData.FromObjectAsJson(value)), null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task CollectionsBytePatchNull() => Test(async (host) =>
        {
            string value = "{ \"requiredProperty\": \"foo\", \"nullableProperty\": null }";
            var response = await new NullableClient(host, null).GetCollectionsByteClient().PatchNullAsync(BinaryContent.Create(BinaryData.FromString(value)), null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task CollectionsModelGetNonNull() => Test(async (host) =>
        {
            var response = await new NullableClient(host, null).GetCollectionsModelClient().GetNonNullAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.RequiredProperty);
            Assert.AreEqual(2, response.Value.NullableProperty.Count);
            Assert.AreEqual("hello", response.Value.NullableProperty.First().Property);
            Assert.AreEqual("world", response.Value.NullableProperty.Last().Property);
        });

        [CadlRanchTest]
        public Task CollectionsModelGetNull() => Test(async (host) =>
        {
            var response = await new NullableClient(host, null).GetCollectionsModelClient().GetNullAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.RequiredProperty);
            Assert.IsNotNull(response.Value.NullableProperty);
        });

        [CadlRanchTest]
        public Task CollectionsModelPatchNonNull() => Test(async (host) =>
        {
            var value = new
            {
                requiredProperty = "foo",
                nullableProperty = new[]
                {
                    new
                    {
                        property = "hello"
                    },
                    new
                    {
                        property = "world"
                    }
                }
            };
            var response = await new NullableClient(host, null).GetCollectionsModelClient().PatchNonNullAsync(BinaryContent.Create(BinaryData.FromObjectAsJson(value)), null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task CollectionsModelPatchNull() => Test(async (host) =>
        {
            string value = "{ \"requiredProperty\": \"foo\", \"nullableProperty\": null }";
            var response = await new NullableClient(host, null).GetCollectionsModelClient().PatchNullAsync(BinaryContent.Create(BinaryData.FromString(value)), null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
