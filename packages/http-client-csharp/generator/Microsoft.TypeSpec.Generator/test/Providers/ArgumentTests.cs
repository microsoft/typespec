// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using NUnit.Framework;
using SampleTypeSpec;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class ArgumentTests
    {
        [TestCase("test")]
        public void NotNull(object? value)
        {
            Argument.AssertNotNull(value, "value");

            Assert.AreEqual("test", value!.ToString());
        }

        [Test]
        public void NotNullThrowsOnNull()
        {
            object? value = null;
            Assert.Throws<ArgumentNullException>(() => Argument.AssertNotNull(value, "value"));
        }

        [Test]
        public void NotNullNullableInt32()
        {
            int? value = 1;
            Argument.AssertNotNull(value, "value");
        }

        [Test]
        public void NotNullNullableInt32ThrowsOnNull()
        {
            int? value = null;
            Assert.Throws<ArgumentNullException>(() => Argument.AssertNotNull(value, "value"));
        }

        [Test]
        public void NotNullOrEmptyString()
        {
            string value = "test";
            Argument.AssertNotNullOrEmpty(value, "value");
        }

        [Test]
        public void NotNullOrEmptyStringThrowsOnNull()
        {
            string? value = null;
            Assert.Throws<ArgumentNullException>(() => Argument.AssertNotNullOrEmpty(value, "value"));
        }

        [Test]
        public void NotNullOrEmptyStringThrowsOnEmpty()
        {
            Assert.Throws<ArgumentException>(() => Argument.AssertNotNullOrEmpty(string.Empty, "value"));
        }

        private readonly struct TestStructure : IEquatable<TestStructure>
        {
            internal readonly string A;
            internal readonly int B;

            internal TestStructure(string a, int b)
            {
                A = a;
                B = b;
            }

            public bool Equals(TestStructure other) => string.Equals(A, other.A, StringComparison.Ordinal) && B == other.B;
        }

        private static IEnumerable<IEnumerable<string>> GetNotNullOrEmptyCollectionThrowsOnEmptyCollectionData()
        {
            static IEnumerable<string> NotNullOrEmptyCollectionThrowsOnEmptyCollection()
            {
                yield break;
            }

            yield return new string[0];
            yield return NotNullOrEmptyCollectionThrowsOnEmptyCollection();
        }
    }
}
