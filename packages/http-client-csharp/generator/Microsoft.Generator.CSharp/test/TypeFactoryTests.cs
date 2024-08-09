// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class TypeFactoryTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockPlugin();
        }

        [Test]
        public void ExtensibleStringEnumType()
        {
            var input = new InputEnumType(
                "sampleType",
                "sampleType",
                "public",
                null,
                "sampleType description",
                InputModelTypeUsage.Input,
                InputPrimitiveType.String,
                [new InputEnumTypeValue("value1", "value1", null), new InputEnumTypeValue("value2", "value2", null)],
                true);
            var expected = new CSharpType("SampleType", "Sample.Models", true, false, null, [], true, true, underlyingEnumType: typeof(string));

            var actual = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(input);

            Assert.IsNotNull(actual);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void ExtensibleStringNullableEnumType()
        {
            var input = new InputEnumType(
                "sampleType",
                "sampleType",
                "public",
                null,
                "sampleType description",
                InputModelTypeUsage.Input,
                InputPrimitiveType.String,
                [new InputEnumTypeValue("value1", "value1", null), new InputEnumTypeValue("value2", "value2", null)],
                true);
            var nullableInput = new InputNullableType(input);
            var expected = new CSharpType("SampleType", "Sample.Models", true, true, null, [], true, true, underlyingEnumType: typeof(string));

            var actual = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(nullableInput);

            Assert.IsNotNull(actual);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void ExtensibleStringEnumTypeProvider()
        {
            var input = new InputEnumType(
                "sampleType",
                "sampleType",
                "public",
                null,
                "sampleType description",
                InputModelTypeUsage.Input,
                InputPrimitiveType.String,
                [new InputEnumTypeValue("value1", "value1", null), new InputEnumTypeValue("value2", "value2", null)],
                true);
            var expected = new CSharpType("SampleType", "Sample.Models", true, false, null, [], true, true, underlyingEnumType: typeof(string));

            var enumProvider = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input);

            Assert.IsNotNull(enumProvider);
            Assert.AreEqual(expected, enumProvider!.Type);
        }

        [Test]
        public void FixedStringEnumType()
        {
            var input = new InputEnumType(
                "sampleType",
                "sampleType",
                "public",
                null,
                "sampleType description",
                InputModelTypeUsage.Input,
                InputPrimitiveType.String,
                [new InputEnumTypeValue("value1", "value1", null), new InputEnumTypeValue("value2", "value2", null)],
                false);
            var expected = new CSharpType("SampleType", "Sample.Models", true, false, null, [], true, false, underlyingEnumType: typeof(string));

            var actual = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(input);

            Assert.IsNotNull(actual);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void CreateSameEnum()
        {
            var input = new InputEnumType(
                "sampleType",
                "sampleType",
                "public",
                null,
                "sampleType description",
                InputModelTypeUsage.Input,
                InputPrimitiveType.String,
                [new InputEnumTypeValue("value1", "value1", null), new InputEnumTypeValue("value2", "value2", null)],
                false);
            var expected = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input);

            var actual = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input);

            Assert.IsTrue(ReferenceEquals(expected, actual));
        }

        [Test]
        public void CreateEnum_WithDeclaringType()
        {
            var input = new InputEnumType(
                "sampleType",
                "sampleType",
                "public",
                null,
                "sampleType description",
                InputModelTypeUsage.Input,
                InputPrimitiveType.String,
                [new InputEnumTypeValue("value1", "value1", null), new InputEnumTypeValue("value2", "value2", null)],
                false);
            var declaringType = new Mock<TypeProvider>().Object;
            var expected = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input, declaringType);
            var actual = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input, declaringType);
            Assert.IsTrue(ReferenceEquals(expected, actual));

            // Validate that a new type is created when the declaring type is different
            var declaringType2 = new Mock<TypeProvider>().Object;
            var expected2 = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input, declaringType2);
            var actual2 = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input, declaringType2);
            Assert.IsTrue(ReferenceEquals(expected2, actual2));
            Assert.IsFalse(ReferenceEquals(actual2, actual));

            // finally, validate that the type is not reused when the declaring type is null
            var expected3 = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input);
            var actual3 = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input);
            Assert.IsTrue(ReferenceEquals(expected3, actual3));
            Assert.IsFalse(ReferenceEquals(actual3, actual));
            Assert.IsFalse(ReferenceEquals(actual3, actual2));
        }
    }
}
