// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    public class FixedEnumTypeProvider : EnumTypeProvider
    {
        private readonly TypeSignatureModifiers _modifiers;

        protected internal FixedEnumTypeProvider(InputEnumType input, SourceInputModel? sourceInputModel) : base(input, sourceInputModel)
        {
            // fixed enums are implemented by enum in C#
            _modifiers = TypeSignatureModifiers.Enum;
            if (input.Accessibility == "internal")
            {
                _modifiers |= TypeSignatureModifiers.Internal;
            }

            Serialization = new FixedEnumSerializationProvider(this);
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _modifiers;

        // we have to build the values first, because the corresponding fieldDeclaration of the values might need all of the existing values to avoid name conflicts
        private protected override IReadOnlyDictionary<EnumTypeValue, FieldDeclaration> BuildValueFields()
        {
            var values = new Dictionary<EnumTypeValue, FieldDeclaration>();
            foreach (var value in Values)
            {
                var modifiers = FieldModifiers.Public | FieldModifiers.Static;
                // the fields for fixed enums are just its members (we use fields to represent the values in a system `enum` type), we just use the name for this field
                var name = value.Name;
                // for fixed enum, we only need it for int values, for other value typed fixed enum, we use the serialization extension method to give the values (because assigning them to enum members cannot compile)
                var initializationValue = IsIntValueType ? Literal(value.Value) : null;
                var field = new FieldDeclaration(
                    Description: FormattableStringHelpers.FromString(value.Description),
                    Modifiers: modifiers,
                    Type: ValueType,
                    Name: name,
                    InitializationValue: initializationValue);
                values.Add(value, field);
            }
            return values;
        }

        protected override FieldDeclaration[] BuildFields()
            => ValueFields.Values.ToArray();

        /// <summary>
        /// This defines a class with extension methods for enums to convert an enum to its underlying value, or from its underlying value to an instance of the enum
        /// </summary>
        private class FixedEnumSerializationProvider : TypeProvider
        {
            private readonly EnumTypeProvider _enumType;

            public FixedEnumSerializationProvider(EnumTypeProvider enumType) : base(null)
            {
                Debug.Assert(!enumType.IsExtensible);

                _enumType = enumType;
                Namespace = _enumType.Namespace;
                Name = $"{_enumType.Name}Extensions";
            }

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

            protected override CSharpMethod[] BuildMethods()
            {
                var methods = new List<CSharpMethod>();
                // serialization method (in some cases we do not need serialization)
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
                    var knownCases = new SwitchCaseExpression[_enumType.Values.Count];
                    for (int i = 0; i < knownCases.Length; i++)
                    {
                        var enumValue = _enumType.Values[i];
                        if (!_enumType.ValueFields.TryGetValue(enumValue, out var enumField))
                        {
                            throw new InvalidOperationException($"Cannot get field on enum {_enumType.Type} from value {enumValue.Name}");
                        }
                        knownCases[i] = new SwitchCaseExpression(new MemberExpression(_enumType.Type, enumField.Name), Literal(enumValue.Value));
                    }
                    var defaultCase = SwitchCaseExpression.Default(ThrowExpression(New.ArgumentOutOfRangeException(_enumType, serializationValueParameter)));
                    var serializationBody = new SwitchExpression(serializationValueParameter, [.. knownCases, defaultCase]);
                    methods.Add(new(serializationSignature, serializationBody));
                }

                // deserialization method (we always need a deserialization)
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

                methods.Add(new(deserializationSignature, deserializationBody));

                return methods.ToArray();
            }
        }
    }
}
