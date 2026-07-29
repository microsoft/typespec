// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
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
            var generatedNames = AllowedValues
                .Select(v => v.IsExactName ? v.Name : v.Name.ToIdentifierName())
                .ToArray();
            var lastContractFields = LastContractView?.Fields ?? [];
            var lastContractNames = lastContractFields.Select(f => f.Name).ToArray();

            var values = new EnumTypeMember[AllowedValues.Count];

            for (int i = 0; i < AllowedValues.Count; i++)
            {
                var inputValue = AllowedValues[i];
                var modifiers = FieldModifiers.Public | FieldModifiers.Static;
                // the fields for fixed enums are just its members (we use fields to represent the values in a system `enum` type), we just use the name for this field
                var name = GetBackCompatibleName(generatedNames[i], generatedNames, lastContractNames);

                // check if the enum member was renamed in custom code
                string? customMemberName = null;
                foreach (var customMember in customMembers)
                {
                    if (customMember.OriginalName == generatedNames[i])
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
            var allMembers = new List<EnumTypeMember>(currentValues.Count);
            var processedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var customMemberLastContractNames = GetCustomMemberLastContractNames(lastContractFields);

            foreach (var field in lastContractFields)
            {
                if (currentLookup.TryGetValue(field.Name, out var existingMember) && processedNames.Add(existingMember.Name))
                {
                    // By default, preserve the last contract's explicit value for integer enums so
                    // members keep their exact values. If the baseline accepts a value change for this
                    // member (EnumValuesMustMatch), honor the current value instead of restoring the old.
                    ValueExpression? initializationValue = existingMember.Field.InitializationValue;
                    var memberValue = existingMember.Value;
                    if (IsIntValueType
                        && field.InitializationValue is LiteralExpression { Literal: { } lastContractValue }
                        && CodeModelGenerator.Instance.SourceInputModel?.ApiCompatBaseline.IsMemberSuppressed(Type.FullyQualifiedName, field.Name, 0) != true)
                    {
                        initializationValue = field.InitializationValue;
                        memberValue = lastContractValue;
                    }

                    var updatedField = new FieldProvider(
                        existingMember.Field.Modifiers,
                        existingMember.Field.Type,
                        existingMember.Name,
                        existingMember.Field.EnclosingType,
                        existingMember.Field.Description,
                        initializationValue);
                    allMembers.Add(new EnumTypeMember(existingMember.Name, updatedField, memberValue));
                }
                else if (customMemberLastContractNames.Contains(field.Name))
                {
                    continue;
                }
                else if (CodeModelGenerator.Instance.SourceInputModel?.ApiCompatBaseline.IsMemberSuppressed(Type.FullyQualifiedName, field.Name, 0) == true)
                {
                    CodeModelGenerator.Instance.Emitter.Debug(
                        $"Skipping re-add of enum member '{Name}.{field.Name}'; the removal is accepted in the ApiCompat baseline.",
                        BackCompatibilityChangeCategory.BaselineAcceptedRemovalSkipped);
                }
                else if (TryResurrectRemovedMember(field, out var resurrectedMember))
                {
                    allMembers.Add(resurrectedMember);
                    CodeModelGenerator.Instance.Emitter.Debug(
                        $"Re-added enum member '{field.Name}' to enum '{Name}' to preserve a member from the last contract.",
                        BackCompatibilityChangeCategory.EnumMemberAddedFromLastContract);
                }
            }

            // Then, add new members that weren't in the last contract (in their original input order).
            foreach (var current in currentValues)
            {
                if (!processedNames.Contains(current.Name))
                {
                    allMembers.Add(current);
                }
            }

            // Report a reordering only when the relative order of members present in BOTH the
            // current values and the resulting set was actually altered.
            if (SharedMemberOrderChanged(currentValues, allMembers))
            {
                CodeModelGenerator.Instance.Emitter.Debug(
                    $"Reordered members of enum '{Name}' to match last contract.",
                    BackCompatibilityChangeCategory.EnumMemberReordering);
            }

            return allMembers;
        }

        private HashSet<string> GetCustomMemberLastContractNames(IReadOnlyList<FieldProvider> lastContractFields)
        {
            var customOriginalNames = new HashSet<string>(
                CustomCodeView?.Fields
                    .Where(f => f.OriginalName != null)
                    .Select(f => f.OriginalName!) ?? [],
                StringComparer.Ordinal);
            var generatedNames = AllowedValues
                .Select(v => v.IsExactName ? v.Name : v.Name.ToIdentifierName())
                .ToArray();
            var lastContractNames = lastContractFields.Select(f => f.Name).ToArray();
            var customMemberLastContractNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            for (int i = 0; i < generatedNames.Length; i++)
            {
                if (customOriginalNames.Contains(generatedNames[i]))
                {
                    customMemberLastContractNames.Add(
                        GetBackCompatibleName(generatedNames[i], generatedNames, lastContractNames));
                }
            }

            return customMemberLastContractNames;
        }

        private bool TryResurrectRemovedMember(FieldProvider lastContractField, [NotNullWhen(true)] out EnumTypeMember? member)
        {
            member = null;
            if (!IsIntValueType || lastContractField.InitializationValue is not LiteralExpression { Literal: { } literalValue })
            {
                return false;
            }

            var field = new FieldProvider(
                FieldModifiers.Public | FieldModifiers.Static,
                EnumUnderlyingType,
                lastContractField.Name,
                this,
                lastContractField.Description,
                Literal(literalValue));
            member = new EnumTypeMember(lastContractField.Name, field, literalValue);
            return true;
        }

        // Appends the members of <paramref name="currentValues"/> that were not present in the last
        // contract (i.e. newly introduced by the current spec), preserving their original input order.
        // Shared by the fixed-enum and API-version back-compatibility passes.
        private protected static void AppendMembersNotInLastContract(
            IReadOnlyList<EnumTypeMember> currentValues,
            IReadOnlyList<FieldProvider> lastContractFields,
            List<EnumTypeMember> allMembers)
        {
            var lastContractNames = new HashSet<string>(lastContractFields.Select(f => f.Name), StringComparer.OrdinalIgnoreCase);
            foreach (var current in currentValues)
            {
                if (!lastContractNames.Contains(current.Name))
                {
                    allMembers.Add(current);
                }
            }
        }

        private static bool SharedMemberOrderChanged(
            IReadOnlyList<EnumTypeMember> currentValues,
            IReadOnlyList<EnumTypeMember> result)
        {
            var currentNames = new HashSet<string>(currentValues.Count, StringComparer.Ordinal);
            foreach (var member in currentValues)
            {
                currentNames.Add(RemoveUnderscores(member.Name));
            }

            var index = 0;
            foreach (var member in result)
            {
                if (!currentNames.Contains(RemoveUnderscores(member.Name)))
                {
                    continue;
                }

                if (index >= currentValues.Count
                    || !string.Equals(
                        RemoveUnderscores(member.Name),
                        RemoveUnderscores(currentValues[index].Name),
                        StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                index++;
            }

            return false;
        }

        protected internal override FieldProvider[] BuildFields()
            => EnumValues.Select(v => v.Field).ToArray();

        protected override bool GetIsEnum() => true;
    }
}
