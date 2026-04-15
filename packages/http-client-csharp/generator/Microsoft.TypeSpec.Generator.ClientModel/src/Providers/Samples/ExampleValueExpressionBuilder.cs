// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Xml;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers.Samples
{
    /// <summary>
    /// Converts <see cref="InputExampleValue"/> + <see cref="CSharpType"/> into <see cref="ValueExpression"/> (C# AST nodes).
    /// This is the bridge between raw mock/spec example data and generated C# code.
    /// </summary>
    public static class ExampleValueExpressionBuilder
    {
        /// <summary>
        /// Converts an <see cref="ExampleParameterValue"/> to a C# expression.
        /// If the parameter has a pre-built expression, returns it directly.
        /// Otherwise, converts the raw <see cref="InputExampleValue"/> using type information.
        /// </summary>
        public static ValueExpression GetExpression(ExampleParameterValue parameterValue)
        {
            if (parameterValue.Expression != null)
                return parameterValue.Expression;

            if (parameterValue.Value != null)
                return GetExpression(parameterValue.Type, parameterValue.Value);

            return Default;
        }

        /// <summary>
        /// Converts an <see cref="InputExampleValue"/> to a C# expression based on the target <see cref="CSharpType"/>.
        /// </summary>
        public static ValueExpression GetExpression(CSharpType type, InputExampleValue exampleValue)
        {
            if (type.IsList)
                return GetExpressionForList(type, exampleValue);
            if (type.IsDictionary)
                return GetExpressionForDictionary(type, exampleValue);
            if (type.IsEnum)
                return GetExpressionForEnum(type, exampleValue);
            if (type is { IsFrameworkType: true })
                return GetExpressionForFrameworkType(type.FrameworkType, exampleValue);

            // For model types, fall back to default
            return GetExpressionForModel(type, exampleValue);
        }

        private static ValueExpression GetExpressionForFrameworkType(Type frameworkType, InputExampleValue exampleValue)
        {
            var rawValue = GetRawValue(exampleValue);

            // String
            if (frameworkType == typeof(string))
            {
                return rawValue is string s ? Literal(s) : Null;
            }

            // Boolean
            if (frameworkType == typeof(bool))
            {
                return rawValue is bool b ? Literal(b) : Default;
            }

            // Integer types
            if (frameworkType == typeof(int))
            {
                return rawValue != null ? Literal(Convert.ToInt32(rawValue)) : Default;
            }
            if (frameworkType == typeof(long))
            {
                return rawValue != null ? Literal(Convert.ToInt64(rawValue)) : Default;
            }
            if (frameworkType == typeof(short))
            {
                return rawValue != null ? new CastExpression(Literal(Convert.ToInt16(rawValue)), frameworkType) : Default;
            }
            if (frameworkType == typeof(sbyte))
            {
                return rawValue != null ? new CastExpression(Literal(Convert.ToSByte(rawValue)), frameworkType) : Default;
            }
            if (frameworkType == typeof(byte))
            {
                return rawValue != null ? new CastExpression(Literal(Convert.ToByte(rawValue)), frameworkType) : Default;
            }
            if (frameworkType == typeof(ushort))
            {
                return rawValue != null ? new CastExpression(Literal(Convert.ToUInt16(rawValue)), frameworkType) : Default;
            }
            if (frameworkType == typeof(uint))
            {
                return rawValue != null ? new CastExpression(Literal(Convert.ToUInt32(rawValue)), frameworkType) : Default;
            }
            if (frameworkType == typeof(ulong))
            {
                return rawValue != null ? new CastExpression(Literal(Convert.ToUInt64(rawValue)), frameworkType) : Default;
            }

            // Float types
            if (frameworkType == typeof(float))
            {
                return rawValue != null ? Literal(Convert.ToSingle(rawValue)) : Default;
            }
            if (frameworkType == typeof(double))
            {
                return rawValue != null ? Literal(Convert.ToDouble(rawValue)) : Default;
            }
            if (frameworkType == typeof(decimal))
            {
                return rawValue != null ? Literal(Convert.ToDecimal(rawValue)) : Default;
            }

            // Guid
            if (frameworkType == typeof(Guid))
            {
                if (rawValue is string s)
                    return Static(typeof(Guid)).Invoke(nameof(Guid.Parse), Literal(s));
                return Default;
            }

            // Uri
            if (frameworkType == typeof(Uri))
            {
                if (rawValue is string s)
                    return New.Instance(typeof(Uri), Literal(s));
                return Null;
            }

            // DateTimeOffset
            if (frameworkType == typeof(DateTimeOffset))
            {
                if (rawValue is string s)
                    return Static(typeof(DateTimeOffset)).Invoke(nameof(DateTimeOffset.Parse), Literal(s));
                if (rawValue is int or long)
                    return Static(typeof(DateTimeOffset)).Invoke(nameof(DateTimeOffset.FromUnixTimeSeconds), Literal(Convert.ToInt64(rawValue)));
                return Default;
            }

            // TimeSpan
            if (frameworkType == typeof(TimeSpan))
            {
                if (rawValue is string s)
                    return Static(typeof(XmlConvert)).Invoke(nameof(XmlConvert.ToTimeSpan), Literal(s));
                if (rawValue is int or float or double)
                    return Static(typeof(TimeSpan)).Invoke(nameof(TimeSpan.FromSeconds), Literal(Convert.ToDouble(rawValue)));
                return Default;
            }

            // BinaryData
            if (frameworkType == typeof(BinaryData))
            {
                if (rawValue == null && exampleValue is not InputExampleValue)
                    return Null;
                return GetExpressionForBinaryData(exampleValue);
            }

            // byte[]
            if (frameworkType == typeof(byte[]))
            {
                if (rawValue is string s)
                    return Static(typeof(Encoding)).Property(nameof(Encoding.UTF8))
                        .Invoke(nameof(Encoding.GetBytes), Literal(s));
                return Null;
            }

            // Stream
            if (frameworkType == typeof(Stream))
            {
                if (exampleValue is InputExampleStreamValue streamValue)
                    return Static(typeof(File)).Invoke(nameof(File.OpenRead), Literal(streamValue.Filename));
                return Null;
            }

            // Fallback
            return frameworkType.IsValueType ? Default : Null;
        }

        private static ValueExpression GetExpressionForList(CSharpType listType, InputExampleValue exampleValue)
        {
            var elementType = listType.ElementType;
            var items = new List<ValueExpression>();

            if (exampleValue is InputExampleListValue listValue)
            {
                foreach (var itemValue in listValue.Values)
                {
                    items.Add(GetExpression(elementType, itemValue));
                }
            }

            return New.Array(elementType, items.ToArray());
        }

        private static ValueExpression GetExpressionForDictionary(CSharpType dictionaryType, InputExampleValue exampleValue)
        {
            var keyType = dictionaryType.Arguments[0];
            var valueType = dictionaryType.Arguments[1];
            var entries = new Dictionary<ValueExpression, ValueExpression>();

            if (exampleValue is InputExampleObjectValue objectValue)
            {
                foreach (var (key, value) in objectValue.Values)
                {
                    var keyExpr = GetExpression(keyType, InputExampleValue.Value(new InputPrimitiveType(InputPrimitiveTypeKind.String, "string", "TypeSpec.string"), key));
                    var valueExpr = GetExpression(valueType, value);
                    entries[keyExpr] = valueExpr;
                }
            }

            return New.Dictionary(keyType, valueType, entries);
        }

        private static ValueExpression GetExpressionForEnum(CSharpType enumType, InputExampleValue exampleValue)
        {
            var rawValue = GetRawValue(exampleValue);
            if (rawValue == null)
                return Default;

            // Access the enum member by name using the type reference
            var rawString = rawValue.ToString()!;
            // Use the type name as a static access point: EnumType.MemberName
            return new MemberExpression(Static(enumType), rawString);
        }

        private static ValueExpression GetExpressionForModel(CSharpType type, InputExampleValue exampleValue)
        {
            // For model types, generate new ModelType() — will be enhanced in M3/M4
            // with constructor parameter analysis
            if (type.IsValueType)
                return Default;
            return New.Instance(type);
        }

        private static ValueExpression GetExpressionForBinaryData(InputExampleValue exampleValue)
        {
            // Build an anonymous object from the example value and wrap in BinaryData.FromObjectAsJson
            var anonymousObj = GetExpressionForAnonymousObject(exampleValue);
            return Static(typeof(BinaryData)).Invoke(nameof(BinaryData.FromObjectAsJson), anonymousObj);
        }

        /// <summary>
        /// Converts an example value to an anonymous object expression for use in
        /// BinaryData.FromObjectAsJson() or BinaryContent.Create().
        /// </summary>
        internal static ValueExpression GetExpressionForAnonymousObject(InputExampleValue exampleValue)
        {
            if (exampleValue is InputExampleObjectValue objectValue)
            {
                var properties = new Dictionary<ValueExpression, ValueExpression>();
                foreach (var (key, value) in objectValue.Values)
                {
                    var rawVal = GetRawValue(value);
                    // Skip null properties in anonymous objects (causes compilation errors)
                    if (rawVal == null && value is InputExampleRawValue)
                        continue;

                    var valueExpr = GetExpressionForAnonymousObject(value);
                    properties[Identifier(key)] = valueExpr;
                }
                return properties.Count > 0 ? New.Anonymous(properties) : New.Instance(typeof(object));
            }

            if (exampleValue is InputExampleListValue listValue)
            {
                var items = new List<ValueExpression>();
                foreach (var item in listValue.Values)
                {
                    items.Add(GetExpressionForAnonymousObject(item));
                }
                return New.Array(new CSharpType(typeof(object)), items.ToArray());
            }

            if (exampleValue is InputExampleStreamValue streamValue)
            {
                return Static(typeof(File)).Invoke(nameof(File.OpenRead), Literal(streamValue.Filename));
            }

            // Raw value — convert to literal
            var raw = GetRawValue(exampleValue);
            if (raw == null)
                return Null;

            return raw switch
            {
                string s => Literal(s),
                bool b => Literal(b),
                int i => Literal(i),
                long l => Literal(l),
                float f => Literal(f),
                double d => Literal(d),
                decimal m => Literal(m),
                _ => Literal(raw.ToString()!)
            };
        }

        /// <summary>
        /// Extracts the raw value from an <see cref="InputExampleValue"/> if it's a raw (primitive) value.
        /// Returns null for non-raw values (lists, objects, streams).
        /// </summary>
        private static object? GetRawValue(InputExampleValue exampleValue)
        {
            if (exampleValue is InputExampleRawValue rawValue)
                return rawValue.RawValue;
            return null;
        }
    }
}
