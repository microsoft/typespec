// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal class MrwEnumSerializationProvider : TypeProvider
    {
        private readonly EnumTypeProvider _enumType;

        public MrwEnumSerializationProvider(EnumTypeProvider enumType) : base(null)
        {
            _enumType = enumType;
            Namespace = _enumType.Namespace;
            Name = $"{_enumType.Name}Extensions";
            DeclarationModifiers = TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static | TypeSignatureModifiers.Partial;
        }

        public override string Namespace { get; }

        public override string Name { get; }

        /// <summary>
        /// Returns if this enum type needs an extension method for serialization
        /// </summary>
        /// <returns></returns>
        private bool NeedsSerializationMethod()
        {
            // fixed enum with int based types, we do not write a method for serialization because it was embedded in the definition
            if (_enumType is { IsExtensible: false, IsIntValueType: true })
                return false;

            // otherwise we need a serialization method with the name of `ToSerial{UnderlyingTypeName}`
            return true;
        }

        /// <summary>
        /// Returns if this enum type needs an extension method for deserialization
        /// </summary>
        /// <returns></returns>
        private bool NeedsDeserializationMethod()
        {
            // extensible enum we have implicit operators which we use for deserialization from its payload value therefore it does not need a deserialization method here
            if (_enumType is { IsExtensible: true })
                return false;

            return true;
        }

        protected override CSharpMethod[] BuildMethods()
        {
            var methods = new List<CSharpMethod>();
            // serialization method
            if (NeedsSerializationMethod())
            {
                var serializationValueParameter = new Parameter("value", null, _enumType.Type, null, ValidationType.None, null);
                var serializationSignature = new MethodSignature(
                    Name: $"ToSerial{_enumType.ValueType.Name}",
                    Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                    ReturnType: _enumType.ValueType,
                    Parameters: [serializationValueParameter],
                    Summary: null, Description: null, ReturnDescription: null);

                // the fields of an enum type are the values of the enum type
                var knownCases = new SwitchCaseExpression[_enumType.Fields.Count];
                for (int i = 0; i < knownCases.Length; i++)
                {
                    var enumField = _enumType.Fields[i];
                    var enumValue = _enumType.Values[i];
                    knownCases[i] = new SwitchCaseExpression(new MemberExpression(_enumType.Type, enumField.Name), Literal(enumValue.Value));
                }
                var defaultCase = SwitchCaseExpression.Default(ThrowExpression(New.ArgumentOutOfRangeException(_enumType, serializationValueParameter)));
                var serializationBody = new SwitchExpression(serializationValueParameter, [.. knownCases, defaultCase]);
                methods.Add(new(serializationSignature, serializationBody, CSharpMethodKinds.Serialization));
            }

            // deserialization method
            if (NeedsDeserializationMethod())
            {
                var deserializationValueParameter = new Parameter("value", null, _enumType.ValueType, null, ValidationType.None, null);
                var deserializationSignature = new MethodSignature(
                    Name: $"To{_enumType.Type.Name}",
                    Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                    ReturnType: _enumType.Type,
                    Parameters: [deserializationValueParameter],
                    Summary: null, Description: null, ReturnDescription: null);

                var value = (ValueExpression)deserializationValueParameter;
                var stringComparer = new MemberExpression(typeof(StringComparer), nameof(StringComparer.OrdinalIgnoreCase));
                var deserializationBody = new List<MethodBodyStatement>();

                // in general, this loop builds up if statements for each value, it looks like:
                // if (<condition>) { return EnumType.TheValue; }
                // the condition could be different depending on the type of the underlying value type of the enum
                for (int i = 0; i < _enumType.Fields.Count; i++)
                {
                    var enumField = _enumType.Fields[i];
                    var enumValue = _enumType.Values[i];
                    BoolExpression condition;
                    if (_enumType.IsStringValueType)
                    {
                        // when the values are strings, we compare them case-insensitively
                        // this is either
                        // StringComparer.OrdinalIgnoreCase.Equals(value, "<the value>")
                        // or
                        // string.Equals(value, "<the value>", StringComparison.InvariantCultureIgnoreCase)
                        condition = new(enumValue.Value is string strValue && strValue.All(char.IsAscii)
                                    ? stringComparer.Invoke(nameof(IEqualityComparer<string>.Equals), value, Literal(strValue))
                                    : new InvokeStaticMethodExpression(_enumType.ValueType, nameof(object.Equals), [value, Literal(enumValue.Value), FrameworkEnumValue(StringComparison.InvariantCultureIgnoreCase)]));
                    }
                    else
                    {
                        // when the values are not strings (it should be numbers), we just compare them using `==` operator, like `value == <the value>`
                        condition = Equal(value, Literal(enumValue.Value));
                    }
                    deserializationBody.Add(new IfStatement(condition)
                {
                    Return(new MemberExpression(_enumType.Type, enumField.Name))
                });
                }

                // add a fallback throw statement to ensure every path of this method returns a value
                deserializationBody.Add(Throw(New.ArgumentOutOfRangeException(_enumType, deserializationValueParameter)));

                methods.Add(new(deserializationSignature, deserializationBody, CSharpMethodKinds.Serialization));
            }

            return methods.ToArray();
        }
    }
}
