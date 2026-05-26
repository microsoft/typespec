// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Samples;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Samples
{
    public class ExampleMockValueBuilderTests
    {
        // -----------------------------------------------------------------------
        // BuildOperationExamples — top-level behavior
        // -----------------------------------------------------------------------

        [Test]
        public void BuildOperationExamples_ProducesOneVariant_WhenNoOptionalParameters()
        {
            var operation = InputFactory.Operation("TestOp", parameters: [
                InputFactory.PathParameter("id", InputPrimitiveType.String, isRequired: true)
            ]);

            var examples = ExampleMockValueBuilder.BuildOperationExamples(operation);

            Assert.AreEqual(1, examples.Count);
            Assert.AreEqual(ExampleMockValueBuilder.AllParametersKey, examples[0].Name);
        }

        [Test]
        public void BuildOperationExamples_ProducesTwoVariants_WhenHasOptionalParameters()
        {
            var operation = InputFactory.Operation("TestOp", parameters: [
                InputFactory.PathParameter("id", InputPrimitiveType.String, isRequired: true),
                InputFactory.QueryParameter("filter", InputPrimitiveType.String, isRequired: false)
            ]);

            var examples = ExampleMockValueBuilder.BuildOperationExamples(operation);

            Assert.AreEqual(2, examples.Count);
            Assert.AreEqual(ExampleMockValueBuilder.ShortVersionKey, examples[0].Name);
            Assert.AreEqual(ExampleMockValueBuilder.AllParametersKey, examples[1].Name);
        }

        [Test]
        public void ShortVersion_SkipsOptionalParameters()
        {
            var operation = InputFactory.Operation("TestOp", parameters: [
                InputFactory.PathParameter("requiredId", InputPrimitiveType.String, isRequired: true),
                InputFactory.QueryParameter("optionalFilter", InputPrimitiveType.String, isRequired: false)
            ]);

            var examples = ExampleMockValueBuilder.BuildOperationExamples(operation);
            var shortVersion = examples[0];
            var allParams = examples[1];

            Assert.AreEqual(1, shortVersion.Parameters.Count);
            Assert.AreEqual("requiredId", shortVersion.Parameters[0].Parameter.Name);

            Assert.AreEqual(2, allParams.Parameters.Count);
        }

        [Test]
        public void AllParameters_IncludesOptionalParameters()
        {
            var operation = InputFactory.Operation("TestOp", parameters: [
                InputFactory.PathParameter("requiredId", InputPrimitiveType.String, isRequired: true),
                InputFactory.QueryParameter("optionalFilter", InputPrimitiveType.String, isRequired: false),
                InputFactory.HeaderParameter("optionalHeader", InputPrimitiveType.Int32, isRequired: false)
            ]);

            var examples = ExampleMockValueBuilder.BuildOperationExamples(operation);
            var allParams = examples[1];

            Assert.AreEqual(3, allParams.Parameters.Count);
        }

        [Test]
        public void EmptyFilePath_ForMockExamples()
        {
            var operation = InputFactory.Operation("TestOp", parameters: [
                InputFactory.PathParameter("id", InputPrimitiveType.String, isRequired: true),
                InputFactory.QueryParameter("filter", InputPrimitiveType.String, isRequired: false)
            ]);

            var examples = ExampleMockValueBuilder.BuildOperationExamples(operation);

            Assert.AreEqual(string.Empty, examples[0].FilePath);
            Assert.AreEqual(string.Empty, examples[1].FilePath);
        }

        // -----------------------------------------------------------------------
        // Primitive type mock values
        // -----------------------------------------------------------------------

        [Test]
        public void PrimitiveType_Boolean()
        {
            var value = BuildExampleValueForType(InputPrimitiveType.Boolean);
            AssertRawValue(value, true);
        }

        [Test]
        public void PrimitiveType_Int32()
        {
            var value = BuildExampleValueForType(InputPrimitiveType.Int32);
            AssertRawValue(value, 0);
        }

        [Test]
        public void PrimitiveType_Int64()
        {
            var value = BuildExampleValueForType(InputPrimitiveType.Int64);
            AssertRawValue(value, 0);
        }

        [Test]
        public void PrimitiveType_Float32()
        {
            var value = BuildExampleValueForType(InputPrimitiveType.Float32);
            AssertRawValue(value, 0);
        }

        [Test]
        public void PrimitiveType_Float64()
        {
            var value = BuildExampleValueForType(InputPrimitiveType.Float64);
            AssertRawValue(value, 0);
        }

        [Test]
        public void PrimitiveType_String_WithHint()
        {
            var value = ExampleMockValueBuilder.BuildExampleValue(
                InputPrimitiveType.String, "myParam", false, new HashSet<InputModelType>());

            AssertRawValue(value, "<myParam>");
        }

        [Test]
        public void PrimitiveType_String_WithoutHint()
        {
            var value = ExampleMockValueBuilder.BuildExampleValue(
                InputPrimitiveType.String, null, false, new HashSet<InputModelType>());

            AssertRawValue(value, "<String>");
        }

        [Test]
        public void PrimitiveType_Url()
        {
            var value = BuildExampleValueForType(InputPrimitiveType.Url);
            AssertRawValue(value, "<Url>");
        }

        [Test]
        public void PrimitiveType_PlainDate()
        {
            var value = BuildExampleValueForType(InputPrimitiveType.PlainDate);
            AssertRawValue(value, "<PlainDate>");
        }

        [Test]
        public void PrimitiveType_PlainTime()
        {
            var value = BuildExampleValueForType(InputPrimitiveType.PlainTime);
            AssertRawValue(value, "<PlainTime>");
        }

        [Test]
        public void PrimitiveType_Bytes()
        {
            var value = BuildExampleValueForType(InputPrimitiveType.Base64);
            AssertRawValue(value, "<Bytes>");
        }

        [Test]
        public void PrimitiveType_Uuid_String()
        {
            var uuidType = new InputPrimitiveType(InputPrimitiveTypeKind.String, "string", "TypeSpec.string", "uuid");
            var value = ExampleMockValueBuilder.BuildExampleValue(
                uuidType, "id", false, new HashSet<InputModelType>());

            AssertRawValue(value, "<uuid>");
        }

        // -----------------------------------------------------------------------
        // DateTime mock values
        // -----------------------------------------------------------------------

        [Test]
        public void DateTime_Rfc3339()
        {
            var dateTimeType = new InputDateTimeType(
                DateTimeKnownEncoding.Rfc3339, "dateTime", "TypeSpec.utcDateTime", InputPrimitiveType.String);
            var value = ExampleMockValueBuilder.BuildExampleValue(
                dateTimeType, null, false, new HashSet<InputModelType>());

            AssertRawValue(value, "<Rfc3339>");
        }

        [Test]
        public void DateTime_Rfc7231()
        {
            var dateTimeType = new InputDateTimeType(
                DateTimeKnownEncoding.Rfc7231, "dateTime", "TypeSpec.utcDateTime", InputPrimitiveType.String);
            var value = ExampleMockValueBuilder.BuildExampleValue(
                dateTimeType, null, false, new HashSet<InputModelType>());

            AssertRawValue(value, "<Rfc7231>");
        }

        [Test]
        public void DateTime_UnixTimestamp()
        {
            var dateTimeType = new InputDateTimeType(
                DateTimeKnownEncoding.UnixTimestamp, "dateTime", "TypeSpec.utcDateTime", InputPrimitiveType.Int64);
            var value = ExampleMockValueBuilder.BuildExampleValue(
                dateTimeType, null, false, new HashSet<InputModelType>());

            AssertRawValue(value, 0);
        }

        // -----------------------------------------------------------------------
        // Duration mock values
        // -----------------------------------------------------------------------

        [Test]
        public void Duration_Iso8601()
        {
            var durationType = new InputDurationType(
                DurationKnownEncoding.Iso8601, "duration", "TypeSpec.duration", InputPrimitiveType.String, null);
            var value = ExampleMockValueBuilder.BuildExampleValue(
                durationType, null, false, new HashSet<InputModelType>());

            AssertRawValue(value, "<Iso8601>");
        }

        [Test]
        public void Duration_Seconds_Int32()
        {
            var durationType = new InputDurationType(
                DurationKnownEncoding.Seconds, "duration", "TypeSpec.duration", InputPrimitiveType.Int32, null);
            var value = ExampleMockValueBuilder.BuildExampleValue(
                durationType, null, false, new HashSet<InputModelType>());

            AssertRawValue(value, 0);
        }

        // -----------------------------------------------------------------------
        // Collection mock values
        // -----------------------------------------------------------------------

        [Test]
        public void Array_ProducesSingleElementList()
        {
            var arrayType = new InputArrayType("list", "TypeSpec.Array", InputPrimitiveType.Int32);
            var value = ExampleMockValueBuilder.BuildExampleValue(
                arrayType, null, false, new HashSet<InputModelType>());

            Assert.AreEqual(arrayType, value.Type);
            AssertIsNotRawNull(value);
        }

        [Test]
        public void Dictionary_ProducesSingleKeyEntry()
        {
            var dictType = new InputDictionaryType("dict", InputPrimitiveType.String, InputPrimitiveType.Int32);
            var value = ExampleMockValueBuilder.BuildExampleValue(
                dictType, null, false, new HashSet<InputModelType>());

            Assert.AreEqual(dictType, value.Type);
            AssertIsNotRawNull(value);
        }

        // -----------------------------------------------------------------------
        // Enum mock values
        // -----------------------------------------------------------------------

        [Test]
        public void Enum_ReturnsFirstEnumValue()
        {
            var enumType = InputFactory.StringEnum("Color", [("Red", "red"), ("Blue", "blue")]);
            var value = ExampleMockValueBuilder.BuildExampleValue(
                enumType, null, false, new HashSet<InputModelType>());

            AssertRawValue(value, "red");
        }

        [Test]
        public void Enum_Int32_ReturnsFirstValue()
        {
            var enumType = InputFactory.Int32Enum("Status", [("Active", 1), ("Inactive", 0)]);
            var value = ExampleMockValueBuilder.BuildExampleValue(
                enumType, null, false, new HashSet<InputModelType>());

            AssertRawValue(value, 1);
        }

        // -----------------------------------------------------------------------
        // Literal type
        // -----------------------------------------------------------------------

        [Test]
        public void LiteralType_ReturnsLiteralValue()
        {
            var literalType = InputFactory.Literal.String("fixedValue");
            var value = ExampleMockValueBuilder.BuildExampleValue(
                literalType, null, false, new HashSet<InputModelType>());

            AssertRawValue(value, "fixedValue");
        }

        // -----------------------------------------------------------------------
        // Union type
        // -----------------------------------------------------------------------

        [Test]
        public void UnionType_ReturnsFirstVariant()
        {
            var unionType = new InputUnionType("myUnion", [InputPrimitiveType.String, InputPrimitiveType.Int32]);
            var value = ExampleMockValueBuilder.BuildExampleValue(
                unionType, "field", false, new HashSet<InputModelType>());

            // Should pick the first variant (String) and mock it
            AssertRawValue(value, "<field>");
        }

        // -----------------------------------------------------------------------
        // Nullable type
        // -----------------------------------------------------------------------

        [Test]
        public void NullableType_UnwrapsAndMocksInner()
        {
            var nullableType = new InputNullableType(InputPrimitiveType.Int32);
            var value = ExampleMockValueBuilder.BuildExampleValue(
                nullableType, null, false, new HashSet<InputModelType>());

            AssertRawValue(value, 0);
        }

        // -----------------------------------------------------------------------
        // Model mock values
        // -----------------------------------------------------------------------

        [Test]
        public void Model_PopulatesRequiredProperties()
        {
            var model = InputFactory.Model("Widget", properties: [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("optionalColor", InputPrimitiveType.String, isRequired: false)
            ]);

            var value = ExampleMockValueBuilder.BuildExampleValue(
                model, null, false, new HashSet<InputModelType>());

            Assert.AreEqual(model, value.Type);
            AssertIsNotRawNull(value);
        }

        [Test]
        public void Model_PopulatesAllProperties_WhenUseAll()
        {
            var model = InputFactory.Model("Widget", properties: [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("optionalColor", InputPrimitiveType.String, isRequired: false)
            ]);

            var value = ExampleMockValueBuilder.BuildExampleValue(
                model, null, true, new HashSet<InputModelType>());

            Assert.AreEqual(model, value.Type);
            AssertIsNotRawNull(value);
        }

        [Test]
        public void Model_SkipsReadOnlyProperties()
        {
            var model = InputFactory.Model("Widget", properties: [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("id", InputPrimitiveType.String, isRequired: true, isReadOnly: true)
            ]);

            var value = ExampleMockValueBuilder.BuildExampleValue(
                model, null, true, new HashSet<InputModelType>());

            Assert.AreEqual(model, value.Type);
            AssertIsNotRawNull(value);
        }

        [Test]
        public void Model_IncludesBaseModelProperties()
        {
            var baseModel = InputFactory.Model("BaseWidget", properties: [
                InputFactory.Property("baseField", InputPrimitiveType.String, isRequired: true)
            ]);
            var derivedModel = InputFactory.Model("DerivedWidget", baseModel: baseModel, properties: [
                InputFactory.Property("derivedField", InputPrimitiveType.Int32, isRequired: true)
            ]);

            var value = ExampleMockValueBuilder.BuildExampleValue(
                derivedModel, null, true, new HashSet<InputModelType>());

            AssertIsNotRawNull(value);
        }

        [Test]
        public void Model_CircularReference_ReturnsNull()
        {
            var selfRefModel = InputFactory.Model("Node", properties: [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
            ]);

            // Pre-add to visited set to simulate circular reference
            var visited = new HashSet<InputModelType> { selfRefModel };
            var value = ExampleMockValueBuilder.BuildExampleValue(
                selfRefModel, null, true, visited);

            // Circular reference should produce a null value
            Assert.IsNotNull(value);
            Assert.AreEqual(selfRefModel, value.Type);
        }

        [Test]
        public void Model_WithDiscriminator_ChoosesDerivedType()
        {
            var baseModel = InputFactory.Model("Pet",
                properties: [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true)
                ],
                discriminatedModels: new Dictionary<string, InputModelType>());

            var catModel = InputFactory.Model("Cat",
                discriminatedKind: "cat",
                baseModel: baseModel,
                properties: [
                    InputFactory.Property("meow", InputPrimitiveType.Boolean, isRequired: true)
                ]);

            var value = ExampleMockValueBuilder.BuildExampleValue(
                baseModel, null, true, new HashSet<InputModelType>());

            // Should produce a non-null object value (derived type selected)
            Assert.IsNotNull(value);
            AssertIsNotRawNull(value);
        }

        // -----------------------------------------------------------------------
        // Parameter handling
        // -----------------------------------------------------------------------

        [Test]
        public void Parameter_Endpoint_UsesMockUrl()
        {
            var endpointParam = InputFactory.EndpointParameter("endpoint", InputPrimitiveType.Url, isRequired: true);
            var operation = InputFactory.Operation("TestOp", parameters: [endpointParam]);

            var examples = ExampleMockValueBuilder.BuildOperationExamples(operation);
            var paramExample = examples[0].Parameters[0];

            AssertRawValue(paramExample.ExampleValue, "<Url>");
        }

        [Test]
        public void Parameter_Constant_UsesConstantValue()
        {
            var constParam = InputFactory.HeaderParameter("apiVersion", InputFactory.Literal.String("2024-01-01"),
                isRequired: true, scope: InputParameterScope.Constant,
                defaultValue: InputFactory.Constant.String("2024-01-01"));

            var operation = InputFactory.Operation("TestOp", parameters: [constParam]);

            var examples = ExampleMockValueBuilder.BuildOperationExamples(operation);
            var paramExample = examples[0].Parameters[0];

            AssertRawValue(paramExample.ExampleValue, "2024-01-01");
        }

        [Test]
        public void Parameter_WithDefaultValue_UsesDefault()
        {
            var paramWithDefault = InputFactory.QueryParameter("count", InputPrimitiveType.Int32,
                isRequired: true, defaultValue: new InputConstant(10, InputPrimitiveType.Int32));

            var operation = InputFactory.Operation("TestOp", parameters: [paramWithDefault]);

            var examples = ExampleMockValueBuilder.BuildOperationExamples(operation);
            var paramExample = examples[0].Parameters[0];

            AssertRawValue(paramExample.ExampleValue, 10);
        }

        [Test]
        public void OperationWithNoParameters_ProducesEmptyExamples()
        {
            var operation = InputFactory.Operation("EmptyOp", parameters: []);

            var examples = ExampleMockValueBuilder.BuildOperationExamples(operation);

            Assert.AreEqual(2, examples.Count);
            Assert.AreEqual(0, examples[0].Parameters.Count);
            Assert.AreEqual(0, examples[1].Parameters.Count);
        }

        // -----------------------------------------------------------------------
        // Helpers
        // -----------------------------------------------------------------------

        private static InputExampleValue BuildExampleValueForType(InputType type)
        {
            return ExampleMockValueBuilder.BuildExampleValue(type, null, false, new HashSet<InputModelType>());
        }

        /// <summary>
        /// Asserts that the value is a raw example value matching the expected object.
        /// Since InputExampleRawValue is internal, we use reflection to access RawValue.
        /// </summary>
        private static void AssertRawValue(InputExampleValue value, object expected)
        {
            var expectedValue = InputExampleValue.Value(value.Type, expected);
            Assert.AreEqual(expectedValue.GetType(), value.GetType(),
                $"Expected raw value type but got {value.GetType().Name}");
            var rawValueProp = value.GetType().GetProperty("RawValue");
            Assert.IsNotNull(rawValueProp, "Expected value to have RawValue property");
            var actualRaw = rawValueProp!.GetValue(value);
            Assert.AreEqual(expected, actualRaw);
        }

        /// <summary>
        /// Asserts the value is not a null raw value — it should be a composite type (list, object).
        /// </summary>
        private static void AssertIsNotRawNull(InputExampleValue value)
        {
            var rawValueProp = value.GetType().GetProperty("RawValue");
            if (rawValueProp != null)
            {
                var rawVal = rawValueProp.GetValue(value);
                Assert.IsNotNull(rawVal, "Expected a non-null value but got null (possible circular reference issue)");
            }
        }
    }
}
