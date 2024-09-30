// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.SourceInput;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    internal sealed class FixedEnumProvider : EnumProvider
    {
        private const string ApiVersionEnumName = "ServiceVersion";
        private readonly IReadOnlyList<InputEnumTypeValue> _allowedValues;
        private readonly TypeSignatureModifiers _modifiers;
        private readonly InputEnumType _inputType;
        private readonly bool _isApiVersionEnum;

        internal FixedEnumProvider(InputEnumType input, TypeProvider? declaringType) : base(input)
        {
            _inputType = input;
            _allowedValues = input.Values;
            // fixed enums are implemented by enum in C#
            _modifiers = TypeSignatureModifiers.Enum;

            var customCodeModifiers = GetCustomCodeModifiers();
            if (customCodeModifiers != TypeSignatureModifiers.None)
            {
                _modifiers |= customCodeModifiers;
            }
            else if (input.Accessibility == "internal")
            {
                _modifiers |= TypeSignatureModifiers.Internal;
            }

            _isApiVersionEnum = input.Usage.HasFlag(InputModelTypeUsage.ApiVersionEnum);
            DeclaringTypeProvider = declaringType;
        }

        protected override string BuildName()
            => _isApiVersionEnum ? ApiVersionEnumName : base.BuildName();

        protected override FormattableString Description
            => _isApiVersionEnum ? $"The version of the service to use." : base.Description;

        protected override string GetNamespace()
            => _isApiVersionEnum ? CodeModelPlugin.Instance.Configuration.RootNamespace : base.GetNamespace();

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return CodeModelPlugin.Instance.TypeFactory.CreateSerializations(_inputType, this).ToArray();
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _modifiers;

        // we have to build the values first, because the corresponding fieldDeclaration of the values might need all of the existing values to avoid name conflicts
        protected override IReadOnlyList<EnumTypeMember> BuildEnumValues()
        {
            var customMembers = new HashSet<FieldProvider>(CustomCodeView?.Fields ?? []);

            var values = new EnumTypeMember[_allowedValues.Count];
            for (int i = 0; i < _allowedValues.Count; i++)
            {
                var inputValue = _allowedValues[i];
                var modifiers = FieldModifiers.Public | FieldModifiers.Static;
                // the fields for fixed enums are just its members (we use fields to represent the values in a system `enum` type), we just use the name for this field
                var name = _isApiVersionEnum
                    ? inputValue.Name.ToApiVersionMemberName()
                    : inputValue.Name.ToCleanName();

                // check if the enum member was renamed in custom code
                string? customMemberName = null;
                foreach (var customMember in customMembers)
                {
                    var attributes = customMember.Attributes;
                    if (attributes == null)
                    {
                        continue;
                    }

                    foreach (var attribute in attributes)
                    {
                        if (CodeGenAttributes.TryGetCodeGenMemberAttributeValue(attribute, out var originalName)
                            && originalName == name)
                        {
                            customMemberName = customMember.Name;
                            break;
                        }
                    }

                    if (customMemberName != null)
                    {
                        break;
                    }
                }

                if (customMemberName != null)
                {
                    name = customMemberName;
                }

                // for fixed enum, we only need it for int values, for other value typed fixed enum, we use the serialization extension method to give the values (because assigning them to enum members cannot compile)
                ValueExpression? initializationValue = null;
                if (_isApiVersionEnum)
                {
                    initializationValue = Literal(i + 1);
                }
                else if (IsIntValueType)
                {
                    initializationValue = Literal(inputValue.Value);
                }

                var field = new FieldProvider(
                    modifiers,
                    EnumUnderlyingType,
                    name,
                    this,
                    inputValue.Description is null ? $"{name}" : FormattableStringHelpers.FromString(inputValue.Description),
                    initializationValue);

                values[i] = new EnumTypeMember(name, field, inputValue.Value);
            }
            return values;
        }

        protected override FieldProvider[] BuildFields()
            => EnumValues.Select(v => v.Field).ToArray();

        protected override bool GetIsEnum() => true;
    }
}
