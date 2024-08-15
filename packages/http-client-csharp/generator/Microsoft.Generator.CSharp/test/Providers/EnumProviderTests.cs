// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Text;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    public class EnumProviderTests
    {
        internal const string NewLine = "\n";

        // Validates the int based fixed enum
        [TestCase]
        public void BuildEnumType_ValidateIntBasedFixedEnum()
        {
            MockHelpers.LoadMockPlugin(createCSharpTypeCore: (inputType) => typeof(int));

            var input = InputFactory.Enum("mockInputEnum", InputPrimitiveType.Int32, values:
            [
                InputFactory.EnumMember.Int32("One", 1),
                InputFactory.EnumMember.Int32("Two", 2)
            ]);
            var enumType = EnumProvider.Create(input);
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
            MockHelpers.LoadMockPlugin(createCSharpTypeCore: (inputType) => typeof(float));

            var input = InputFactory.Enum("mockInputEnum", InputPrimitiveType.Float32, values:
            [
                InputFactory.EnumMember.Float32("One", 1f),
                InputFactory.EnumMember.Float32("Two", 2f)
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
            MockHelpers.LoadMockPlugin(createCSharpTypeCore: (inputType) => typeof(string));

            var input = InputFactory.Enum("mockInputEnum", InputPrimitiveType.String, values:
            [
                InputFactory.EnumMember.String("One", "1"),
                InputFactory.EnumMember.String("Two", "2")
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
            MockHelpers.LoadMockPlugin(createCSharpTypeCore: (inputType) => typeof(string));
            
            string[] apiVersions = ["2024-07-16", "2024-07-17"];
            var input = InputFactory.Enum("mockInputEnum", InputPrimitiveType.Int32, usage: InputModelTypeUsage.ApiVersionEnum, values:
            [
                InputFactory.EnumMember.Int32(apiVersions[0], 1),
                InputFactory.EnumMember.Int32(apiVersions[1], 2)
            ]);
            var enumType = EnumProvider.Create(input);
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
            MockHelpers.LoadMockPlugin(createCSharpTypeCore: (inputType) => typeof(int));

            var input = InputFactory.Enum("mockInputEnum", InputPrimitiveType.Int32, isExtensible: true, values:
            [
                InputFactory.EnumMember.Int32("One", 1),
                InputFactory.EnumMember.Int32("Two", 2)
            ]);
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
        }

        // Validates the float based extensible enum
        [TestCase]
        public void BuildEnumType_ValidateFloatBasedExtensibleEnum()
        {
            MockHelpers.LoadMockPlugin(createCSharpTypeCore: (inputType) => typeof(float));

            var input = InputFactory.Enum("mockInputEnum", InputPrimitiveType.Float32, isExtensible: true, values:
            [
                InputFactory.EnumMember.Float32("One", 1f),
                InputFactory.EnumMember.Float32("Two", 2f)
            ]);
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
        }

        // Validates the string based extensible enum
        [TestCase]
        public void BuildEnumType_ValidateStringBasedExtensibleEnum()
        {
            MockHelpers.LoadMockPlugin(createCSharpTypeCore: (inputType) => typeof(string));

            var input = InputFactory.Enum("mockInputEnum", InputPrimitiveType.String, isExtensible: true, values:
            [
                InputFactory.EnumMember.String("One", "1"),
                InputFactory.EnumMember.String("Two", "2")
            ]);
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
        }
    }
}
