// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Utilities;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public class FixedEnumProvider : EnumProvider
    {
        private readonly TypeSignatureModifiers _modifiers;
        private readonly InputEnumType? _inputType;

        public FixedEnumProvider(InputEnumType? input, TypeProvider? declaringType) : base(input)
        {
            _inputType = input;
            // fixed enums are implemented by enum in C#
            _modifiers = TypeSignatureModifiers.Enum;

            if (input?.Access == "internal")
            {
                _modifiers |= TypeSignatureModifiers.Internal;
            }

            _declaringTypeProvider = declaringType;
            AllowedValues = input?.Values ?? [];
            FixedEnumView = this;
        }

        internal IReadOnlyList<InputEnumTypeValue> AllowedValues { get; }
        protected override TypeProvider? BuildDeclaringTypeProvider() => _declaringTypeProvider;
        private readonly TypeProvider? _declaringTypeProvider;

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return [.. CodeModelGenerator.Instance.TypeFactory.CreateSerializations(_inputType!, this)];
        }

        protected override TypeSignatureModifiers BuildDeclarationModifiers() => _modifiers;

        // The set of types permitted as a C# enum's underlying type (CS1008):
        // https://learn.microsoft.com/dotnet/csharp/misc/cs1008
        private static readonly HashSet<Type> _allowedEnumUnderlyingTypes =
        [
            typeof(byte),
            typeof(sbyte),
            typeof(short),
            typeof(ushort),
            typeof(uint),
            typeof(long),
            typeof(ulong),
        ];
        protected override CSharpType? BuildBaseType()
        {
            var underlying = EnumUnderlyingType;
            if (!underlying.IsFrameworkType || !_allowedEnumUnderlyingTypes.Contains(underlying.FrameworkType))
            {
                return null;
            }
            return underlying;
        }

        // we have to build the values first, because the corresponding fieldDeclaration of the values might need all of the existing values to avoid name conflicts
        protected override IReadOnlyList<EnumTypeMember> BuildEnumValues()
        {
            var customMembers = new HashSet<FieldProvider>(CustomCodeView?.Fields ?? []);

            var values = new EnumTypeMember[AllowedValues.Count];

            for (int i = 0; i < AllowedValues.Count; i++)
            {
                var inputValue = AllowedValues[i];
                var modifiers = FieldModifiers.Public | FieldModifiers.Static;
                // the fields for fixed enums are just its members (we use fields to represent the values in a system `enum` type), we just use the name for this field
                var name = inputValue.IsExactName ? inputValue.Name : inputValue.Name.ToIdentifierName();

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

                // for fixed enum, we only need it for int values, for other value typed fixed enum, we use the serialization extension method to give the values (because assigning them to enum members cannot compile)
                ValueExpression? initializationValue = IsIntValueType ? Literal(inputValue.Value) : null;

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

        protected internal override IReadOnlyList<EnumTypeMember>? BuildEnumValuesForBackCompatibility(IReadOnlyList<EnumTypeMember> currentValues)
        {
            var lastContractFields = LastContractView?.Fields;
            if (lastContractFields == null || lastContractFields.Count == 0)
            {
                return null;
            }

            var currentLookup = currentValues.ToDictionary(v => v.Name, StringComparer.OrdinalIgnoreCase);
            var currentLookupWithoutUnderscores = currentValues.ToLookup(
                v => RemoveUnderscores(v.Name),
                StringComparer.OrdinalIgnoreCase);
            var allMembers = new List<EnumTypeMember>(currentValues.Count);
            var processedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var field in lastContractFields)
            {
                var preserveLastContractName = false;
                if (!currentLookup.TryGetValue(field.Name, out var existingMember))
                {
                    var matches = currentLookupWithoutUnderscores[RemoveUnderscores(field.Name)]
                        .Where(v => !processedNames.Contains(v.Name))
                        .Take(2)
                        .ToArray();
                    if (matches.Length != 1)
                    {
                        continue;
                    }

                    existingMember = matches[0];
                    preserveLastContractName = true;
                }

                if (processedNames.Add(existingMember.Name))
                {
                    var name = preserveLastContractName ? field.Name : existingMember.Name;
                    var updatedField = new FieldProvider(
                        existingMember.Field.Modifiers,
                        existingMember.Field.Type,
                        name,
                        existingMember.Field.EnclosingType,
                        existingMember.Field.Description);
                    allMembers.Add(new EnumTypeMember(name, updatedField, existingMember.Value));
                }
            }

            // Then, add new members that weren't in the last contract (in their original input order)
            foreach (var current in currentValues)
            {
                if (!processedNames.Contains(current.Name))
                {
                    allMembers.Add(current);
                }
            }

            // Report a summary-level change only if the relative order of shared members
            // was actually altered to match the last contract.
            if (!EnumMemberOrderMatches(currentValues, allMembers))
            {
                CodeModelGenerator.Instance.Emitter.Debug(
                    $"Reordered members of enum '{Name}' to match last contract.",
                    BackCompatibilityChangeCategory.EnumMemberReordering);
            }

            return allMembers;
        }

        private static string RemoveUnderscores(string name) => name.Replace("_", string.Empty);

        private static bool EnumMemberOrderMatches(
            IReadOnlyList<EnumTypeMember> left,
            IReadOnlyList<EnumTypeMember> right)
        {
            if (left.Count != right.Count)
            {
                return false;
            }
            for (int i = 0; i < left.Count; i++)
            {
                if (!string.Equals(
                    RemoveUnderscores(left[i].Name),
                    RemoveUnderscores(right[i].Name),
                    StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }
            }
            return true;
        }

        protected internal override FieldProvider[] BuildFields()
            => EnumValues.Select(v => v.Field).ToArray();

        protected override bool GetIsEnum() => true;
    }
}
