// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    /// <summary>
    /// This defines a class with extension methods for enums to convert an enum to its underlying value, or from its underlying value to an instance of the enum
    /// </summary>
    internal class FixedEnumSerializationProvider : TypeProvider
    {
        private readonly InputEnumType _enumType;

        public FixedEnumSerializationProvider(InputEnumType enumType)
        {
            Debug.Assert(!enumType.IsExtensible);
            _enumType = enumType;
        }

        protected override string GetNamespace() => Type.Namespace;

        protected override TypeSignatureModifiers GetDeclarationModifiers() => (TypeSignatureModifiers.Public | TypeSignatureModifiers.ReadOnly | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Struct);
        protected override string BuildRelativeFilePath()
        {
            return Path.Combine("src", "Generated", "Models", $"{Name}.Serialization.cs");
        }

        protected override string BuildName() => $"{_enumType.Name}";

        /// <summary>
        /// Returns if this enum type needs an extension method for serialization
        /// </summary>
        /// <returns></returns>
        private bool NeedsSerializationMethod()
        {
            // fixed enum with int based types, we do not write a method for serialization because it was embedded in the definition
            bool isIntValueType = _enumType.ValueType.Equals(typeof(int)) || _enumType.ValueType.Equals(typeof(long));
            if (!_enumType.IsExtensible && isIntValueType)
                return false;

            // otherwise we need a serialization method with the name of `ToSerial{UnderlyingTypeName}`
            return true;
        }

        protected override MethodProvider[] BuildMethods()
        {
            var methods = new List<MethodProvider>();
            // serialization method (in some cases we do not need serialization)
            if (NeedsSerializationMethod())
            {
                var serializationValueParameter = new ParameterProvider("value", $"The value to serialize.", EnumUnderlyingType);
                var serializationSignature = new MethodSignature(
                    Name: $"ToSerial{_enumType.ValueType.Name}",
                    Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                    ReturnType: EnumUnderlyingType,
                    Parameters: [serializationValueParameter],
                    Description: null, ReturnDescription: null);

                // the fields of an enum type are the values of the enum type
                var knownCases = new SwitchCaseExpression[_enumType.Values.Count];
                for (int i = 0; i < knownCases.Length; i++)
                {
                    var enumValue = EnumValues[i];
                    knownCases[i] = new SwitchCaseExpression(new MemberExpression(EnumUnderlyingType, enumValue.Field.Name), Literal(enumValue.Value));
                }
                var defaultCase = SwitchCaseExpression.Default(ThrowExpression(New.ArgumentOutOfRangeException(this, serializationValueParameter)));
                var serializationBody = new SwitchExpression(serializationValueParameter, [.. knownCases, defaultCase]);
                methods.Add(new(serializationSignature, serializationBody, this));
            }

            // deserialization method (we always need a deserialization)
            var deserializationValueParameter = new ParameterProvider("value", $"The value to deserialize.", EnumUnderlyingType);
            var deserializationSignature = new MethodSignature(
                Name: $"To{Type.Name}",
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                ReturnType: Type,
                Parameters: [deserializationValueParameter],
                Description: null, ReturnDescription: null);

            var value = (ValueExpression)deserializationValueParameter;
            var stringComparer = new MemberExpression(typeof(StringComparer), nameof(StringComparer.OrdinalIgnoreCase));
            var deserializationBody = new List<MethodBodyStatement>();

            // in general, this loop builds up if statements for each value, it looks like:
            // if (<condition>) { return EnumType.TheValue; }
            // the condition could be different depending on the type of the underlying value type of the enum
            for (int i = 0; i < Fields.Count; i++)
            {
                var enumField = Fields[i];
                var enumValue = EnumValues[i];
                ScopedApi<bool> condition;
                if (_enumType.ValueType.Equals(typeof(string)))
                {
                    // when the values are strings, we compare them case-insensitively
                    // this is either
                    // StringComparer.OrdinalIgnoreCase.Equals(value, "<the value>")
                    // or
                    // string.Equals(value, "<the value>", StringComparison.InvariantCultureIgnoreCase)
                    condition = (enumValue.Value is string strValue && strValue.All(char.IsAscii)
                                ? stringComparer.Invoke(nameof(IEqualityComparer<string>.Equals), value, Literal(strValue))
                                : Static(EnumUnderlyingType).Invoke(nameof(Equals), [value, Literal(enumValue.Value), FrameworkEnumValue(StringComparison.InvariantCultureIgnoreCase)]))
                                .As<bool>();
                }
                else
                {
                    // when the values are not strings (it should be numbers), we just compare them using `==` operator, like `value == <the value>`
                    condition = value.Equal(Literal(enumValue.Value));
                }
                deserializationBody.Add(new IfStatement(condition)
                    {
                        Return(new MemberExpression(EnumUnderlyingType, enumField.Name))
                    });
            }

            // add a fallback throw statement to ensure every path of this method returns a value
            deserializationBody.Add(Throw(New.ArgumentOutOfRangeException(this, deserializationValueParameter)));

            methods.Add(new(deserializationSignature, deserializationBody, this));

            return methods.ToArray();
        }

        public ValueExpression ToSerial(ValueExpression enumExpression)
        {
            if (_enumType.ValueType.Equals(typeof(int)) || _enumType.ValueType.Equals(typeof(long)))
            {
                // when the fixed enum is implemented as int, we cast to the value
                return enumExpression.CastTo(EnumUnderlyingType);
            }

            // otherwise we call the corresponding extension method to convert the value
            CSharpType? serializationType = SerializationProviders.FirstOrDefault()?.Type;
            return enumExpression.Invoke($"ToSerial{_enumType.ValueType.Name}");
        }

        public ValueExpression ToEnum(ValueExpression valueExpression)
        {
            return valueExpression.Invoke($"To{Type.Name}");
        }

        protected override bool GetIsEnum() => true;
    }
}
