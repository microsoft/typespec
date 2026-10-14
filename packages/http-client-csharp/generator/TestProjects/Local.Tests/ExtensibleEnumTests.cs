// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class ExtensibleEnumTests
    {
        private static IEnumerable<TestCaseData> AcronymMembers()
        {
            yield return new TestCaseData(StringFixedEnum.IP, StringExtensibleEnum.IP, StringFixedUnion.IP, IntFixedEnum.IP, "ip", 10);
            yield return new TestCaseData(StringFixedEnum.DB, StringExtensibleEnum.DB, StringFixedUnion.DB, IntFixedEnum.DB, "db", 20);
            yield return new TestCaseData(StringFixedEnum.OS, StringExtensibleEnum.OS, StringFixedUnion.OS, IntFixedEnum.OS, "os", 30);
            yield return new TestCaseData(StringFixedEnum.IPv4, StringExtensibleEnum.IPv4, StringFixedUnion.IPv4, IntFixedEnum.IPv4, "ipv4", 40);
            yield return new TestCaseData(StringFixedEnum.IPv6, StringExtensibleEnum.IPv6, StringFixedUnion.IPv6, IntFixedEnum.IPv6, "ipv6", 60);
        }

        [TestCaseSource(nameof(AcronymMembers))]
        public void AcronymMembersRoundTrip(
            StringFixedEnum fixedValue,
            StringExtensibleEnum extensibleValue,
            StringFixedUnion unionValue,
            IntFixedEnum numericEnumValue,
            string wireValue,
            int numericValue)
        {
            var model = new ModelWithRequiredNullableProperties(null, extensibleValue, fixedValue)
            {
                FixedUnion = unionValue,
                NumericEnum = numericEnumValue
            };

            var data = ModelReaderWriter.Write(model);
            using var document = JsonDocument.Parse(data);
            var json = document.RootElement;
            Assert.AreEqual(wireValue, json.GetProperty("requiredExtensibleEnum").GetString());
            Assert.AreEqual(wireValue, json.GetProperty("requiredFixedEnum").GetString());
            Assert.AreEqual(wireValue, json.GetProperty("fixedUnion").GetString());
            Assert.AreEqual(numericValue, json.GetProperty("numericEnum").GetInt32());

            var roundTrip = ModelReaderWriter.Read<ModelWithRequiredNullableProperties>(data)!;
            Assert.AreEqual(extensibleValue, roundTrip.RequiredExtensibleEnum);
            Assert.AreEqual(fixedValue, roundTrip.RequiredFixedEnum);
            Assert.AreEqual(unionValue, roundTrip.FixedUnion);
            Assert.AreEqual(numericEnumValue, roundTrip.NumericEnum);
        }

        [Test]
        public void UnknownExtensibleAcronymRoundTrips()
        {
            var model = new ModelWithRequiredNullableProperties(null, new StringExtensibleEnum("ipvFuture"), null);

            var data = ModelReaderWriter.Write(model);
            using var document = JsonDocument.Parse(data);
            Assert.AreEqual("ipvFuture", document.RootElement.GetProperty("requiredExtensibleEnum").GetString());
            var roundTrip = ModelReaderWriter.Read<ModelWithRequiredNullableProperties>(data)!;
            Assert.AreEqual("ipvFuture", roundTrip.RequiredExtensibleEnum.ToString());
        }

        [TestCase("requiredFixedEnum")]
        [TestCase("fixedUnion")]
        public void UnknownFixedAcronymIsRejected(string propertyName)
        {
            var data = BinaryData.FromString($"{{\"{propertyName}\":\"ipvFuture\"}}");

            Assert.Throws<ArgumentOutOfRangeException>(() =>
                ModelReaderWriter.Read<ModelWithRequiredNullableProperties>(data));
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task EnumResponseDeserialization(bool isAsync)
        {
            var content = BinaryData.FromString("Monday");
            var response = new Mock<PipelineResponse>();
            response.SetupGet(r => r.Content).Returns(content);
            var protocolResult = ClientResult.FromResponse(response.Object);
            var client = new Mock<SampleTypeSpecClient> { CallBase = true };
            client.Setup(c => c.GetUnknownValue(It.IsAny<RequestOptions>())).Returns(protocolResult);
            client.Setup(c => c.GetUnknownValueAsync(It.IsAny<RequestOptions>())).ReturnsAsync(protocolResult);

            var result = isAsync
                ? await client.Object.GetUnknownValueAsync()
                : client.Object.GetUnknownValue();

            Assert.AreEqual("Monday", result.Value.ToString());
            Assert.AreSame(response.Object, result.GetRawResponse());
            Assert.AreSame(content, result.GetRawResponse().Content);
        }

        [TestCase("a", "A", true)]
        [TestCase("A", "A", true)]
        [TestCase("A", "B", false)]
        public void EqualsIgnoreCasing(string v1, string v2, bool expected)
        {
            var e1 = new StringExtensibleEnum(v1);
            var e2 = new StringExtensibleEnum(v2);
            Assert.AreEqual(expected, e1.Equals(e2));
        }

        [TestCaseSource(nameof(ExtensibleEnumData))]
        public void ExtensibleEnumInHashSet(string[] values, int expectedCount)
        {
            var enums = values.Select(v => new StringExtensibleEnum(v));
            var set = new HashSet<StringExtensibleEnum>(enums);
            foreach (var e in enums)
            {
                Assert.IsTrue(set.Contains(e));
            }

            Assert.AreEqual(expectedCount, set.Count);
        }

        [Test]
        public void ExtensibleEnumCanHandleNullValue()
        {
            StringExtensibleEnum e = default;
            var field = typeof(StringExtensibleEnum).GetField("_value", BindingFlags.NonPublic | BindingFlags.Instance);
            var value = field?.GetValue(e);

            Assert.IsNull(value);
            Assert.AreEqual(0, e.GetHashCode());
        }

        [Test]
        public void PassingNullArgToNullableExtensibleEnumParameterDoesNotThrow()
        {
            Assert.DoesNotThrow(() => NullableExtensibleEnumMethod(null));
            void NullableExtensibleEnumMethod(StringExtensibleEnum? e) { }
        }

        [Test]
        public void PassingNullArgToExtensibleEnumParameterThrows()
        {
            Assert.Throws<ArgumentNullException>(() => ExtensibleEnumMethod(null));
            void ExtensibleEnumMethod(StringExtensibleEnum e) { }
        }

        [Test]
        public void NoAmbiguityWithExtensibleEnum()
        {
            StringExtensibleEnum foo = "foo";
            Assert.AreEqual("foo", foo.ToString());

            StringExtensibleEnum? nullableFoo = "nullableFoo";
            Assert.AreEqual("nullableFoo", nullableFoo.ToString());

            StringExtensibleEnum? nullFoo = null;
            Assert.IsNull(nullFoo);

            Assert.Throws<ArgumentNullException>(() =>
            {
                StringExtensibleEnum nonNullableFoo = null;
            });
        }

        private static object[] ExtensibleEnumData = [
            new object[] {
                new string[]
                {
                    "a", "A", "foo", "fOO"
                },
                2
            }
        ];
    }
}
