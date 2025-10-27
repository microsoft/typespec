// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Net;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class TypeFactoryTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void ExtensibleStringEnumType()
        {
            // Updated to use StringEnum with collection expression for values
            var input = InputFactory.StringEnum(
                "sampleType",
                [("value1", "value1"), ("value2", "value2")],
                isExtensible: true,
                usage: InputModelTypeUsage.Input
            );
            var expected = new CSharpType("SampleType", "Sample.Models", true, false, null, [], true, true, underlyingEnumType: typeof(string));

            var actual = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input);

            Assert.IsNotNull(actual);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void ExtensibleStringNullableEnumType()
        {
            var input = InputFactory.StringEnum(
                "sampleType",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input,
                isExtensible: true);
            var nullableInput = new InputNullableType(input);
            var expected = new CSharpType("SampleType", "Sample.Models", true, true, null, [], true, true, underlyingEnumType: typeof(string));

            var actual = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(nullableInput);

            Assert.IsNotNull(actual);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void ExtensibleStringEnumTypeProvider()
        {
            var input = InputFactory.StringEnum(
                "sampleType",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input,
                isExtensible: true);
            var expected = new CSharpType("SampleType", "Sample.Models", true, false, null, [], true, true, underlyingEnumType: typeof(string));

            var enumProvider = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);

            Assert.IsNotNull(enumProvider);
            Assert.AreEqual(expected, enumProvider!.Type);
        }

        [Test]
        public void FixedStringEnumType()
        {
            // Updated to use StringEnum with collection expression for values
            var input = InputFactory.StringEnum(
                "sampleType",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input
            );
            var expected = new CSharpType("SampleType", "Sample.Models", true, false, null, [], true, false, underlyingEnumType: typeof(string));

            var actual = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input);

            Assert.IsNotNull(actual);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void CreateSameEnum()
        {
            var input = InputFactory.StringEnum(
                "sampleType",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input);
            var expected = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);

            var actual = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);

            Assert.IsTrue(ReferenceEquals(expected, actual));
        }

        [Test]
        public void CreateEnum_WithDeclaringType()
        {
            var input = InputFactory.StringEnum(
                "sampleType",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input);
            var declaringType = new TestTypeProvider();

            var expected = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input, declaringType);
            var actual = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input, declaringType);
            Assert.IsTrue(ReferenceEquals(expected, actual));

            // Validate that a new type is created when the declaring type is different
            var declaringType2 = new TestTypeProvider();
            var expected2 = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input, declaringType2);
            var actual2 = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input, declaringType2);
            Assert.IsTrue(ReferenceEquals(expected2, actual2));
            Assert.IsFalse(ReferenceEquals(actual2, actual));

            // finally, validate that the type is not reused when the declaring type is null
            var expected3 = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);
            var actual3 = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);
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

            Assert.AreEqual(encode == "string" ? SerializationFormat.Int_String : SerializationFormat.Default, CodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(input));
        }

        [TestCase(typeof(Guid))]
        [TestCase(typeof(IPAddress))]
        [TestCase(typeof(BinaryData))]
        [TestCase(typeof(Uri))]
        [TestCase(typeof(JsonElement))]
        public void CreatesFrameworkType(Type expectedType)
        {
            var factory = new TestTypeFactory();

            var actual = factory.InvokeCreateFrameworkType(expectedType.FullName!);
            Assert.AreEqual(expectedType, actual);
        }

        [TestCase("lowercase", "Lowercase")]
        [TestCase("lowercase.namespace", "Lowercase.Namespace")]
        [TestCase("lowercase.namespace.client", "Lowercase.Namespace.Client")]
        [TestCase("PascalCase", "PascalCase")]
        [TestCase("PascalCase.Namespace", "PascalCase.Namespace")]
        [TestCase("camelCase", "CamelCase")]
        [TestCase("camelCase.namespace", "CamelCase.Namespace")]
        [TestCase("kebab-case", "KebabCase")]
        [TestCase("kebab-case.namespace", "KebabCase.Namespace")]
        [TestCase("snake_case", "SnakeCase")]
        [TestCase("snake_case.namespace", "SnakeCase.Namespace")]
        [TestCase("mixed_case-namespace.example", "MixedCaseNamespace.Example")]
        public void GetCleanNameSpace_ConvertsToPascalCase(string input, string expected)
        {
            var actual = CodeModelGenerator.Instance.TypeFactory.GetCleanNameSpace(input);
            Assert.AreEqual(expected, actual);
        }
    }
}
