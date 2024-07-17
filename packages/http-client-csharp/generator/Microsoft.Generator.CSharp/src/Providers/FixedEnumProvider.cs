// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    internal sealed class FixedEnumProvider : EnumProvider
    {
        private readonly IReadOnlyList<InputEnumTypeValue> _allowedValues;
        private readonly TypeSignatureModifiers _modifiers;
        private readonly InputEnumType _inputType;
        private readonly TypeProvider _provider;

        internal FixedEnumProvider(InputEnumType input) : base(input)
        {
            _inputType = input;
            _allowedValues = input.Values;
            _provider = CodeModelPlugin.Instance.TypeFactory.CreateEnum(input);
            // fixed enums are implemented by enum in C#
            _modifiers = TypeSignatureModifiers.Enum;
            if (input.Accessibility == "internal")
            {
                _modifiers |= TypeSignatureModifiers.Internal;
            }
        }

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return CodeModelPlugin.Instance.GetSerializationTypeProviders(_inputType).ToArray();
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _modifiers;

        // we have to build the values first, because the corresponding fieldDeclaration of the values might need all of the existing values to avoid name conflicts
        protected override IReadOnlyList<EnumTypeMember> BuildEnumValues()
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
                    MemberValueType,
                    name,
                    inputValue.Description is null ? $"{name}" : FormattableStringHelpers.FromString(inputValue.Description),
                    initializationValue);

                values[i] = new EnumTypeMember(name, field, inputValue.Value);
            }
            return values;
        }

        protected override FieldProvider[] BuildFields()
            => _provider.EnumValues.Select(v => v.Field).ToArray();
    }
}
