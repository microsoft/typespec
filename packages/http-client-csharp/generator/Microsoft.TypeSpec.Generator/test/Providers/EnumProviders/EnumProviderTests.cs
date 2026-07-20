// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// cspell:ignore readded

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Utilities;
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

        [Test]
        public void PublicModelsAreIncludedInAdditionalRootTypes()
        {
            var inputEnum = InputFactory.StringEnum(
                "StringEnum",
                [("One", "1"), ("Two", "2")],
                access: "public");

            MockHelpers.LoadMockGenerator(
                inputEnumTypes: [inputEnum]);

            var enumProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.SingleOrDefault(t => t.Name == "StringEnum") as EnumProvider;
            Assert.IsNotNull(enumProvider);

            var rootTypes = CodeModelGenerator.Instance.AdditionalRootTypes;
            Assert.IsTrue(rootTypes.Contains("Sample.Models.StringEnum"));
        }

        [Test]
        public void InternalModelsAreNotIncludedInAdditionalRootTypes()
        {
            var inputEnum = InputFactory.StringEnum(
                "StringEnum",
                [("One", "1"), ("Two", "2")],
                access: "internal");

            MockHelpers.LoadMockGenerator(
                inputEnumTypes: [inputEnum]);

            var modelProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.SingleOrDefault(t => t.Name == "StringEnum") as EnumProvider;
            Assert.IsNotNull(modelProvider);

            var rootTypes = CodeModelGenerator.Instance.AdditionalRootTypes;
            Assert.IsFalse(rootTypes.Contains("Sample.Models.StringEnum"));
        }

        // Validates that int enum member order is preserved from the last contract when values are reordered
        [Test]
        public async Task BackCompat_IntEnumOrderPreserved()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(int),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Current input has values in DIFFERENT order than last contract (Default first, Recover second)
            var input = InputFactory.Int32Enum("mockInputEnum", [
                ("Default", 0),
                ("Recover", 1),
            ]);

            var enumType = EnumProvider.Create(input);
            Assert.IsFalse(enumType is ApiVersionEnumProvider);

            // Simulate the back-compat processing that CSharpGen performs after visitors
            enumType.EnsureBuilt();
            enumType.ProcessTypeForBackCompatibility();

            var fields = enumType.Fields;
            Assert.AreEqual(2, fields.Count);

            // Order should be preserved from last contract: Recover first, Default second
            Assert.AreEqual("Recover", fields[0].Name);
            Assert.AreEqual("Default", fields[1].Name);

            // Shared members keep their explicit values from the last contract (Recover = 0, Default = 1).
            Assert.AreEqual(0, (fields[0].InitializationValue as LiteralExpression)?.Literal);
            Assert.AreEqual(1, (fields[1].InitializationValue as LiteralExpression)?.Literal);
        }

        // Validates that int enum member order is preserved and new values are appended
        [Test]
        public async Task BackCompat_IntEnumNewValueAppended()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(int),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Current input has different order AND a new value
            var input = InputFactory.Int32Enum("mockInputEnum", [
                ("Default", 0),
                ("Recover", 1),
                ("Third", 2),
            ]);

            var enumType = EnumProvider.Create(input);
            Assert.IsFalse(enumType is ApiVersionEnumProvider);

            // Simulate the back-compat processing that CSharpGen performs after visitors
            enumType.EnsureBuilt();
            enumType.ProcessTypeForBackCompatibility();

            var fields = enumType.Fields;
            Assert.AreEqual(3, fields.Count);

            // Order should be preserved from last contract: Recover first, Default second, new value Third appended
            Assert.AreEqual("Recover", fields[0].Name);
            Assert.AreEqual("Default", fields[1].Name);
            Assert.AreEqual("Third", fields[2].Name);

            // Shared members keep their explicit values from the last contract (Recover = 0, Default = 1).
            Assert.AreEqual(0, (fields[0].InitializationValue as LiteralExpression)?.Literal);
            Assert.AreEqual(1, (fields[1].InitializationValue as LiteralExpression)?.Literal);
            // New value keeps its initialization value from the input
            var value3 = fields[2].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value3);
            Assert.AreEqual(2, value3?.Literal);
        }

        // Verifies that the last contract (reconstructed from Roslyn) exposes each enum member's
        // explicit numeric value, so back-compat can preserve non-contiguous values (e.g. 100, 200,
        // 500) rather than reassigning positional ordinals.
        [Test]
        public async Task BackCompat_LastContractExposesEnumMemberValues()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(int),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var input = InputFactory.Int32Enum("mockInputEnum", [
                ("OneHundred", 100),
                ("TwoHundred", 200),
                ("FiveHundred", 500),
            ]);

            var enumType = EnumProvider.Create(input);
            enumType.EnsureBuilt();

            var lastContractFields = enumType.LastContractView?.Fields;
            Assert.IsNotNull(lastContractFields);
            Assert.AreEqual(3, lastContractFields!.Count);

            var values = lastContractFields.Select(f => (f.InitializationValue as LiteralExpression)?.Literal).ToArray();
            CollectionAssert.AreEqual(new object[] { 100, 200, 500 }, values);
        }

        [Test]
        public async Task BackCompat_IntEnumNonContiguousValuesPreserved()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(int),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var input = InputFactory.Int32Enum("mockInputEnum", [
                ("OneHundred", 100),
                ("TwoHundred", 200),
                ("FiveHundred", 500),
            ]);

            var enumType = EnumProvider.Create(input);
            enumType.EnsureBuilt();
            enumType.ProcessTypeForBackCompatibility();

            var fields = enumType.Fields;
            Assert.AreEqual(3, fields.Count);
            Assert.AreEqual("OneHundred", fields[0].Name);
            Assert.AreEqual("TwoHundred", fields[1].Name);
            Assert.AreEqual("FiveHundred", fields[2].Name);

            // Each member keeps its exact explicit value from the last contract.
            Assert.AreEqual(100, (fields[0].InitializationValue as LiteralExpression)?.Literal);
            Assert.AreEqual(200, (fields[1].InitializationValue as LiteralExpression)?.Literal);
            Assert.AreEqual(500, (fields[2].InitializationValue as LiteralExpression)?.Literal);
        }

        // Validates that an integer enum value removed from the current spec is re-added from the
        // last contract (preserving its explicit numeric value) to keep the previously shipped API.
        [Test]
        public async Task BackCompat_IntEnumRemovedValueReadded()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(int),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Current input has values in different order and removed "Third"
            var input = InputFactory.Int32Enum("mockInputEnum", [
                ("Default", 0),
                ("Recover", 1),
            ]);

            var enumType = EnumProvider.Create(input);
            Assert.IsFalse(enumType is ApiVersionEnumProvider);

            // Simulate the back-compat processing that CSharpGen performs after visitors
            enumType.EnsureBuilt();
            enumType.ProcessTypeForBackCompatibility();

            var fields = enumType.Fields;
            Assert.AreEqual(3, fields.Count);

            // Order preserved from last contract, and the removed "Third" is re-added at its
            // original position.
            Assert.AreEqual("Recover", fields[0].Name);
            Assert.AreEqual("Default", fields[1].Name);
            Assert.AreEqual("Third", fields[2].Name);

            // Shared members keep their explicit values from the last contract (Recover = 0, Default = 1).
            Assert.AreEqual(0, (fields[0].InitializationValue as LiteralExpression)?.Literal);
            Assert.AreEqual(1, (fields[1].InitializationValue as LiteralExpression)?.Literal);

            // The re-added member keeps its explicit numeric value from the last contract.
            var readdedValue = fields[2].InitializationValue as LiteralExpression;
            Assert.IsNotNull(readdedValue);
            Assert.AreEqual(2, readdedValue?.Literal);
        }

        // Validates that a value removed from the MIDDLE of an integer enum is re-added at its
        // original position, preserving both surrounding order and its explicit numeric value.
        [Test]
        public async Task BackCompat_IntEnumRemovedMiddleValueReadded()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(int),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Last contract: Alpha = 0, Beta = 1, Gamma = 2. Current input removes the middle "Beta".
            var input = InputFactory.Int32Enum("mockInputEnum", [
                ("Alpha", 0),
                ("Gamma", 2),
            ]);

            var enumType = EnumProvider.Create(input);
            Assert.IsFalse(enumType is ApiVersionEnumProvider);

            enumType.EnsureBuilt();
            enumType.ProcessTypeForBackCompatibility();

            var fields = enumType.Fields;
            Assert.AreEqual(3, fields.Count);

            // "Beta" is re-added at its original middle position.
            Assert.AreEqual("Alpha", fields[0].Name);
            Assert.AreEqual("Beta", fields[1].Name);
            Assert.AreEqual("Gamma", fields[2].Name);

            // All members keep their explicit last-contract values (Alpha = 0, Beta = 1, Gamma = 2).
            Assert.AreEqual(0, (fields[0].InitializationValue as LiteralExpression)?.Literal);
            var betaValue = fields[1].InitializationValue as LiteralExpression;
            Assert.IsNotNull(betaValue);
            Assert.AreEqual(1, betaValue?.Literal);
            Assert.AreEqual(2, (fields[2].InitializationValue as LiteralExpression)?.Literal);
        }

        // Validates that a value removed from a long-backed integer enum is re-added with its exact
        // (potentially > int.MaxValue) numeric value preserved from the last contract.
        [Test]
        public async Task BackCompat_LongEnumRemovedValueReadded()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(long),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Last contract: Small = 0, Large = 5000000000 (> int.MaxValue). Current removes "Large".
            var input = InputFactory.Int64Enum("mockInputEnum", [
                ("Small", 0),
            ]);

            var enumType = EnumProvider.Create(input);
            Assert.IsFalse(enumType is ApiVersionEnumProvider);

            enumType.EnsureBuilt();
            enumType.ProcessTypeForBackCompatibility();

            var fields = enumType.Fields;
            Assert.AreEqual(2, fields.Count);

            Assert.AreEqual("Small", fields[0].Name);
            Assert.AreEqual("Large", fields[1].Name);

            // The shared member keeps its explicit last-contract value (Small = 0, as a long).
            Assert.AreEqual(0L, (fields[0].InitializationValue as LiteralExpression)?.Literal);

            // The re-added member preserves its long value exactly (not truncated to int).
            var largeValue = fields[1].InitializationValue as LiteralExpression;
            Assert.IsNotNull(largeValue);
            Assert.AreEqual(5000000000L, largeValue?.Literal);
            Assert.IsInstanceOf<long>(largeValue?.Literal);
        }

        // Validates that removed members are NOT re-added for string-backed enums, because the
        // serialized wire value is not recoverable from the last contract (only the C# ordinal is).
        [Test]
        public async Task BackCompat_StringEnumRemovedValueNotReadded()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(string),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Last contract: Recover, Default, Third. Current input removes "Third".
            var input = InputFactory.StringEnum("mockInputEnum", [
                ("Default", "default"),
                ("Recover", "recover"),
            ]);

            var enumType = EnumProvider.Create(input);
            Assert.IsFalse(enumType is ApiVersionEnumProvider);

            enumType.EnsureBuilt();
            enumType.ProcessTypeForBackCompatibility();

            var fields = enumType.Fields;

            // "Third" must NOT be re-added for a string-based enum; only the two current members remain.
            Assert.AreEqual(2, fields.Count);
            Assert.AreEqual("Recover", fields[0].Name);
            Assert.AreEqual("Default", fields[1].Name);
            Assert.IsFalse(fields.Any(f => f.Name == "Third"));

            // String-based enum members never carry an explicit initialization value.
            Assert.IsNull(fields[0].InitializationValue);
            Assert.IsNull(fields[1].InitializationValue);
        }

        // Validates that a removed integer enum member is NOT re-added when its removal is accepted
        // in the ApiCompat baseline (here recorded as an EnumValuesMustMatch suppression), so the
        // generator honors the intentional removal instead of resurrecting it.
        [Test]
        public async Task BackCompat_IntEnumRemovedValueNotReaddedWhenBaselineAccepts()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile();

            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(int),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                apiCompatBaseline: baseline);

            // Last contract: Recover, Default, Third. Current input removes "Third", but the baseline
            // accepts that removal, so it must NOT be re-added.
            var input = InputFactory.Int32Enum("mockInputEnum", [
                ("Default", 0),
                ("Recover", 1),
            ]);

            var enumType = EnumProvider.Create(input);
            Assert.IsFalse(enumType is ApiVersionEnumProvider);

            enumType.EnsureBuilt();
            enumType.ProcessTypeForBackCompatibility();

            var fields = enumType.Fields;
            Assert.AreEqual(2, fields.Count);
            Assert.IsFalse(fields.Any(f => f.Name == "Third"));
            Assert.AreEqual("Recover", fields[0].Name);
            Assert.AreEqual("Default", fields[1].Name);

            // The surviving shared members keep their explicit last-contract values (Recover = 0, Default = 1).
            Assert.AreEqual(0, (fields[0].InitializationValue as LiteralExpression)?.Literal);
            Assert.AreEqual(1, (fields[1].InitializationValue as LiteralExpression)?.Literal);
        }

        // Validates that when a shared integer enum member's value was intentionally changed and the
        // baseline accepts it (recorded as an EnumValuesMustMatch suppression), back-compat honors the
        // CURRENT value instead of restoring the old last-contract value.
        [Test]
        public async Task BackCompat_IntEnumChangedValueHonoredWhenBaselineAccepts()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile();

            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(int),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                apiCompatBaseline: baseline);

            // Last contract: Recover = 0, Default = 5. Current changes Default to 1; the baseline accepts
            // the value change, so back-compat must keep the current value (1) rather than restoring 5.
            var input = InputFactory.Int32Enum("mockInputEnum", [
                ("Default", 1),
                ("Recover", 0),
            ]);

            var enumType = EnumProvider.Create(input);
            Assert.IsFalse(enumType is ApiVersionEnumProvider);

            enumType.EnsureBuilt();
            enumType.ProcessTypeForBackCompatibility();

            var fields = enumType.Fields;
            Assert.AreEqual(2, fields.Count);

            // Order is preserved from the last contract: Recover first, Default second.
            Assert.AreEqual("Recover", fields[0].Name);
            Assert.AreEqual("Default", fields[1].Name);

            // Recover was unchanged, so it keeps its (identical) value of 0.
            Assert.AreEqual(0, (fields[0].InitializationValue as LiteralExpression)?.Literal);

            // Default's accepted value change is honored: the CURRENT value (1) is kept, not the old (5).
            var defaultValue = fields[1].InitializationValue as LiteralExpression;
            Assert.IsNotNull(defaultValue);
            Assert.AreEqual(1, defaultValue?.Literal);
        }

        // Validates that string enum order is also preserved from last contract
        [Test]
        public async Task BackCompat_StringEnumOrderPreserved()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(string),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Current input has values in DIFFERENT order than last contract
            var input = InputFactory.StringEnum("mockInputEnum", [
                ("Default", "default"),
                ("Recover", "recover"),
            ]);

            var enumType = EnumProvider.Create(input);

            // Simulate the back-compat processing that CSharpGen performs after visitors
            enumType.EnsureBuilt();
            enumType.ProcessTypeForBackCompatibility();

            var fields = enumType.Fields;
            Assert.AreEqual(2, fields.Count);

            // Order should be preserved from last contract: Recover first, Default second
            Assert.AreEqual("Recover", fields[0].Name);
            Assert.AreEqual("Default", fields[1].Name);
        }

        [Test]
        public async Task BackCompat_FixedEnumUnderscoresPreserved()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(int),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var input = InputFactory.Int32Enum("mockInputEnum", [
                ("ExistingValue", 0),
                ("Other", 1),
            ]);

            var enumType = EnumProvider.Create(input);
            enumType.EnsureBuilt();
            enumType.ProcessTypeForBackCompatibility();

            var fields = enumType.Fields;
            Assert.AreEqual(2, fields.Count);
            Assert.AreEqual("Existing_Value", fields[0].Name);
            Assert.AreEqual("Other", fields[1].Name);
        }

        [Test]
        public async Task BackCompat_FixedEnumCustomizationTakesPrecedenceOverPreservedUnderscores()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(int),
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(parameters: "Custom"),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(parameters: "Last"));

            var input = InputFactory.Int32Enum("mockInputEnum", [("ExistingValue", 0)]);

            var enumType = EnumProvider.Create(input);
            Assert.IsNotNull(enumType.CustomCodeView);
            Assert.AreEqual("ExistingValue", enumType.CustomCodeView!.Fields.Single().OriginalName);
            Assert.AreEqual("Customized", enumType.CustomCodeView.Fields.Single().Name);
            enumType.EnsureBuilt();
            enumType.Update(
                enumType.Methods,
                enumType.Constructors,
                enumType.Properties,
                enumType.Fields);
            enumType.ProcessTypeForBackCompatibility();

            Assert.AreEqual(0, enumType.Fields.Count);
        }

        [Test]
        public async Task BackCompat_FixedEnumAmbiguousUnderscoreMatchNotApplied()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(int),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var enumValues = new List<InputEnumTypeValue>();
            var input = InputFactory.Enum("mockInputEnum", InputPrimitiveType.Int32, enumValues);
            enumValues.Add(InputFactory.EnumMember.Int32("ExistingValue", 0, input));
            enumValues.Add(InputFactory.EnumMember.Int32("Existing_Value", 1, input, isExactName: true));

            var enumType = EnumProvider.Create(input);
            enumType.EnsureBuilt();
            enumType.ProcessTypeForBackCompatibility();

            var fields = enumType.Fields;
            Assert.AreEqual(3, fields.Count);
            Assert.AreEqual("Existing__Value", fields[0].Name);
            Assert.AreEqual("ExistingValue", fields[1].Name);
            Assert.AreEqual("Existing_Value", fields[2].Name);
        }

        [Test]
        public async Task BackCompat_ExtensibleEnumUnderscoresPreserved()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(string),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var input = InputFactory.StringEnum("mockInputEnum", [
                ("ExistingValue", "existing"),
                ("Other", "other"),
            ], isExtensible: true);

            var enumType = EnumProvider.Create(input);

            Assert.AreEqual("_value", enumType.Fields[0].Name);
            Assert.AreEqual("Existing_ValueValue", enumType.Fields[1].Name);
            Assert.AreEqual("OtherValue", enumType.Fields[2].Name);
            Assert.AreEqual("Existing_Value", enumType.Properties[0].Name);
            Assert.AreEqual("Other", enumType.Properties[1].Name);
        }

        // Verifies that when custom code already implements the underscore-named member (e.g. the
        // user manually re-added 'Existing_Value' pointing at the generated 'ExistingValue'), the
        // underscore back-compat restoration does NOT rename the generated member. Otherwise the
        // generated member would collide with (and effectively remove) the custom implementation.
        [Test]
        public async Task BackCompat_ExtensibleEnumCustomCodeTakesPrecedenceOverPreservedUnderscores()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(string),
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(parameters: "Custom"),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(parameters: "Last"));

            var input = InputFactory.StringEnum("mockInputEnum", [
                ("ExistingValue", "existing"),
                ("Other", "other"),
            ], isExtensible: true);

            var enumType = EnumProvider.Create(input);
            Assert.IsNotNull(enumType.CustomCodeView);
            Assert.IsTrue(enumType.CustomCodeView!.Properties.Any(p => p.Name == "Existing_Value"));

            // The generated member keeps its non-underscore name so the custom 'Existing_Value'
            // member (which references the generated 'ExistingValue') is preserved.
            Assert.AreEqual("ExistingValueValue", enumType.Fields[1].Name);
            Assert.AreEqual("OtherValue", enumType.Fields[2].Name);
            Assert.AreEqual("ExistingValue", enumType.Properties[0].Name);
            Assert.AreEqual("Other", enumType.Properties[1].Name);
        }

        // Verifies that back-compat does NOT re-introduce enum values that have been suppressed
        // via [CodeGenSuppress] or that already exist in user-provided custom code. Without
        // filtering in ProcessTypeForBackCompatibility, the back-compat code would rebuild the
        // field set from EnumValues (which is unfiltered) and overwrite the previously-filtered
        // fields, causing the suppressed/customized values to reappear.
        [Test]
        public async Task BackCompat_FixedEnumSuppressedValueNotReadded()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                createCSharpTypeCore: (inputType) => typeof(int),
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(parameters: "Custom"),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(parameters: "Last"));

            var input = InputFactory.Int32Enum("mockInputEnum", [
                ("One", 1),
                ("Two", 2),
            ]);

            var enumType = EnumProvider.Create(input);
            Assert.IsFalse(enumType is ApiVersionEnumProvider);

            // Sanity check: the custom code view must be matched.
            Assert.IsNotNull(enumType.CustomCodeView, "CustomCodeView should be loaded from the (Custom) directory.");
            Assert.AreEqual("MockInputEnum", enumType.CustomCodeView!.Name);
            // Custom code: enum { Two = 2 } with [CodeGenSuppress("One")]
            Assert.IsTrue(enumType.CustomCodeView.Fields.Any(f => f.Name == "Two"));
            Assert.IsTrue(enumType.CustomCodeView.Attributes.Any(a => a.Type.Name == "CodeGenSuppressAttribute"));

            // Simulate the production pipeline (CSharpGen.ExecuteAsync):
            // 1) EnsureBuilt to populate caches from the spec (no filtering),
            // 2) Update through the FilterAllCustomizedMembers pass to apply [CodeGenSuppress] and
            //    custom-code filtering,
            // 3) ProcessTypeForBackCompatibility to add back-compat members from the last contract.
            enumType.EnsureBuilt();
            enumType.Update(
                enumType.Methods,
                enumType.Constructors,
                enumType.Properties,
                enumType.Fields);

            // After filtering, the generated provider should not emit any enum fields:
            // 'One' is suppressed and 'Two' is provided by the user's custom enum.
            Assert.AreEqual(0, enumType.Fields.Count);

            enumType.ProcessTypeForBackCompatibility();

            // After back-compat, suppressed/customized fields must NOT be re-introduced.
            // The generated provider should still emit no fields, letting the user's custom enum
            // be the source of truth.
            Assert.AreEqual(0, enumType.Fields.Count);

            // _enumValues is kept in sync so back-compat does not leak suppressed values via the
            // EnumValues collection either.
            Assert.AreEqual(0, enumType.EnumValues.Count);
        }

        // Validates that an IsExactName-marked value on a fixed string-based enum preserves its
        // exact-case name (skipping .ToIdentifierName()) on the generated field.
        [TestCase]
        public void BuildEnumType_FixedStringEnum_IsExactNameValuePreserved()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(string));

            var enumValues = new System.Collections.Generic.List<InputEnumTypeValue>();
            var enumType = InputFactory.Enum(
                "mockInputEnum",
                InputPrimitiveType.String,
                enumValues);
            enumValues.Add(InputFactory.EnumMember.String("One", "1", enumType));
            enumValues.Add(InputFactory.EnumMember.String("snake_case_value", "2", enumType, isExactName: true));

            var enumProvider = EnumProvider.Create(enumType);
            var fields = enumProvider.Fields;

            Assert.AreEqual(2, fields.Count);
            // first value is not exact-name, regular casing applies
            Assert.AreEqual("One", fields[0].Name);
            // second value is exact-name, the spec name is preserved verbatim (no PascalCasing)
            Assert.AreEqual("snake_case_value", fields[1].Name);
        }

        // Validates that an IsExactName-marked value on a fixed int-based enum preserves its
        // exact-case name (skipping .ToIdentifierName()) on the generated field.
        [TestCase]
        public void BuildEnumType_FixedIntEnum_IsExactNameValuePreserved()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(int));

            var enumValues = new System.Collections.Generic.List<InputEnumTypeValue>();
            var enumType = InputFactory.Enum(
                "mockInputEnum",
                InputPrimitiveType.Int32,
                enumValues);
            enumValues.Add(InputFactory.EnumMember.Int32("One", 1, enumType));
            enumValues.Add(InputFactory.EnumMember.Int32("snake_case_value", 2, enumType, isExactName: true));

            var enumProvider = EnumProvider.Create(enumType);
            var fields = enumProvider.Fields;

            Assert.AreEqual(2, fields.Count);
            Assert.AreEqual("One", fields[0].Name);
            Assert.AreEqual("snake_case_value", fields[1].Name);
        }

        // Validates that an IsExactName-marked value on an extensible string-based enum preserves
        // its exact-case name (skipping .ToIdentifierName()) on both the generated field (with
        // the `Value` suffix appended) and the generated public property.
        [TestCase]
        public void BuildEnumType_ExtensibleStringEnum_IsExactNameValuePreserved()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(string));

            var enumValues = new System.Collections.Generic.List<InputEnumTypeValue>();
            var enumType = InputFactory.Enum(
                "mockInputEnum",
                InputPrimitiveType.String,
                enumValues,
                isExtensible: true);
            enumValues.Add(InputFactory.EnumMember.String("One", "1", enumType));
            enumValues.Add(InputFactory.EnumMember.String("snake_case_value", "2", enumType, isExactName: true));

            var enumProvider = EnumProvider.Create(enumType);
            var fields = enumProvider.Fields;
            var properties = enumProvider.Properties;

            // a private `_value` field + two values
            Assert.AreEqual(3, fields.Count);
            Assert.AreEqual("_value", fields[0].Name);
            Assert.AreEqual("OneValue", fields[1].Name);
            // exact-name value: name preserved verbatim, with the `Value` suffix appended
            Assert.AreEqual("snake_case_valueValue", fields[2].Name);

            Assert.AreEqual(2, properties.Count);
            Assert.AreEqual("One", properties[0].Name);
            Assert.AreEqual("snake_case_value", properties[1].Name);
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

        [Test]
        public void ValidateGeneratedIntFixedEnum()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(int));

            var input = InputFactory.Int32Enum("WeatherIconCode", [
                ("Sunny", 1),
                ("MostlySunny", 2),
                ("PartlyCloudy", 3),
            ]);

            var enumType = EnumProvider.Create(input);
            var content = new TypeProviderWriter(enumType).Write().Content;

            Assert.AreEqual(Helpers.GetExpectedFromFile(), content);
        }

        [Test]
        public void ValidateGeneratedLongFixedEnum()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(long));

            var input = InputFactory.Int64Enum("WeatherTimestamp", [
                ("Epoch", 0L),
                ("Y2K", 946684800L),
                ("MaxValue", long.MaxValue),
            ]);

            var enumType = EnumProvider.Create(input);
            var content = new TypeProviderWriter(enumType).Write().Content;

            Assert.AreEqual(Helpers.GetExpectedFromFile(), content);
        }

        [Test]
        public void ValidateGeneratedFloatFixedEnum()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => typeof(float));

            var input = InputFactory.Float32Enum("TemperatureScale", [
                ("OneDotOne", 1.1f),
                ("TwoDotTwo", 2.2f),
                ("FourDotFour", 4.4f),
            ]);

            var enumType = EnumProvider.Create(input);
            var content = new TypeProviderWriter(enumType).Write().Content;

            Assert.AreEqual(Helpers.GetExpectedFromFile(), content);
        }

        [TestCase("byte")]
        [TestCase("sbyte")]
        [TestCase("short")]
        [TestCase("ushort")]
        [TestCase("int")]
        [TestCase("uint")]
        [TestCase("long")]
        [TestCase("ulong")]
        [TestCase("float")]
        [TestCase("double")]
        [TestCase("string")]
        public void FixedEnumBaseType_OnlyEmittedForAllowedIntegralTypes(string underlyingKeyword)
        {
            var underlying = underlyingKeyword switch
            {
                "byte" => typeof(byte),
                "sbyte" => typeof(sbyte),
                "short" => typeof(short),
                "ushort" => typeof(ushort),
                "int" => typeof(int),
                "uint" => typeof(uint),
                "long" => typeof(long),
                "ulong" => typeof(ulong),
                "float" => typeof(float),
                "double" => typeof(double),
                "string" => typeof(string),
                _ => throw new ArgumentOutOfRangeException(nameof(underlyingKeyword)),
            };

            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (_) => underlying);

            var input = InputFactory.Int32Enum("MockEnum", [("One", 1), ("Two", 2)]);
            var enumType = EnumProvider.Create(input);
            var content = new TypeProviderWriter(enumType).Write().Content;

            Assert.AreEqual(Helpers.GetExpectedFromFile(underlyingKeyword), content);
        }
    }
}
