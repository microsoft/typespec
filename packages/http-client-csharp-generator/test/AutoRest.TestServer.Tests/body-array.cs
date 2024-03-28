// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Xml;
using AutoRest.TestServer.Tests.Infrastructure;
using body_array;
using body_array.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class BodyArray : TestServerTestBase
    {
        [Test]
        public Task GetArrayArrayEmpty() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetArrayEmptyAsync();

            CollectionAssert.IsEmpty(result.Value);
        });

        [Test]
        public Task GetArrayArrayItemEmpty() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetArrayItemEmptyAsync();

            CollectionAssert.AreEqual(new[] { new object[] { "1", "2", "3" }, Enumerable.Empty<object>(), new object[] { "7", "8", "9" } }, result.Value);
        });

        [Test]
        public Task GetArrayArrayItemNull() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetArrayItemNullAsync();

            CollectionAssert.AreEqual(new[] { new object[] { "1", "2", "3" }, null, new object[] { "7", "8", "9" } }, result.Value);
        });

        [Test]
        public Task GetArrayArrayNull() => Test((host, pipeline) =>
        {
            // Empty response body
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetArrayNullAsync());
        });

        [Test]
        public Task GetArrayArrayValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetArrayValidAsync();

            CollectionAssert.AreEqual(new[] { new object[] { "1", "2", "3" }, new object[] { "4", "5", "6" }, new object[] { "7", "8", "9" } }, result.Value);
        });

        [Test]
        public Task GetArrayBase64Url() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetBase64UrlAsync();

            var values = result.Value.ToArray();

            CollectionAssert.AreEqual(new byte[] { 97, 32, 115, 116, 114, 105, 110, 103, 32, 116, 104, 97, 116, 32, 103, 101, 116, 115, 32, 101, 110, 99, 111, 100, 101, 100, 32, 119, 105, 116, 104, 32, 98, 97, 115, 101, 54, 52, 117, 114, 108 }, values[0]);
            CollectionAssert.AreEqual(new byte[] { 116, 101, 115, 116, 32, 115, 116, 114, 105, 110, 103 }, values[1]);
            CollectionAssert.AreEqual(new byte[] { 76, 111, 114, 101, 109, 32, 105, 112, 115, 117, 109 }, values[2]);
        });

        [Test]
        public Task GetArrayBooleanValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetBooleanTfftAsync();

            CollectionAssert.AreEqual(new[] { true, false, false, true }, result.Value);
        });

        [Test]
        public Task GetArrayBooleanWithNull() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetBooleanInvalidNullAsync());
        });

        [Test]
        public Task GetArrayBooleanWithString() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetBooleanInvalidStringAsync());
        });

        [Test]
        public Task GetArrayByteValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetByteValidAsync();

            CollectionAssert.AreEqual(new[] { new[] { 255, 255, 255, 250 }, new[] { 1, 2, 3 }, new[] { 37, 41, 67 } }, result.Value);
        });

        [Test]
        public Task GetArrayByteWithNull() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetByteInvalidNullAsync();

            CollectionAssert.AreEqual(new[] { new[] { 0x0AB, 0x0AC, 0x0AD } , null }, result.Value);
        });

        [Test]
        public Task GetArrayComplexEmpty() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetComplexEmptyAsync();

            CollectionAssert.IsEmpty(result.Value);
        });

        [Test]
        public Task GetArrayComplexItemEmpty() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetComplexItemEmptyAsync();
            var values = result.Value.ToArray();

            Assert.AreEqual(3, values.Length);
            Assert.AreEqual(1, values[0].Integer);
            Assert.AreEqual("2", values[0].String);

            Assert.AreEqual(null, values[1].Integer);
            Assert.AreEqual(null, values[1].String);

            Assert.AreEqual(5, values[2].Integer);
            Assert.AreEqual("6", values[2].String);
        });

        [Test]
        public Task GetArrayComplexItemNull() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetComplexItemNullAsync();
            var values = result.Value.ToArray();

            Assert.AreEqual(3, values.Length);
            Assert.AreEqual(1, values[0].Integer);
            Assert.AreEqual("2", values[0].String);

            Assert.AreEqual(null, values[1]);

            Assert.AreEqual(5, values[2].Integer);
            Assert.AreEqual("6", values[2].String);
        });

        [Test]
        public Task GetArrayComplexNull() => Test((host, pipeline) =>
        {
            // Empty response body
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetComplexNullAsync());
        });

        [Test]
        public Task GetArrayComplexValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetComplexValidAsync();
            var values = result.Value.ToArray();

            Assert.AreEqual(3, values.Length);
            Assert.AreEqual(1, values[0].Integer);
            Assert.AreEqual("2", values[0].String);

            Assert.AreEqual(3, values[1].Integer);
            Assert.AreEqual("4", values[1].String);


            Assert.AreEqual(5, values[2].Integer);
            Assert.AreEqual("6", values[2].String);
        });

        [Test]
        public Task GetArrayDateTimeRfc1123Valid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetDateTimeRfc1123ValidAsync();
            CollectionAssert.AreEqual(new[]
            {
                DateTimeOffset.Parse("2000-12-01 00:00:01+00:00"),
                DateTimeOffset.Parse("1980-01-02 00:11:35+00:00"),
                DateTimeOffset.Parse("1492-10-12 10:15:01+00:00"),
            }, result.Value);
        });

        [Test]
        public Task GetArrayDateTimeValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetDateTimeValidAsync();
            CollectionAssert.AreEqual(new[]
            {
                DateTimeOffset.Parse("2000-12-01 00:00:01+00:00"),
                DateTimeOffset.Parse("1980-01-01 23:11:35+00:00"),
                DateTimeOffset.Parse("1492-10-12 18:15:01+00:00"),
            }, result.Value);
        });

        [Test]
        public Task GetArrayDateTimeWithInvalidChars() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetDateTimeInvalidCharsAsync());
        });

        [Test]
        public Task GetArrayDateTimeWithNull() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetDateTimeInvalidNullAsync());
        });

        [Test]
        public Task GetArrayDateValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetDateValidAsync();
            CollectionAssert.AreEqual(new[]
            {
                DateTimeOffset.Parse("2000-12-01", styles: DateTimeStyles.AssumeUniversal),
                DateTimeOffset.Parse("1980-01-02", styles: DateTimeStyles.AssumeUniversal),
                DateTimeOffset.Parse("1492-10-12", styles: DateTimeStyles.AssumeUniversal),
            }, result.Value);
        });

        [Test]
        public Task GetArrayDateWithInvalidChars() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetDateInvalidCharsAsync());
        });

        [Test]
        public Task GetArrayDateWithNull() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetDateInvalidNullAsync());
        });

        [Test]
        public Task GetArrayDictionaryEmpty() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetDictionaryEmptyAsync();

            CollectionAssert.IsEmpty(result.Value);
        });

        [Test]
        public Task GetArrayDictionaryItemEmpty() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetDictionaryItemEmptyAsync();

            var values = result.Value.ToArray();

            Assert.AreEqual(3, values.Length);

            CollectionAssert.AreEqual(new Dictionary<string, string>() { { "1", "one" }, { "2", "two" }, { "3", "three" } }, values[0]);
            CollectionAssert.AreEqual(new Dictionary<string, string>(), values[1]);
            CollectionAssert.AreEqual(new Dictionary<string, string>() { { "7", "seven" }, { "8", "eight" }, { "9", "nine" } }, values[2]);
        });

        [Test]
        public Task GetArrayDictionaryItemNull() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetDictionaryItemNullAsync();

            var values = result.Value.ToArray();

            Assert.AreEqual(3, values.Length);

            CollectionAssert.AreEqual(new Dictionary<string, string>() { { "1", "one" }, { "2", "two" }, { "3", "three" } }, values[0]);
            CollectionAssert.AreEqual(null, values[1]);
            CollectionAssert.AreEqual(new Dictionary<string, string>() { { "7", "seven" }, { "8", "eight" }, { "9", "nine" } }, values[2]);
        });

        [Test]
        public Task GetArrayDictionaryNull() => Test((host, pipeline) =>
        {
            // Empty response body
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetDictionaryNullAsync());
        });

        [Test]
        public Task GetArrayDictionaryValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetDictionaryValidAsync();

            var values = result.Value.ToArray();

            Assert.AreEqual(3, values.Length);

            CollectionAssert.AreEqual(new Dictionary<string, string>() { { "1", "one" }, { "2", "two" }, { "3", "three" } }, values[0]);
            CollectionAssert.AreEqual(new Dictionary<string, string>() { { "4", "four" }, { "5", "five" }, { "6", "six" }, }, values[1]);
            CollectionAssert.AreEqual(new Dictionary<string, string>() { { "7", "seven" }, { "8", "eight" }, { "9", "nine" } }, values[2]);
        });

        [Test]
        public Task GetArrayDoubleValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetDoubleValidAsync();

            CollectionAssert.AreEqual(new double[] { 0, -0.01, -1.2e20 }, result.Value);
        });

        [Test]
        public Task GetArrayDoubleWithNull() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetDoubleInvalidNullAsync());
        });

        [Test]
        public Task GetArrayDoubleWithString() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetDoubleInvalidStringAsync());
        });

        [Test]
        public Task GetArrayDurationValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetDurationValidAsync();

            CollectionAssert.AreEqual(new[]
            {
                XmlConvert.ToTimeSpan("P123DT22H14M12.011S"),
                XmlConvert.ToTimeSpan("P5DT1H0M0S"),
            }, result.Value);
        });

        [Test]
        public Task GetArrayEmpty() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetEmptyAsync();
            CollectionAssert.IsEmpty(result.Value);
        });

        [Test]
        public Task GetArrayEnumValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetEnumValidAsync();

            CollectionAssert.AreEqual(new[] { FooEnum.Foo1, FooEnum.Foo2, FooEnum.Foo3 }, result.Value);
        });

        [Test]
        public Task GetArrayFloatValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetFloatValidAsync();

            CollectionAssert.AreEqual(new[] { 0, -0.01f, -1.2e20f }, result.Value);
        });

        [Test]
        public Task GetArrayFloatWithNull() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetFloatInvalidNullAsync());
        });

        [Test]
        public Task GetArrayFloatWithString() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetFloatInvalidStringAsync());
        });

        [Test]
        public Task GetArrayIntegerValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetIntegerValidAsync();

            CollectionAssert.AreEqual(new[] { 1, -1, 3, 300 }, result.Value);
        });

        [Test]
        public Task GetArrayIntegerWithNull() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetIntInvalidNullAsync());
        });

        [Test]
        public Task GetArrayIntegerWithString() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetIntInvalidStringAsync());
        });

        [Test]
        public Task GetArrayInvalid() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetInvalidAsync());
        });

        [Test]
        public Task GetArrayLongValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetLongValidAsync();

            CollectionAssert.AreEqual(new[] { 1, -1, 3, 300L }, result.Value);
        });

        [Test]
        public Task GetArrayLongWithNull() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetLongInvalidNullAsync());
        });

        [Test]
        public Task GetArrayLongWithString() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetLongInvalidStringAsync());
        });

        [Test]
        public Task GetArrayNull() => Test((host, pipeline) =>
        {
            // Empty response body
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetNullAsync());
        });

        [Test]
        public Task GetArrayStringEnumValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetStringEnumValidAsync();

            CollectionAssert.AreEqual(new[]
            {
                Enum0.Foo1,
                Enum0.Foo2,
                Enum0.Foo3
            }, result.Value);
        });

        [Test]
        public Task GetArrayStringValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetStringValidAsync();

            CollectionAssert.AreEqual(new[] { "foo1", "foo2", "foo3" }, result.Value);
        });

        [Test]
        public Task GetArrayStringWithNull() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetStringWithNullAsync();

            CollectionAssert.AreEqual(new[] { "foo", null, "foo2" }, result.Value);
        });

        [Test]
        public Task GetArrayStringWithNumber() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetStringWithInvalidAsync());
        });

        [Test]
        public Task GetArrayUuidValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetUuidValidAsync();

            CollectionAssert.AreEqual(new[]
            {
                Guid.Parse("6dcc7237-45fe-45c4-8a6b-3a8a3f625652"),
                Guid.Parse("d1399005-30f7-40d6-8da6-dd7c89ad34db"),
                Guid.Parse("f42f6aa1-a5bc-4ddf-907e-5f915de43205")
            }, result.Value);
        });

        [Test]
        public Task GetArrayUuidWithInvalidChars() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<Exception>(), async () => await new ArrayClient(ClientDiagnostics, pipeline, host).GetUuidInvalidCharsAsync());
        });

        [Test]
        public Task PutArrayArrayValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutArrayValidAsync(
            new[] { new[] { "1", "2", "3" }, new[] { "4", "5", "6" }, new[] { "7", "8", "9" } }));

        [Test]
        public Task PutArrayBooleanValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutBooleanTfftAsync(
            new[] { true, false, false, true }));

        [Test]
        public Task PutArrayByteValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutByteValidAsync(
            new[] { new byte[] { 255, 255, 255, 250 }, new byte[] { 1, 2, 3 }, new byte[] { 37, 41, 67 } }));

        [Test]
        public Task PutArrayComplexValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutComplexValidAsync(
            new[] { new Product() { Integer = 1, String = "2" }, new Product() { Integer = 3, String = "4" }, new Product() { Integer = 5, String = "6" }}));

        [Test]
        public Task PutArrayDateTimeRfc1123Valid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutDateTimeRfc1123ValidAsync(
            new[] {
                DateTimeOffset.Parse("2000-12-01 00:00:01+00:00"),
                DateTimeOffset.Parse("1980-01-02 00:11:35+00:00"),
                DateTimeOffset.Parse("1492-10-12 10:15:01+00:00"),
            }));

        [Test]
        public Task PutArrayDateTimeValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutDateTimeValidAsync(
            new[] {
                DateTimeOffset.Parse("2000-12-01 00:00:01+00:00"),
                DateTimeOffset.Parse("1980-01-02 00:11:35+00:00"),
                DateTimeOffset.Parse("1492-10-12 10:15:01+00:00"),
            }));

        [Test]
        public Task PutArrayDateValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutDateValidAsync(
            new[] {
                DateTimeOffset.Parse("2000-12-01 00:00:01+00:00"),
                DateTimeOffset.Parse("1980-01-02 00:11:35+00:00"),
                DateTimeOffset.Parse("1492-10-12 10:15:01+00:00"),
            }));

        [Test]
        public Task PutArrayDictionaryValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutDictionaryValidAsync(
            new[]
            {
                new Dictionary<string, string>() { { "1", "one" }, { "2", "two" }, { "3", "three" } },
                new Dictionary<string, string>() { { "4", "four" }, { "5", "five" }, { "6", "six" } },
                new Dictionary<string, string>() { { "7", "seven" }, { "8", "eight" }, { "9", "nine" } }
            }));

        [Test]
        public Task PutArrayDoubleValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutDoubleValidAsync(
            new[] { 0, -0.01, -1.2e20 }));

        [Test]
        public Task PutArrayDurationValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutDurationValidAsync(
            new[] {
                XmlConvert.ToTimeSpan("P123DT22H14M12.011S"),
                XmlConvert.ToTimeSpan("P5DT1H0M0S")
            }));

        [Test]
        public Task PutArrayEmpty() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutEmptyAsync(
            Enumerable.Empty<string>()));

        [Test]
        public Task PutArrayEnumValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutEnumValidAsync(
            new[] { FooEnum.Foo1, FooEnum.Foo2, FooEnum.Foo3 }));

        [Test]
        public Task PutArrayFloatValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutFloatValidAsync(
            new[] { 0, -0.01f, -1.2e20f }));

        [Test]
        public Task PutArrayIntegerValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutIntegerValidAsync(
            new[] { 1, -1, 3, 300 }));

        [Test]
        public Task PutArrayLongValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutLongValidAsync(
           new[] { 1, -1, 3, 300L }));

        [Test]
        public Task PutArrayStringEnumValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutStringEnumValidAsync(
            new[]
            {
                Enum1.Foo1,
                Enum1.Foo2,
                Enum1.Foo3
            }));

        [Test]
        public Task PutArrayStringValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutStringValidAsync(
           new[] { "foo1", "foo2", "foo3" }));

        [Test]
        public Task PutArrayUuidValid() => TestStatus(async (host, pipeline) => await new ArrayClient(ClientDiagnostics, pipeline, host).PutUuidValidAsync(
            new[]
            {
                Guid.Parse("6dcc7237-45fe-45c4-8a6b-3a8a3f625652"),
                Guid.Parse("d1399005-30f7-40d6-8da6-dd7c89ad34db"),
                Guid.Parse("f42f6aa1-a5bc-4ddf-907e-5f915de43205")
            }));
    }
}
