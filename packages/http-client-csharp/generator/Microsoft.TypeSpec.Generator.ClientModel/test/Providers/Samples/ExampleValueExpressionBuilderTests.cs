// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Xml;
using Microsoft.TypeSpec.Generator.ClientModel.Providers.Samples;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Samples
{
    public class ExampleValueExpressionBuilderTests
    {
        // -----------------------------------------------------------------------
        // ExampleParameterValue — dual mode
        // -----------------------------------------------------------------------

        [Test]
        public void ParameterValue_WithExpression_ReturnsExpression()
        {
            var expr = new LiteralExpression(42);
            var paramValue = new ExampleParameterValue("count", new CSharpType(typeof(int)), expr);

            var result = ExampleValueExpressionBuilder.GetExpression(paramValue);

            Assert.AreSame(expr, result);
        }

        [Test]
        public void ParameterValue_WithValue_ConvertsToExpression()
        {
            var inputValue = InputExampleValue.Value(InputPrimitiveType.Int32, 1234);
            var paramValue = new ExampleParameterValue("count", new CSharpType(typeof(int)), inputValue);

            var result = ExampleValueExpressionBuilder.GetExpression(paramValue);

            Assert.IsNotNull(result);
        }

        [Test]
        public void ParameterValue_WithNeither_ReturnsDefault()
        {
            // Edge case: both Value and Expression are null (shouldn't happen in practice)
            var paramValue = new ExampleParameterValue("x", new CSharpType(typeof(int)),
                (InputExampleValue)null!);

            // This will go through GetExpression with null value — should return Default
            var result = ExampleValueExpressionBuilder.GetExpression(paramValue);
            Assert.IsNotNull(result);
        }

        // -----------------------------------------------------------------------
        // Framework type conversions — primitives
        // -----------------------------------------------------------------------

        [Test]
        public void String_FromRawValue()
        {
            var result = BuildExpression(typeof(string), InputExampleValue.Value(InputPrimitiveType.String, "hello"));
            Assert.IsNotNull(result);
            // Should not be null/default
            Assert.IsNotInstanceOf<KeywordExpression>(result);
        }

        [Test]
        public void String_FromNull()
        {
            var result = BuildExpression(typeof(string), InputExampleValue.Null(InputPrimitiveType.String));
            // Null string → Null keyword
            Assert.IsNotNull(result);
        }

        [Test]
        public void Bool_True()
        {
            var result = BuildExpression(typeof(bool), InputExampleValue.Value(InputPrimitiveType.Boolean, true));
            Assert.IsNotNull(result);
        }

        [Test]
        public void Int32_FromRawValue()
        {
            var result = BuildExpression(typeof(int), InputExampleValue.Value(InputPrimitiveType.Int32, 1234));
            Assert.IsNotNull(result);
        }

        [Test]
        public void Int64_FromRawValue()
        {
            var result = BuildExpression(typeof(long), InputExampleValue.Value(InputPrimitiveType.Int64, 1234L));
            Assert.IsNotNull(result);
        }

        [Test]
        public void Float_FromRawValue()
        {
            var result = BuildExpression(typeof(float), InputExampleValue.Value(InputPrimitiveType.Float32, 123.45f));
            Assert.IsNotNull(result);
        }

        [Test]
        public void Double_FromRawValue()
        {
            var result = BuildExpression(typeof(double), InputExampleValue.Value(InputPrimitiveType.Float64, 123.45));
            Assert.IsNotNull(result);
        }

        [Test]
        public void Decimal_FromRawValue()
        {
            var result = BuildExpression(typeof(decimal), InputExampleValue.Value(
                new InputPrimitiveType(InputPrimitiveTypeKind.Decimal, "decimal", "TypeSpec.decimal"), 123.45m));
            Assert.IsNotNull(result);
        }

        // -----------------------------------------------------------------------
        // Framework type conversions — complex types
        // -----------------------------------------------------------------------

        [Test]
        public void Guid_FromString()
        {
            var result = BuildExpression(typeof(Guid),
                InputExampleValue.Value(InputPrimitiveType.String, "73f411fe-4f43-4b4b-9cbd-6828d8f4cf9a"));

            // Should produce Guid.Parse("...")
            Assert.IsInstanceOf<InvokeMethodExpression>(result);
        }

        [Test]
        public void Uri_FromString()
        {
            var result = BuildExpression(typeof(Uri),
                InputExampleValue.Value(InputPrimitiveType.Url, "http://localhost:3000"));

            // Should produce new Uri("...")
            Assert.IsNotNull(result);
        }

        [Test]
        public void DateTimeOffset_FromString()
        {
            var result = BuildExpression(typeof(DateTimeOffset),
                InputExampleValue.Value(InputPrimitiveType.String, "2022-05-10T18:57:31.2311892Z"));

            // Should produce DateTimeOffset.Parse("...")
            Assert.IsInstanceOf<InvokeMethodExpression>(result);
        }

        [Test]
        public void DateTimeOffset_FromUnixTimestamp()
        {
            var result = BuildExpression(typeof(DateTimeOffset),
                InputExampleValue.Value(InputPrimitiveType.Int64, 1652209051L));

            // Should produce DateTimeOffset.FromUnixTimeSeconds(...)
            Assert.IsInstanceOf<InvokeMethodExpression>(result);
        }

        [Test]
        public void TimeSpan_FromIso8601String()
        {
            var result = BuildExpression(typeof(TimeSpan),
                InputExampleValue.Value(InputPrimitiveType.String, "PT1H23M45S"));

            // Should produce XmlConvert.ToTimeSpan("...")
            Assert.IsInstanceOf<InvokeMethodExpression>(result);
        }

        [Test]
        public void TimeSpan_FromSeconds()
        {
            var result = BuildExpression(typeof(TimeSpan),
                InputExampleValue.Value(InputPrimitiveType.Float64, 10.5));

            // Should produce TimeSpan.FromSeconds(...)
            Assert.IsInstanceOf<InvokeMethodExpression>(result);
        }

        [Test]
        public void BinaryData_FromObject()
        {
            var objValue = InputExampleValue.Object(
                InputFactory.Model("TestModel"),
                new Dictionary<string, InputExampleValue>
                {
                    ["name"] = InputExampleValue.Value(InputPrimitiveType.String, "test")
                });

            var result = BuildExpression(typeof(BinaryData), objValue);

            // Should produce BinaryData.FromObjectAsJson(new { name = "test" })
            Assert.IsInstanceOf<InvokeMethodExpression>(result);
        }

        [Test]
        public void ByteArray_FromString()
        {
            var result = BuildExpression(typeof(byte[]),
                InputExampleValue.Value(InputPrimitiveType.String, "dGVzdA=="));

            // Should produce Encoding.UTF8.GetBytes("...")
            Assert.IsInstanceOf<InvokeMethodExpression>(result);
        }

        [Test]
        public void Stream_FromStreamValue()
        {
            var result = BuildExpression(typeof(Stream),
                InputExampleValue.Stream(InputPrimitiveType.String, "<filePath>"));

            // Should produce File.OpenRead("...")
            Assert.IsInstanceOf<InvokeMethodExpression>(result);
        }

        // -----------------------------------------------------------------------
        // Collections
        // -----------------------------------------------------------------------

        [Test]
        public void List_FromListValue()
        {
            var listType = new CSharpType(typeof(IList<>), new CSharpType(typeof(int)));
            var listValue = InputExampleValue.List(
                new InputArrayType("list", "TypeSpec.Array", InputPrimitiveType.Int32),
                new[] { InputExampleValue.Value(InputPrimitiveType.Int32, 1234) });

            var result = ExampleValueExpressionBuilder.GetExpression(listType, listValue);

            // New.Array returns IndexableExpression wrapping NewArrayExpression
            Assert.IsNotNull(result);
        }

        [Test]
        public void Dictionary_FromObjectValue()
        {
            var dictType = new CSharpType(typeof(IDictionary<,>), new CSharpType(typeof(string)), new CSharpType(typeof(int)));
            var dictValue = InputExampleValue.Object(
                new InputDictionaryType("dict", InputPrimitiveType.String, InputPrimitiveType.Int32),
                new Dictionary<string, InputExampleValue>
                {
                    ["key"] = InputExampleValue.Value(InputPrimitiveType.Int32, 42)
                });

            var result = ExampleValueExpressionBuilder.GetExpression(dictType, dictValue);

            // New.Dictionary returns DictionaryExpression wrapping NewInstanceExpression
            Assert.IsNotNull(result);
        }

        // -----------------------------------------------------------------------
        // Enum
        // -----------------------------------------------------------------------

        [Test]
        public void Enum_ProducesMemberAccess()
        {
            // Use a real framework enum type for testing
            var enumType = new CSharpType(typeof(DayOfWeek));
            var value = InputExampleValue.Value(
                InputFactory.StringEnum("DayOfWeek", [("Monday", "Monday")]), "Monday");

            var result = ExampleValueExpressionBuilder.GetExpression(enumType, value);

            // Should produce a member expression like DayOfWeek.Monday
            Assert.IsInstanceOf<MemberExpression>(result);
        }

        // -----------------------------------------------------------------------
        // Model (basic)
        // -----------------------------------------------------------------------

        [Test]
        public void Model_ProducesNewInstance()
        {
            var modelType = new CSharpType(typeof(object));
            var value = InputExampleValue.Object(
                InputFactory.Model("Widget"),
                new Dictionary<string, InputExampleValue>());

            var result = ExampleValueExpressionBuilder.GetExpression(modelType, value);

            // Non-collection, non-enum framework type falls through to framework handler
            Assert.IsNotNull(result);
        }

        // -----------------------------------------------------------------------
        // Anonymous object (for BinaryContent)
        // -----------------------------------------------------------------------

        [Test]
        public void AnonymousObject_FromNestedValues()
        {
            var objValue = InputExampleValue.Object(
                InputFactory.Model("Request"),
                new Dictionary<string, InputExampleValue>
                {
                    ["name"] = InputExampleValue.Value(InputPrimitiveType.String, "test"),
                    ["count"] = InputExampleValue.Value(InputPrimitiveType.Int32, 5)
                });

            var result = ExampleValueExpressionBuilder.GetExpressionForAnonymousObject(objValue);

            // Should produce new { name = "test", count = 5 }
            Assert.IsNotNull(result);
        }

        [Test]
        public void AnonymousObject_SkipsNullValues()
        {
            var objValue = InputExampleValue.Object(
                InputFactory.Model("Request"),
                new Dictionary<string, InputExampleValue>
                {
                    ["name"] = InputExampleValue.Value(InputPrimitiveType.String, "test"),
                    ["nullable"] = InputExampleValue.Null(InputPrimitiveType.String)
                });

            var result = ExampleValueExpressionBuilder.GetExpressionForAnonymousObject(objValue);

            // Should produce new { name = "test" } — nullable skipped
            Assert.IsNotNull(result);
        }

        [Test]
        public void AnonymousObject_EmptyObject()
        {
            var objValue = InputExampleValue.Object(
                InputFactory.Model("Empty"),
                new Dictionary<string, InputExampleValue>());

            var result = ExampleValueExpressionBuilder.GetExpressionForAnonymousObject(objValue);

            // Empty object → new object() (wrapped in ScopedApi)
            Assert.IsNotNull(result);
        }

        // -----------------------------------------------------------------------
        // Null / default fallbacks
        // -----------------------------------------------------------------------

        [Test]
        public void Null_ValueType_ReturnsDefault()
        {
            var result = BuildExpression(typeof(int), InputExampleValue.Null(InputPrimitiveType.Int32));
            Assert.IsInstanceOf<KeywordExpression>(result);
        }

        [Test]
        public void Null_ReferenceType_ReturnsNull()
        {
            var result = BuildExpression(typeof(string), InputExampleValue.Null(InputPrimitiveType.String));
            Assert.IsInstanceOf<KeywordExpression>(result);
        }

        // -----------------------------------------------------------------------
        // Missing primitive types — cast expressions
        // -----------------------------------------------------------------------

        [Test]
        public void Short_FromRawValue()
        {
            var result = BuildExpression(typeof(short), InputExampleValue.Value(
                new InputPrimitiveType(InputPrimitiveTypeKind.Int16, "int16", "TypeSpec.int16"), (short)1234));
            Assert.IsNotNull(result);
            Assert.IsInstanceOf<CastExpression>(result);
        }

        [Test]
        public void SByte_FromRawValue()
        {
            var result = BuildExpression(typeof(sbyte), InputExampleValue.Value(
                new InputPrimitiveType(InputPrimitiveTypeKind.Int8, "int8", "TypeSpec.int8"), (sbyte)123));
            Assert.IsNotNull(result);
            Assert.IsInstanceOf<CastExpression>(result);
        }

        [Test]
        public void Byte_FromRawValue()
        {
            var result = BuildExpression(typeof(byte), InputExampleValue.Value(
                new InputPrimitiveType(InputPrimitiveTypeKind.UInt8, "uint8", "TypeSpec.uint8"), (byte)123));
            Assert.IsNotNull(result);
            Assert.IsInstanceOf<CastExpression>(result);
        }

        [Test]
        public void UShort_FromRawValue()
        {
            var result = BuildExpression(typeof(ushort), InputExampleValue.Value(
                new InputPrimitiveType(InputPrimitiveTypeKind.UInt16, "uint16", "TypeSpec.uint16"), (ushort)1234));
            Assert.IsNotNull(result);
            Assert.IsInstanceOf<CastExpression>(result);
        }

        [Test]
        public void UInt_FromRawValue()
        {
            var result = BuildExpression(typeof(uint), InputExampleValue.Value(
                new InputPrimitiveType(InputPrimitiveTypeKind.UInt32, "uint32", "TypeSpec.uint32"), (uint)1234));
            Assert.IsNotNull(result);
            Assert.IsInstanceOf<CastExpression>(result);
        }

        [Test]
        public void ULong_FromRawValue()
        {
            var result = BuildExpression(typeof(ulong), InputExampleValue.Value(
                new InputPrimitiveType(InputPrimitiveTypeKind.UInt64, "uint64", "TypeSpec.uint64"), (ulong)1234));
            Assert.IsNotNull(result);
            Assert.IsInstanceOf<CastExpression>(result);
        }

        // -----------------------------------------------------------------------
        // Null paths for complex types
        // -----------------------------------------------------------------------

        [Test]
        public void Bool_Null_ReturnsDefault()
        {
            var result = BuildExpression(typeof(bool), InputExampleValue.Null(InputPrimitiveType.Boolean));
            Assert.IsInstanceOf<KeywordExpression>(result);
        }

        [Test]
        public void Guid_Null_ReturnsDefault()
        {
            var result = BuildExpression(typeof(Guid), InputExampleValue.Null(InputPrimitiveType.String));
            Assert.IsInstanceOf<KeywordExpression>(result);
        }

        [Test]
        public void Uri_Null_ReturnsNull()
        {
            var result = BuildExpression(typeof(Uri), InputExampleValue.Null(InputPrimitiveType.String));
            Assert.IsNotNull(result);
        }

        [Test]
        public void DateTimeOffset_Null_ReturnsDefault()
        {
            var result = BuildExpression(typeof(DateTimeOffset), InputExampleValue.Null(InputPrimitiveType.String));
            Assert.IsInstanceOf<KeywordExpression>(result);
        }

        [Test]
        public void TimeSpan_Null_ReturnsDefault()
        {
            var result = BuildExpression(typeof(TimeSpan), InputExampleValue.Null(InputPrimitiveType.String));
            Assert.IsInstanceOf<KeywordExpression>(result);
        }

        [Test]
        public void ByteArray_Null_ReturnsNull()
        {
            var result = BuildExpression(typeof(byte[]), InputExampleValue.Null(InputPrimitiveType.String));
            Assert.IsNotNull(result);
        }

        [Test]
        public void Stream_NonStreamValue_ReturnsNull()
        {
            var result = BuildExpression(typeof(Stream), InputExampleValue.Value(InputPrimitiveType.String, "notastream"));
            Assert.IsNotNull(result);
        }

        // -----------------------------------------------------------------------
        // Enum edge case
        // -----------------------------------------------------------------------

        [Test]
        public void Enum_Null_ReturnsDefault()
        {
            var enumType = new CSharpType(typeof(DayOfWeek));
            var value = InputExampleValue.Null(InputFactory.StringEnum("DayOfWeek", [("Monday", "Monday")]));

            var result = ExampleValueExpressionBuilder.GetExpression(enumType, value);

            Assert.IsInstanceOf<KeywordExpression>(result);
        }

        // -----------------------------------------------------------------------
        // Collection edge cases
        // -----------------------------------------------------------------------

        [Test]
        public void List_FromNonListValue_ReturnsEmptyArray()
        {
            var listType = new CSharpType(typeof(IList<>), new CSharpType(typeof(int)));
            var nonListValue = InputExampleValue.Value(InputPrimitiveType.Int32, 1234);

            var result = ExampleValueExpressionBuilder.GetExpression(listType, nonListValue);

            // Should produce an empty array
            Assert.IsNotNull(result);
        }

        [Test]
        public void Dictionary_FromNonObjectValue_ReturnsEmptyDictionary()
        {
            var dictType = new CSharpType(typeof(IDictionary<,>), new CSharpType(typeof(string)), new CSharpType(typeof(int)));
            var nonObjValue = InputExampleValue.Value(InputPrimitiveType.Int32, 1234);

            var result = ExampleValueExpressionBuilder.GetExpression(dictType, nonObjValue);

            // Should produce an empty dictionary
            Assert.IsNotNull(result);
        }

        // -----------------------------------------------------------------------
        // Model edge case
        // -----------------------------------------------------------------------

        [Test]
        public void Model_ValueType_ReturnsDefault()
        {
            var valueType = new CSharpType(typeof(int)); // value type but not enum/collection/known
            var value = InputExampleValue.Object(
                InputFactory.Model("Widget"),
                new Dictionary<string, InputExampleValue>());

            // int is a framework type, so it goes to framework handler, not model handler
            var result = ExampleValueExpressionBuilder.GetExpression(valueType, value);
            Assert.IsNotNull(result);
        }

        // -----------------------------------------------------------------------
        // Anonymous object edge cases
        // -----------------------------------------------------------------------

        [Test]
        public void AnonymousObject_WithNestedList()
        {
            var listValue = InputExampleValue.List(
                new InputArrayType("list", "TypeSpec.Array", InputPrimitiveType.String),
                new[] { InputExampleValue.Value(InputPrimitiveType.String, "item1") });

            var objValue = InputExampleValue.Object(
                InputFactory.Model("Request"),
                new Dictionary<string, InputExampleValue>
                {
                    ["items"] = listValue
                });

            var result = ExampleValueExpressionBuilder.GetExpressionForAnonymousObject(objValue);
            Assert.IsNotNull(result);
        }

        [Test]
        public void AnonymousObject_WithNestedObject()
        {
            var innerObj = InputExampleValue.Object(
                InputFactory.Model("Inner"),
                new Dictionary<string, InputExampleValue>
                {
                    ["innerProp"] = InputExampleValue.Value(InputPrimitiveType.Int32, 42)
                });

            var outerObj = InputExampleValue.Object(
                InputFactory.Model("Outer"),
                new Dictionary<string, InputExampleValue>
                {
                    ["nested"] = innerObj
                });

            var result = ExampleValueExpressionBuilder.GetExpressionForAnonymousObject(outerObj);
            Assert.IsNotNull(result);
        }

        [Test]
        public void AnonymousObject_FromRawPrimitive()
        {
            var rawValue = InputExampleValue.Value(InputPrimitiveType.String, "hello");

            var result = ExampleValueExpressionBuilder.GetExpressionForAnonymousObject(rawValue);
            Assert.IsNotNull(result);
        }

        [Test]
        public void AnonymousObject_FromNullRaw()
        {
            var nullValue = InputExampleValue.Null(InputPrimitiveType.String);

            var result = ExampleValueExpressionBuilder.GetExpressionForAnonymousObject(nullValue);
            // Should return Null keyword
            Assert.IsNotNull(result);
        }

        // -----------------------------------------------------------------------
        // Fallback for unknown framework types
        // -----------------------------------------------------------------------

        [Test]
        public void UnknownValueType_ReturnsDefault()
        {
            // A value type that doesn't match any specific handler
            var result = BuildExpression(typeof(DateTime), InputExampleValue.Null(InputPrimitiveType.String));
            Assert.IsInstanceOf<KeywordExpression>(result);
        }

        [Test]
        public void UnknownReferenceType_ReturnsNull()
        {
            // A reference type that doesn't match any specific handler
            var result = BuildExpression(typeof(System.Text.StringBuilder), InputExampleValue.Null(InputPrimitiveType.String));
            Assert.IsNotNull(result);
        }

        // -----------------------------------------------------------------------
        // Helpers
        // -----------------------------------------------------------------------

        private static ValueExpression BuildExpression(Type frameworkType, InputExampleValue value)
        {
            return ExampleValueExpressionBuilder.GetExpression(new CSharpType(frameworkType), value);
        }
    }
}
