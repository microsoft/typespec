// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    /// <summary>
    /// This defines a class with extension methods for enums to convert an enum to its underlying value, or from its underlying value to an instance of the enum
    /// </summary>
    internal class FixedEnumSerializationProvider : TypeProvider
    {
        private readonly EnumProvider _enumType;

        public FixedEnumSerializationProvider(EnumProvider enumType)
        {
            Debug.Assert(!enumType.IsExtensible);

            _enumType = enumType;
            Namespace = _enumType.Namespace;
            Name = $"{_enumType.Name}Extensions";
        }

        protected override string GetFileName() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override TypeSignatureModifiers GetDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static | TypeSignatureModifiers.Partial;

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

        protected override MethodProvider[] BuildMethods()
        {
            var methods = new List<MethodProvider>();
            // serialization method (in some cases we do not need serialization)
            if (NeedsSerializationMethod())
            {
                var serializationValueParameter = new ParameterProvider("value", $"The value to serialize.", _enumType.Type);
                var serializationSignature = new MethodSignature(
                    Name: $"ToSerial{_enumType.ValueType.Name}",
                    Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                    ReturnType: _enumType.ValueType,
                    Parameters: [serializationValueParameter],
                    Summary: null, Description: null, ReturnDescription: null);

                // the fields of an enum type are the values of the enum type
                var knownCases = new SwitchCaseExpression[_enumType.Members.Count];
                for (int i = 0; i < knownCases.Length; i++)
                {
                    var enumValue = _enumType.Members[i];
                    knownCases[i] = new SwitchCaseExpression(new MemberExpression(_enumType.Type, enumValue.Field.Name), Literal(enumValue.Value));
                }
                var defaultCase = SwitchCaseExpression.Default(ThrowExpression(New.ArgumentOutOfRangeException(_enumType, serializationValueParameter)));
                var serializationBody = new SwitchExpression(serializationValueParameter, [.. knownCases, defaultCase]);
                methods.Add(new(serializationSignature, serializationBody));
            }

            // deserialization method (we always need a deserialization)
            var deserializationValueParameter = new ParameterProvider("value", $"The value to deserialize.", _enumType.ValueType);
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
                var enumValue = _enumType.Members[i];
                BoolSnippet condition;
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

            methods.Add(new(deserializationSignature, deserializationBody));

            return methods.ToArray();
        }
    }
}
