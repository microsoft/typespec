// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Utilities;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Providers
{
    internal sealed class ApiVersionEnumProvider : FixedEnumProvider
    {
        private const string ApiVersionEnumName = "ServiceVersion";
        private const string ApiVersionEnumDescription = "The version of the service to use.";

        internal ApiVersionEnumProvider(InputEnumType input, TypeProvider? declaringType) : base(input, declaringType) { }

        protected override string BuildName() => ApiVersionEnumName;
        protected override FormattableString Description => $"{ApiVersionEnumDescription}";

        protected override IReadOnlyList<EnumTypeMember> BuildEnumValues()
        {
            var customMembers = new HashSet<FieldProvider>(CustomCodeView?.Fields ?? []);
            var values = new EnumTypeMember[AllowedValues.Count];

            for (int i = 0; i < AllowedValues.Count; i++)
            {
                var inputValue = AllowedValues[i];
                var modifiers = FieldModifiers.Public | FieldModifiers.Static;
                var name = inputValue.Name.ToApiVersionMemberName();

                // check if the enum member was renamed in custom code
                string? customMemberName = null;
                foreach (var customMember in customMembers)
                {
                    if (customMember.OriginalName == name)
                    {
                        customMemberName = customMember.Name;
                    }
                }

                if (customMemberName != null)
                {
                    name = customMemberName;
                }

                ValueExpression? initializationValue = Literal(i + 1);
                var field = new FieldProvider(
                    modifiers,
                    EnumUnderlyingType,
                    name,
                    this,
                    DocHelpers.GetFormattableDescription(inputValue.Summary, inputValue.Doc) ?? $"{name}",
                    initializationValue);

                values[i] = new EnumTypeMember(name, field, inputValue.Value);
            }
            return values;
        }
    }
}
