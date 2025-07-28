// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class ExtensibleEnumTests
    {
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
