// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
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

        [TestCase]
        public void ExtensibleStringEnum_HasNullableImplicitOperator()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(string));

            var input = InputFactory.StringEnum("mockInputEnum",
                [
                    ("One", "1"),
                    ("Two", "2")
                ], isExtensible: true);
            var enumType = EnumProvider.Create(input);

            // String extensible enums should have both nullable and non-nullable implicit operators
            var implicitOperators = enumType.Methods.Where(m => 
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Implicit) && 
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator)).ToList();

            Assert.AreEqual(2, implicitOperators.Count, "String extensible enum should have 2 implicit operators");

            // Verify we have one nullable and one non-nullable operator
#pragma warning disable CS8602 // Dereference of a possibly null reference
            var nullableCount = implicitOperators.Count(op => op.Signature.ReturnType.IsNullable);
            var nonNullableCount = implicitOperators.Count(op => !op.Signature.ReturnType.IsNullable);
#pragma warning restore CS8602
            
            Assert.AreEqual(1, nullableCount, "Should have exactly 1 nullable implicit operator");
            Assert.AreEqual(1, nonNullableCount, "Should have exactly 1 non-nullable implicit operator");
        }

        [TestCase]
        public void ExtensibleIntEnum_HasOnlyNonNullableImplicitOperator()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(int));

            var input = InputFactory.Int32Enum("mockInputEnum",
                [
                    ("One", 1),
                    ("Two", 2)
                ], isExtensible: true);
            var enumType = EnumProvider.Create(input);

            // Int extensible enums should only have the non-nullable implicit operator
            var implicitOperators = enumType.Methods.Where(m => 
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Implicit) && 
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator)).ToList();

            Assert.AreEqual(1, implicitOperators.Count, "Int extensible enum should have only 1 implicit operator");

            // Verify we have one non-nullable and zero nullable operators
#pragma warning disable CS8602 // Dereference of a possibly null reference
            var nullableCount = implicitOperators.Count(op => op.Signature.ReturnType.IsNullable);
            var nonNullableCount = implicitOperators.Count(op => !op.Signature.ReturnType.IsNullable);
#pragma warning restore CS8602
            
            Assert.AreEqual(0, nullableCount, "Should have no nullable implicit operators");
            Assert.AreEqual(1, nonNullableCount, "Should have exactly 1 non-nullable implicit operator");
        }

        [TestCase]
        public void ExtensibleFloatEnum_HasOnlyNonNullableImplicitOperator()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(float));

            var input = InputFactory.Float32Enum("mockInputEnum",
                [
                    ("One", 1f),
                    ("Two", 2f)
                ], isExtensible: true);
            var enumType = EnumProvider.Create(input);

            // Float extensible enums should only have the non-nullable implicit operator
            var implicitOperators = enumType.Methods.Where(m => 
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Implicit) && 
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator)).ToList();

            Assert.AreEqual(1, implicitOperators.Count, "Float extensible enum should have only 1 implicit operator");

            // Verify we have one non-nullable and zero nullable operators
#pragma warning disable CS8602 // Dereference of a possibly null reference
            var nullableCount = implicitOperators.Count(op => op.Signature.ReturnType.IsNullable);
            var nonNullableCount = implicitOperators.Count(op => !op.Signature.ReturnType.IsNullable);
#pragma warning restore CS8602
            
            Assert.AreEqual(0, nullableCount, "Should have no nullable implicit operators");
            Assert.AreEqual(1, nonNullableCount, "Should have exactly 1 non-nullable implicit operator");
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

        // Tests for the new Update method functionality
        [TestCase]
        public void Update_WithEnumValues_UpdatesEnumValues()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(int));

            var input = InputFactory.Int32Enum("mockInputEnum", [
                ("One", 1),
                ("Two", 2)
            ]);
            var enumType = EnumProvider.Create(input);

            // Create new enum values for update
            var newEnumValues = new[]
            {
                new EnumTypeMember("Three", 
                    new FieldProvider(FieldModifiers.Public | FieldModifiers.Static, typeof(int), "Three", enumType, $"Three value"), 
                    3),
                new EnumTypeMember("Four", 
                    new FieldProvider(FieldModifiers.Public | FieldModifiers.Static, typeof(int), "Four", enumType, $"Four value"), 
                    4)
            };

            // Verify initial values
            Assert.AreEqual(2, enumType.EnumValues.Count);
            Assert.AreEqual("One", enumType.EnumValues[0].Name);
            Assert.AreEqual("Two", enumType.EnumValues[1].Name);

            // Update enum values
            enumType.Update(enumValues: newEnumValues);

            // Access the protected property through reflection for testing
            var updatedEnumValuesProperty = typeof(EnumProvider).GetProperty("UpdatedEnumValues", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            var updatedValues = (IReadOnlyList<EnumTypeMember>?)updatedEnumValuesProperty?.GetValue(enumType);

            // Verify the updated values are stored
            Assert.IsNotNull(updatedValues);
            Assert.AreEqual(2, updatedValues!.Count);
            Assert.AreEqual("Three", updatedValues[0].Name);
            Assert.AreEqual("Four", updatedValues[1].Name);
        }

        [TestCase]
        public void Update_WithOtherProperties_CallsBaseUpdate()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(string));

            var input = InputFactory.StringEnum("mockInputEnum", [
                ("Value1", "val1"),
                ("Value2", "val2")
            ]);
            var enumType = EnumProvider.Create(input);

            // Create new methods for update
            var newMethod = new MethodProvider(
                new MethodSignature("TestMethod", $"Test method", MethodSignatureModifiers.Public, typeof(void), null, []),
                Microsoft.TypeSpec.Generator.Snippets.Snippet.Return(),
                enumType);

            // Update with methods
            enumType.Update(methods: [newMethod]);

            // Verify the method was added
            Assert.IsTrue(enumType.Methods.Any(m => m.Signature.Name == "TestMethod"));
        }

        [TestCase]
        public void Update_WithNullEnumValues_DoesNotChangeValues()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(int));

            var input = InputFactory.Int32Enum("mockInputEnum", [
                ("One", 1),
                ("Two", 2)
            ]);
            var enumType = EnumProvider.Create(input);

            // Get initial values
            var initialCount = enumType.EnumValues.Count;
            var initialFirstName = enumType.EnumValues[0].Name;

            // Update with null enum values (should not change anything)
            enumType.Update(enumValues: null);

            // Verify values are unchanged
            Assert.AreEqual(initialCount, enumType.EnumValues.Count);
            Assert.AreEqual(initialFirstName, enumType.EnumValues[0].Name);

            // Verify UpdatedEnumValues is null
            var updatedEnumValuesProperty = typeof(EnumProvider).GetProperty("UpdatedEnumValues", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            var updatedValues = updatedEnumValuesProperty?.GetValue(enumType);
            Assert.IsNull(updatedValues);
        }
    }
}
