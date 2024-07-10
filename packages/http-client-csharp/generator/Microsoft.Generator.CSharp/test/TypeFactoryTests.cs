// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class TypeFactoryTests
    {
        public TypeFactoryTests()
        {
            MockCodeModelPlugin.LoadMockPlugin();
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
            var expected = new CSharpType("SampleType", "Sample.Models", true, true, false, null, null, true);

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
            var expected = new CSharpType("SampleType", "Sample.Models", true, true, true, null, null, true);

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
            var expected = new CSharpType("SampleType", "Sample.Models", true, true, false, null, null, true);

            var enumProvider = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input);

            Assert.IsNotNull(enumProvider);
            Assert.AreEqual(expected, enumProvider.Type);

            var actual = CodeModelPlugin.Instance.TypeFactory.GetProvider(expected);
            Assert.IsNotNull(actual);
            Assert.AreEqual(enumProvider, actual);
            Assert.AreEqual(expected, actual!.Type);
        }
    }
}
