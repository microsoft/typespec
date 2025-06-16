// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Utilities;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class EnumProviderTests
    {
        internal const string NewLine = "\n";

        // Validates the int based fixed enum
        [TestCase]
        public void BuildEnumType_ValidateIntBasedFixedEnum()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(int));

            var input = InputFactory.Int32Enum("mockInputEnum", [
                ("One", 1),
                ("Two", 2)
            ]);
            var enumType = EnumProvider.Create(input);
            Assert.IsFalse(enumType is ApiVersionEnumProvider);
            var fields = enumType.Fields;

            Assert.AreEqual(2, fields.Count);
            Assert.AreEqual("One", fields[0].Name);
            Assert.AreEqual("Two", fields[1].Name);
            var value1 = fields[0].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value1);
            Assert.AreEqual(1, value1?.Literal);
            var value2 = fields[1].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value2);
            Assert.AreEqual(2, value2?.Literal);
        }

        // Validates the float based fixed enum
        [TestCase]
        public void BuildEnumType_ValidateFloatBasedFixedEnum()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(float));

            var input = InputFactory.Float32Enum("mockInputEnum", [
                ("One", 1f),
                ("Two", 2f)
            ]);
            var enumType = EnumProvider.Create(input);
            var fields = enumType.Fields;

            Assert.AreEqual(2, fields.Count);
            Assert.AreEqual("One", fields[0].Name);
            Assert.AreEqual("Two", fields[1].Name);
            // non-int based enum does not initialization values.
            Assert.IsNull(fields[0].InitializationValue);
            Assert.IsNull(fields[1].InitializationValue);
        }

        // Validates the string based fixed enum
        [TestCase]
        public void BuildEnumType_ValidateStringBasedFixedEnum()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(string));

            var input = InputFactory.StringEnum("mockInputEnum",
            [
                ("One", "1"),
                ("Two", "2")
            ]);
            var enumType = EnumProvider.Create(input);
            var fields = enumType.Fields;

            Assert.AreEqual(2, fields.Count);
            Assert.AreEqual("One", fields[0].Name);
            Assert.AreEqual("Two", fields[1].Name);
            // non-int based enum does not initialization values.
            Assert.IsNull(fields[0].InitializationValue);
            Assert.IsNull(fields[1].InitializationValue);
        }

        // Validates the api version enum
        [TestCase]
        public void BuildEnumType_ValidateApiVersionEnum()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(string));

            string[] apiVersions = ["2024-07-16", "2024-07-17"];
            var input = InputFactory.Int32Enum(
                "mockInputEnum",
                apiVersions.Select((a, index) => (a, index)),
                usage: InputModelTypeUsage.ApiVersionEnum);

            var enumType = EnumProvider.Create(input);
            Assert.IsTrue(enumType is ApiVersionEnumProvider);

            var fields = enumType.Fields;
            Assert.AreEqual(2, fields.Count);
            Assert.AreEqual(apiVersions[0].ToApiVersionMemberName(), fields[0].Name);
            Assert.AreEqual(apiVersions[1].ToApiVersionMemberName(), fields[1].Name);
            Assert.AreEqual(Snippet.Literal(1), fields[0].InitializationValue);
            Assert.AreEqual(Snippet.Literal(2), fields[1].InitializationValue);
            Assert.AreEqual("ServiceVersion", enumType.Name);
        }

        // Validates the int based extensible enum
        [TestCase]
        public void BuildEnumType_ValidateIntBasedExtensibleEnum()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(int));

            var input = InputFactory.Int32Enum("mockInputEnum",
            [
                ("One", 1),
                ("Two", 2)
            ], isExtensible: true);
            var enumType = EnumProvider.Create(input);
            var fields = enumType.Fields;
            var properties = enumType.Properties;

            // a private field + two values
            Assert.AreEqual(3, fields.Count);
            Assert.AreEqual("_value", fields[0].Name);
            Assert.AreEqual("OneValue", fields[1].Name);
            Assert.AreEqual("TwoValue", fields[2].Name);
            Assert.IsNull(fields[0].InitializationValue);
            var value1 = fields[1].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value1);
            Assert.AreEqual(1, value1?.Literal);
            var value2 = fields[2].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value2);
            Assert.AreEqual(2, value2?.Literal);

            // two properties
            Assert.AreEqual(2, properties.Count);
            Assert.AreEqual("One", properties[0].Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, properties[0].Modifiers);
            Assert.IsInstanceOf<AutoPropertyBody>(properties[0].Body);
            var propertyValue1 = (properties[0].Body as AutoPropertyBody)?.InitializationExpression;
            Assert.IsNotNull(propertyValue1);
            Assert.AreEqual("Two", properties[1].Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, properties[1].Modifiers);
            Assert.IsInstanceOf<AutoPropertyBody>(properties[1].Body);
            var propertyValue2 = (properties[1].Body as AutoPropertyBody)?.InitializationExpression;
            Assert.IsNotNull(propertyValue2);

            ValidateGetHashCodeMethod(enumType);
        }

        // Validates the float based extensible enum
        [TestCase]
        public void BuildEnumType_ValidateFloatBasedExtensibleEnum()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(float));

            var input = InputFactory.Float32Enum("mockInputEnum",
                [
                    ("One", 1f),
                    ("Two", 2f)
                ], isExtensible: true);
            var enumType = EnumProvider.Create(input);
            var fields = enumType.Fields;
            var properties = enumType.Properties;

            // a private field + two values
            Assert.AreEqual(3, fields.Count);
            Assert.AreEqual("_value", fields[0].Name);
            Assert.AreEqual("OneValue", fields[1].Name);
            Assert.AreEqual("TwoValue", fields[2].Name);
            Assert.IsNull(fields[0].InitializationValue);
            var value1 = fields[1].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value1);
            Assert.AreEqual(1f, value1?.Literal);
            var value2 = fields[2].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value2);
            Assert.AreEqual(2f, value2?.Literal);

            // two properties
            Assert.AreEqual(2, properties.Count);
            Assert.AreEqual("One", properties[0].Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, properties[0].Modifiers);
            Assert.IsInstanceOf<AutoPropertyBody>(properties[0].Body);
            var propertyValue1 = (properties[0].Body as AutoPropertyBody)?.InitializationExpression;
            Assert.IsNotNull(propertyValue1);
            Assert.AreEqual("Two", properties[1].Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, properties[1].Modifiers);
            Assert.IsInstanceOf<AutoPropertyBody>(properties[1].Body);
            var propertyValue2 = (properties[1].Body as AutoPropertyBody)?.InitializationExpression;
            Assert.IsNotNull(propertyValue2);

            ValidateGetHashCodeMethod(enumType);
        }

        // Validates the string based extensible enum
        [TestCase]
        public void BuildEnumType_ValidateStringBasedExtensibleEnum()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(string));

            var input = InputFactory.StringEnum("mockInputEnum",
                [
                    ("One", "1"),
                    ("Two", "2")
                ], isExtensible: true);
            var enumType = EnumProvider.Create(input);
            var fields = enumType.Fields;
            var properties = enumType.Properties;

            // a private field + two values
            Assert.AreEqual(3, fields.Count);
            Assert.AreEqual("_value", fields[0].Name);
            Assert.AreEqual("OneValue", fields[1].Name);
            Assert.AreEqual("TwoValue", fields[2].Name);
            Assert.IsNull(fields[0].InitializationValue);
            var value1 = fields[1].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value1);
            Assert.AreEqual("1", value1?.Literal);
            var value2 = fields[2].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value2);
            Assert.AreEqual("2", value2?.Literal);

            // two properties
            Assert.AreEqual(2, properties.Count);
            Assert.AreEqual("One", properties[0].Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, properties[0].Modifiers);
            Assert.IsInstanceOf<AutoPropertyBody>(properties[0].Body);
            var propertyValue1 = (properties[0].Body as AutoPropertyBody)?.InitializationExpression;
            Assert.IsNotNull(propertyValue1);
            Assert.AreEqual("Two", properties[1].Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, properties[1].Modifiers);
            Assert.IsInstanceOf<AutoPropertyBody>(properties[1].Body);
            var propertyValue2 = (properties[1].Body as AutoPropertyBody)?.InitializationExpression;
            Assert.IsNotNull(propertyValue2);

            ValidateGetHashCodeMethod(enumType);
        }

        private static void ValidateGetHashCodeMethod(EnumProvider enumType)
        {
            var getHashCodeMethod = enumType.Methods.Single(m => m.Signature.Name == "GetHashCode");
            Assert.IsNotNull(getHashCodeMethod);
            Assert.AreEqual(1, getHashCodeMethod.Signature.Attributes.Count);
            Assert.AreEqual(
                "global::System.ComponentModel.EditorBrowsableAttribute",
                getHashCodeMethod.Signature.Attributes[0].Type.ToString());
            Assert.AreEqual(
                "global::System.ComponentModel.EditorBrowsableState.Never",
                getHashCodeMethod.Signature.Attributes[0].Arguments[0].ToDisplayString());
        }
    }
}
