// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
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
                new InputPrimitiveType(InputPrimitiveTypeKind.String),
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
                new InputPrimitiveType(InputPrimitiveTypeKind.String, null, true),
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
                new InputPrimitiveType(InputPrimitiveTypeKind.String),
                [new InputEnumTypeValue("value1", "value1", null), new InputEnumTypeValue("value2", "value2", null)],
                true);
            var expected = new CSharpType("SampleType", "Sample.Models", true, false, null, [], true, true, underlyingEnumType: typeof(string));

            var enumProvider = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input);

            Assert.IsNotNull(enumProvider);
            Assert.AreEqual(expected, enumProvider.Type);
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
                new InputPrimitiveType(InputPrimitiveTypeKind.String),
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
                new InputPrimitiveType(InputPrimitiveTypeKind.String),
                [new InputEnumTypeValue("value1", "value1", null), new InputEnumTypeValue("value2", "value2", null)],
                false);
            var expected = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input);

            var actual = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input);

            Assert.IsTrue(ReferenceEquals(expected, actual));
        }
    }
}
