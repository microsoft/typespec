// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using ModelsTypeSpec;
using ModelsTypeSpec.Models;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    /// <summary>
    /// End-to-end test cases for `Models-TypeSpec` test project.
    /// </summary>
    public class ModelsTypeSpecTests : CadlRanchMockApiTestBase
    {
        [Test]
        public Task Models_InputToRoundTripPrimitive() => Test(async (host) =>
        {
            // we should not call the internal ctor. Because this test case is in the same assembly as the source code therefore we can access to the internal ctor now.
            // our customer never could.
            // when we are calling the internal ctor, we can assign null to collections, which is a case we should avoid.
            InputModel input = new("test", 1, null, null, new BaseModel(), new BaseModel(), Enumerable.Empty<int>(), new string[] { null, "test" }, new CollectionItem[] { null }, new Dictionary<string, RecordItem>(), new float?[] { null, 12.3f }, new bool?[] {null, true, false}, null, null, null);
            RoundTripPrimitiveModel result = await new ModelsTypeSpecClient(host).InputToRoundTripPrimitiveAsync(input);

            Assert.AreEqual("test", result.RequiredString);
            Assert.AreEqual(123, result.RequiredInt);
            Assert.AreEqual(123456, result.RequiredInt64);
            Assert.AreEqual(1234567, result.RequiredSafeInt);
            Assert.AreEqual(12.3f, result.RequiredFloat);
            Assert.AreEqual(123.456, result.RequiredDouble);
            Assert.IsTrue(result.RequiredBoolean);
            Assert.AreEqual(DateTimeOffset.Parse("2023-02-14Z02:08:47"), result.RequiredDateTimeOffset);
            Assert.AreEqual(new TimeSpan(1, 2, 59, 59), result.RequiredTimeSpan);
            CollectionAssert.AreEqual(new float?[] { null, 12.3f }, result.RequiredCollectionWithNullableFloatElement);
        });

        [Test]
        public Task Models_InputToRoundTripOptional() => Test(async (host) =>
        {
            RoundTripOptionalModel input = new()
            {
                OptionalPlainDate = DateTimeOffset.Parse("2023-02-14Z02:08:47"),
                OptionalPlainTime = new TimeSpan(1, 2, 59, 59),
            };
            input.OptionalCollectionWithNullableIntElement.Add(123);
            input.OptionalCollectionWithNullableIntElement.Add(null);

            RoundTripOptionalModel result = await new ModelsTypeSpecClient(host).InputToRoundTripOptionalAsync(input);

            CollectionAssert.AreEqual(new int?[] { null, 123 }, result.OptionalCollectionWithNullableIntElement);
        });

        [Test]
        public Task Models_InputToRoundTripReadOnly() => Test(async (host) =>
        {
            InputModel input = new("test", 2, null, null, new DerivedModel(new CollectionItem[] { null }), new DerivedModel(new CollectionItem[] { null }), new int[] { 1, 2 }, new string[] { "a", null}, new CollectionItem[] { new CollectionItem(new Dictionary<string, RecordItem>())}, new Dictionary<string, RecordItem>(), Enumerable.Empty<float?>(), Enumerable.Empty<bool?>(), null, null, null);
            RoundTripReadOnlyModel result = await new ModelsTypeSpecClient(host).InputToRoundTripReadOnlyAsync(input);

            Assert.AreEqual("test", result.RequiredReadonlyString);
            Assert.AreEqual(12, result.RequiredReadonlyInt);
            Assert.AreEqual(11, result.OptionalReadonlyInt);
            Assert.IsEmpty(result.RequiredReadonlyModel.RequiredList);
            Assert.AreEqual(FixedStringEnum.One, result.RequiredReadonlyFixedStringEnum);
            Assert.AreEqual("3", result.RequiredReadonlyExtensibleEnum.ToString());
            Assert.AreEqual(FixedStringEnum.Two, result.OptionalReadonlyFixedStringEnum);
            Assert.AreEqual(ExtensibleEnum.One, result.OptionalReadonlyExtensibleEnum);
            Assert.AreEqual(1, result.RequiredReadonlyStringList.Count);
            Assert.AreEqual("abc", result.RequiredReadonlyStringList[0]);
            Assert.IsEmpty(result.RequiredReadonlyIntList);
            Assert.IsEmpty(result.RequiredReadOnlyModelList);
            Assert.AreEqual(1, result.RequiredReadOnlyIntRecord.Count);
            Assert.AreEqual(1, result.RequiredReadOnlyIntRecord["test"]);
            Assert.AreEqual(1, result.RequiredStringRecord.Count);
            Assert.AreEqual("1", result.RequiredStringRecord["test"]);
            Assert.IsEmpty(result.RequiredReadOnlyModelRecord);
            Assert.AreEqual(1, result.OptionalReadonlyStringList.Count);
            Assert.IsNull(result.OptionalReadonlyStringList[0]);
            Assert.IsEmpty(result.OptionalReadOnlyModelList);
            Assert.IsEmpty(result.OptionalReadOnlyStringRecord);
            Assert.AreEqual(1, result.OptionalModelRecord.Count);
            Assert.IsEmpty(result.OptionalModelRecord["test"].RequiredList);
            CollectionAssert.AreEqual(new int?[] { null, 123 }, result.RequiredCollectionWithNullableIntElement);
            CollectionAssert.AreEqual(new bool?[] { null, false, true }, result.OptionalCollectionWithNullableBooleanElement);
        });

        [Test]
        public Task Models_SingleBase() => Test(async (host) =>
        {
            SingleBase result = await new ModelsTypeSpecClient(host).GetSingleBaseAsync();
            Assert.AreEqual(123, result.Size);
        });
    }
}
