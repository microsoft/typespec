// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
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
            var input = InputFactory.Enum("sampleType", InputPrimitiveType.String, isExtensible: true, usage: InputModelTypeUsage.Input, values:
            [
                InputFactory.EnumMember.String("value1", "value1"),
                InputFactory.EnumMember.String("value2", "value2")
            ]);
            var expected = new CSharpType("SampleType", "Sample.Models", true, false, null, [], true, true, underlyingEnumType: typeof(string));

            var actual = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(input);

            Assert.IsNotNull(actual);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void ExtensibleStringNullableEnumType()
        {
            var input = InputFactory.Enum("sampleType", InputPrimitiveType.String, usage: InputModelTypeUsage.Input, isExtensible: true, values:
            [
                InputFactory.EnumMember.String("value1", "value1"),
                InputFactory.EnumMember.String("value2", "value2")
            ]);
            var nullableInput = new InputNullableType(input);
            var expected = new CSharpType("SampleType", "Sample.Models", true, true, null, [], true, true, underlyingEnumType: typeof(string));

            var actual = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(nullableInput);

            Assert.IsNotNull(actual);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void ExtensibleStringEnumTypeProvider()
        {
            var input = InputFactory.Enum("sampleType", InputPrimitiveType.String, usage: InputModelTypeUsage.Input, isExtensible: true, values:
            [
                InputFactory.EnumMember.String("value1", "value1"),
                InputFactory.EnumMember.String("value2", "value2")
            ]);
            var expected = new CSharpType("SampleType", "Sample.Models", true, false, null, [], true, true, underlyingEnumType: typeof(string));

            var enumProvider = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input);

            Assert.IsNotNull(enumProvider);
            Assert.AreEqual(expected, enumProvider!.Type);
        }

        [Test]
        public void FixedStringEnumType()
        {
            var input = InputFactory.Enum("sampleType", InputPrimitiveType.String, usage: InputModelTypeUsage.Input, values:
            [
                InputFactory.EnumMember.String("value1", "value1"),
                InputFactory.EnumMember.String("value2", "value2")
            ]);
            var expected = new CSharpType("SampleType", "Sample.Models", true, false, null, [], true, false, underlyingEnumType: typeof(string));

            var actual = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(input);

            Assert.IsNotNull(actual);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void CreateSameEnum()
        {
            var input = InputFactory.Enum("sampleType", InputPrimitiveType.String, usage: InputModelTypeUsage.Input, values:
            [
                InputFactory.EnumMember.String("value1", "value1"),
                InputFactory.EnumMember.String("value2", "value2")
            ]);
            var expected = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input);

            var actual = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input);

            Assert.IsTrue(ReferenceEquals(expected, actual));
        }

        [Test]
        public void CreateEnum_WithDeclaringType()
        {
            var input = InputFactory.Enum("sampleType", InputPrimitiveType.String, usage: InputModelTypeUsage.Input, values:
            [
                InputFactory.EnumMember.String("value1", "value1"),
                InputFactory.EnumMember.String("value2", "value2")
            ]);
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

        [Test]
        public void IntSerializationFormat([Values(
            InputPrimitiveTypeKind.Integer,
            InputPrimitiveTypeKind.SafeInt,
            InputPrimitiveTypeKind.Int8,
            InputPrimitiveTypeKind.Int16,
            InputPrimitiveTypeKind.Int32,
            InputPrimitiveTypeKind.Int64,
            InputPrimitiveTypeKind.UInt8,
            InputPrimitiveTypeKind.UInt16,
            InputPrimitiveTypeKind.UInt32,
            InputPrimitiveTypeKind.UInt64
            )] InputPrimitiveTypeKind kind,
            [Values(null, "string")] string? encode)
        {
            var name = kind.ToString().ToLower();
            var input = new InputPrimitiveType(kind, name, $"TypeSpec.{name}", encode, null);

            Assert.AreEqual(encode == "string" ? SerializationFormat.Int_String : SerializationFormat.Default, CodeModelPlugin.Instance.TypeFactory.GetSerializationFormat(input));
        }
    }
}
