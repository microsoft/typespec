// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
using System;
using System.Globalization;

namespace Microsoft.Generator.CSharp
{
    public readonly struct Constant
    {
        internal static object NewInstanceSentinel { get; } = new object();

        public Constant(object? value, CSharpType type)
        {
            Value = value;
            Type = type;

            if (value == null)
            {
                if (!type.IsNullable)
                {
                    throw new InvalidOperationException($"Null constant with non-nullable type {type}");
                }
            }

            if (value == NewInstanceSentinel || value is Expression)
            {
                return;
            }

            // TODO: Re-enable this check once we have enum type support
            //if (!type.IsFrameworkType &&
            //    type.Implementation is EnumType &&
            //    value != null &&
            //    !(value is EnumTypeValue || value is string))
            //{
            //    throw new InvalidOperationException($"Unexpected value '{value}' for enum type '{type}'");
            //}

            if (value != null && type.IsFrameworkType && value.GetType() != type.FrameworkType)
            {
                throw new InvalidOperationException($"Constant type mismatch. Value type is '{value.GetType()}'. CSharpType is '{type}'.");
            }
        }

        public object? Value { get; }
        public CSharpType Type { get; }
        public bool IsNewInstanceSentinel => Value == NewInstanceSentinel;

        internal static Constant NewInstanceOf(CSharpType type)
        {
            return new Constant(NewInstanceSentinel, type);
        }

        public static Constant Parse(object? value, CSharpType type)
        {
            object? normalizedValue;

            if (!type.IsFrameworkType && type.Implementation is EnumType enumType)
            {
                return Constant.Default(type);

                // Uncomment this when the enums are implemented: https://github.com/Azure/autorest.csharp/issues/4579
                //if (value == null)
                //{
                //    return Constant.Default(type);
                //}

                //var stringValue = Convert.ToString(value);
                //var enumTypeValue = enumType.Values.SingleOrDefault(v => v.Value.Value?.ToString() == stringValue);

                //// Fallback to the string value if we can't find an appropriate enum member (would work only for extensible enums)
                //return new Constant((object?)enumTypeValue ?? stringValue, type);
            }

            Type? frameworkType = type.FrameworkType;
            if (frameworkType == null)
            {
                throw new InvalidOperationException("Only constants of framework type and enums are allowed");
            }

            if (frameworkType == typeof(byte[]) && value is string base64String)
                normalizedValue = Convert.FromBase64String(base64String);
            else if (frameworkType == typeof(BinaryData) && value is string base64String2)
                normalizedValue = BinaryData.FromBytes(Convert.FromBase64String(base64String2));
            else if (frameworkType == typeof(DateTimeOffset) && value is string dateTimeString)
                normalizedValue = DateTimeOffset.Parse(dateTimeString, styles: DateTimeStyles.AssumeUniversal);
            else
                normalizedValue = Convert.ChangeType(value, frameworkType);

            return new Constant(normalizedValue, type);
        }

        internal static Constant FromExpression(FormattableString expression, CSharpType type) => new Constant(new Expression(expression), type);

        internal static Constant Default(CSharpType type)
            => type.IsValueType && !type.IsNullable ? new Constant(NewInstanceSentinel, type) : new Constant(null, type);

        /// <summary>
        /// A <see cref="Constant"/> value type. It represents an expression without any reference (e.g. 'DateTimeOffset.Now')
        /// which looks like a constant.
        /// </summary>
        internal class Expression
        {
            internal Expression(FormattableString expressionValue)
            {
                ExpressionValue = expressionValue;
            }

            public FormattableString ExpressionValue { get; }
        }
    }
}
