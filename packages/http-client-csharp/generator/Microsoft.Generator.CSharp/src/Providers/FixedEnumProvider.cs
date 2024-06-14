// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    internal sealed class FixedEnumProvider : EnumProvider
    {
        private readonly IReadOnlyList<InputEnumTypeValue> _allowedValues;
        private readonly TypeSignatureModifiers _modifiers;

        internal FixedEnumProvider(InputEnumType input) : base(input)
        {
            _allowedValues = input.Values;

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
        protected override IReadOnlyList<EnumTypeMember> BuildMembers()
        {
            var values = new EnumTypeMember[_allowedValues.Count];
            for (int i = 0; i < _allowedValues.Count; i++)
            {
                var inputValue = _allowedValues[i];
                var modifiers = FieldModifiers.Public | FieldModifiers.Static;
                // the fields for fixed enums are just its members (we use fields to represent the values in a system `enum` type), we just use the name for this field
                var name = inputValue.Name.ToCleanName();
                // for fixed enum, we only need it for int values, for other value typed fixed enum, we use the serialization extension method to give the values (because assigning them to enum members cannot compile)
                var initializationValue = IsIntValueType ? Literal(inputValue.Value) : null;
                var field = new FieldProvider(
                    modifiers,
                    ValueType,
                    name,
                    FormattableStringHelpers.FromString(inputValue.Description),
                    initializationValue);

                values[i] = new EnumTypeMember(name, field, inputValue.Value);
            }
            return values;
        }

        protected override FieldProvider[] BuildFields()
            => Members.Select(v => v.Field).ToArray();

        public override ValueExpression ToSerial(ValueExpression enumExpression)
        {
            if (IsIntValueType)
            {
                // when the fixed enum is implemented as int, we cast to the value
                return enumExpression.CastTo(ValueType);
            }

            // otherwise we call the corresponding extension method to convert the value
            return new InvokeStaticMethodExpression(Serialization?.Type, $"ToSerial{ValueType.Name}", [enumExpression], CallAsExtension: true);
        }

        public override ValueExpression ToEnum(ValueExpression valueExpression)
            => new InvokeStaticMethodExpression(Serialization?.Type, $"To{Type.Name}", [valueExpression], CallAsExtension: true);
    }
}
