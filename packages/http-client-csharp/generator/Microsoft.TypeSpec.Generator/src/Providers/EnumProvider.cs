// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public abstract class EnumProvider : TypeProvider
    {
        private readonly InputEnumType? _inputType;

        public static EnumProvider Create(InputEnumType input, TypeProvider? declaringType = null)
        {
            bool isApiVersionEnum = input.Usage.HasFlag(InputModelTypeUsage.ApiVersionEnum);
            var fixedEnumProvider = isApiVersionEnum
                ? new ApiVersionEnumProvider(input, declaringType)
                : new FixedEnumProvider(input, declaringType);
            var extensibleEnumProvider = new ExtensibleEnumProvider(input, declaringType);
            fixedEnumProvider.ExtensibleEnumView = extensibleEnumProvider;
            extensibleEnumProvider.FixedEnumView = fixedEnumProvider;

            return input.IsExtensible ? extensibleEnumProvider : fixedEnumProvider;
        }

        protected EnumProvider(InputEnumType? input) : base(input)
        {
            _inputType = input;
            _deprecated = input?.Deprecation;
            IsExtensible = input?.IsExtensible ?? false;
            InputNamespace = input?.Namespace;
        }

        internal EnumProvider? FixedEnumView { get; set; }
        internal EnumProvider? ExtensibleEnumView { get; set; }

        public string? InputNamespace { get; }

        public bool IsExtensible { get; }
        private bool? _isIntValue;
        internal bool IsIntValueType => _isIntValue ??= EnumUnderlyingType.Equals(typeof(int)) || EnumUnderlyingType.Equals(typeof(long));
        private bool? _isFloatValue;
        internal bool IsFloatValueType => _isFloatValue ??= EnumUnderlyingType.Equals(typeof(float)) || EnumUnderlyingType.Equals(typeof(double));
        private bool? _isStringValue;
        internal bool IsStringValueType => _isStringValue ??= EnumUnderlyingType.Equals(typeof(string));
        internal bool IsNumericValueType => IsIntValueType || IsFloatValueType;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override string BuildName()
        {
            if (_inputType!.IsExactName)
            {
                return _inputType.Name;
            }

            return NormalizeTypeNameForNewContract(_inputType.Name.ToIdentifierName());
        }
        protected override FormattableString BuildDescription() => DocHelpers.GetFormattableDescription(_inputType!.Summary, _inputType.Doc) ?? FormattableStringHelpers.Empty;

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return [.. CodeModelGenerator.Instance.TypeFactory.CreateSerializations(_inputType!, this)];
        }
        protected override string BuildNamespace() => string.IsNullOrEmpty(_inputType?.Namespace) ?
            // TODO - this should not be necessary as every enum should have a namespace https://github.com/Azure/typespec-azure/issues/2210
            CodeModelGenerator.Instance.TypeFactory.PrimaryNamespace : // we default to this model namespace when the namespace is empty
            CodeModelGenerator.Instance.TypeFactory.GetCleanNameSpace(_inputType.Namespace);

        protected static string RemoveUnderscores(string name) => name.Replace("_", string.Empty);

        private HashSet<string>? _customMemberNames;
        private protected HashSet<string> CustomMemberNames => _customMemberNames ??= new HashSet<string>(
            GetCustomMemberNames(),
            StringComparer.OrdinalIgnoreCase);

        private protected sealed class EnumCustomization
        {
            public Dictionary<string, List<FieldProvider>> Fields { get; } = new(StringComparer.Ordinal);
            public Dictionary<string, List<PropertyProvider>> Properties { get; } = new(StringComparer.Ordinal);
            public HashSet<string> SuppressedNames { get; } = new(StringComparer.Ordinal);

            public EnumCustomization(EnumProvider provider)
            {
                foreach (var field in provider.CustomCodeView?.Fields ?? [])
                {
                    AddMember(Fields, field.Name, field.OriginalName, field);
                }
                foreach (var property in provider.CustomCodeView?.Properties ?? [])
                {
                    AddMember(Properties, property.Name, property.OriginalName, property);
                }
                foreach (var attribute in provider.GetMemberSuppressionAttributes())
                {
                    if (attribute.ConstructorArguments.Length > 0 &&
                        attribute.ConstructorArguments[0].Value is string name)
                    {
                        SuppressedNames.Add(name);
                    }
                }
            }

            private static void AddMember<T>(Dictionary<string, List<T>> members, string name, string? originalName, T member)
            {
                foreach (var key in new[] { name, originalName }.OfType<string>().Distinct(StringComparer.Ordinal))
                {
                    if (!members.TryGetValue(key, out var matches))
                    {
                        matches = [];
                        members.Add(key, matches);
                    }
                    matches.Add(member);
                }
            }
        }

        private IEnumerable<string> GetCustomMemberNames()
        {
            if (CustomCodeView is null)
            {
                return [];
            }

            return IsExtensible
                ? CustomCodeView.Properties.Select(p => p.Name)
                : CustomCodeView.Fields.Select(f => f.Name);
        }

        private protected string GetBackCompatibleName(
            string generatedName,
            IReadOnlyList<string> generatedNames,
            IReadOnlyList<string> lastContractNames,
            bool isExactName,
            EnumCustomization customization)
        {
            if (isExactName)
            {
                return generatedName;
            }

            if (lastContractNames.Count == 0)
            {
                return generatedName;
            }

            if (lastContractNames.Contains(generatedName, StringComparer.Ordinal))
            {
                return generatedName;
            }

            if (IsCustomizedValueName(generatedName, customization) &&
                lastContractNames.Contains(generatedName, StringComparer.OrdinalIgnoreCase))
            {
                return generatedName;
            }

            var normalizedName = RemoveUnderscores(generatedName);
            // A normalized match ignores underscores and casing. Preserve the last-contract name only
            // when exactly one current member and one last-contract member have the same normalized name;
            // multiple matches are ambiguous. Only two matches are needed to distinguish those cases.
            var matchingCurrentNames = generatedNames
                .Where(n => RemoveUnderscores(n).Equals(normalizedName, StringComparison.OrdinalIgnoreCase))
                .Take(2)
                .ToArray();
            var matchingLastContractNames = lastContractNames
                .Where(n => RemoveUnderscores(n).Equals(normalizedName, StringComparison.OrdinalIgnoreCase))
                .Take(2)
                .ToArray();

            var backCompatName = matchingCurrentNames.Length == 1 && matchingLastContractNames.Length == 1
                ? matchingLastContractNames[0]
                : generatedName;

            // If restoring the underscore-preserved name would collide with a member that already
            // exists in custom code, keep the generated name so the custom member is preserved
            // rather than duplicated or removed.
            if (!backCompatName.Equals(generatedName, StringComparison.Ordinal)
                && CustomMemberNames.Contains(backCompatName))
            {
                return generatedName;
            }

            return backCompatName;
        }

        private protected string[] GetGeneratedValueNames(
            IReadOnlyList<InputEnumTypeValue> inputValues,
            IReadOnlyList<string> lastContractNames,
            EnumCustomization customization)
        {
            var previousNames = inputValues.Select(v => GetGeneratedValueName(v, lastContractNames)).ToArray();
            var normalizedNames = previousNames.Select((name, i) =>
            {
                if (inputValues[i].IsExactName || IsCustomizedValueName(name, customization))
                {
                    return name;
                }

                var normalizedName = name.NormalizeCSharpAcronyms();
                return lastContractNames.Contains(name, StringComparer.Ordinal) && !IsCustomizedValueName(normalizedName, customization)
                    ? name
                    : normalizedName;
            }).ToArray();
            var previousNameSet = new HashSet<string>(
                IsExtensible ? previousNames.SelectMany(n => new[] { n, n + "Value" }) : previousNames,
                StringComparer.Ordinal);
            var nameCounts = (IsExtensible ? normalizedNames.SelectMany(n => new[] { n, n + "Value" }) : normalizedNames)
                .CountBy(n => n, StringComparer.Ordinal).ToDictionary();
            var lastContractDeclarations = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);
            foreach (var member in lastContractNames)
            {
                foreach (var declaration in IsExtensible ? new[] { member, member + "Value" } : new[] { member })
                {
                    if (!lastContractDeclarations.TryGetValue(declaration, out var owners))
                    {
                        owners = new HashSet<string>(StringComparer.Ordinal);
                        lastContractDeclarations.Add(declaration, owners);
                    }
                    owners.Add(member);
                }
            }

            for (int i = 0; i < normalizedNames.Length; i++)
            {
                var name = normalizedNames[i];
                if (name == previousNames[i])
                {
                    continue;
                }

                var hasLastContractCollision = false;
                lastContractDeclarations.TryGetValue(name, out var memberOwners);
                var fieldOwners = IsExtensible ? lastContractDeclarations.GetValueOrDefault(name + "Value") : null;
                if (memberOwners != null || fieldOwners != null)
                {
                    var preservedName = GetBackCompatibleName(name, normalizedNames, lastContractNames, inputValues[i].IsExactName, customization);
                    hasLastContractCollision = memberOwners?.Any(n => n != preservedName) == true ||
                        fieldOwners?.Any(n => n != preservedName) == true;
                }

                // Include backing fields and custom renames when checking for new declaration collisions.
                if (hasLastContractCollision ||
                    HasDeclarationCollision(name, previousNameSet, nameCounts) ||
                    (IsExtensible && HasDeclarationCollision(name + "Value", previousNameSet, nameCounts)) ||
                    HasCustomNameCollision(name, previousNames[i], customization))
                {
                    normalizedNames[i] = previousNames[i];
                }
            }

            return normalizedNames;
        }

        private bool HasDeclarationCollision(string name, HashSet<string> previousNames, Dictionary<string, int> nameCounts) =>
            previousNames.Contains(name) || nameCounts[name] > 1 || name == Name;

        private bool HasCustomNameCollision(string name, string previousName, EnumCustomization customization)
        {
            if (customization.Fields.TryGetValue(name, out var fields) &&
                fields.Any(f => f.Name == name && (IsExtensible ||
                    (f.OriginalName != null && f.OriginalName != name && f.OriginalName != previousName))))
            {
                return true;
            }

            if (!IsExtensible)
            {
                return false;
            }

            var fieldName = name + "Value";
            var previousFieldName = previousName + "Value";
            return (customization.Properties.TryGetValue(fieldName, out var fieldProperties) &&
                    fieldProperties.Any(p => p.Name == fieldName)) ||
                (customization.Properties.TryGetValue(name, out var properties) &&
                    properties.Any(p => p.Name == name && p.OriginalName != null && p.OriginalName != name && p.OriginalName != previousName)) ||
                (customization.Fields.TryGetValue(fieldName, out var valueFields) &&
                    valueFields.Any(f => f.Name == fieldName && f.OriginalName != null && f.OriginalName != fieldName && f.OriginalName != previousFieldName));
        }

        private protected virtual bool IsCustomizedValueName(string name, EnumCustomization customization) => false;

        private static string GetGeneratedValueName(
            InputEnumTypeValue inputValue,
            IReadOnlyList<string> lastContractNames)
        {
            var generatedName = inputValue.IsExactName ? inputValue.Name : inputValue.Name.ToIdentifierName();
            if (inputValue.IsExactName)
            {
                return generatedName;
            }

            var normalizedName = generatedName.NormalizeCSharpUrlSuffix();
            return normalizedName == generatedName ||
                lastContractNames.Contains(generatedName, StringComparer.Ordinal)
                    ? generatedName
                    : normalizedName;
        }

        protected override bool GetIsEnum() => true;
        protected override CSharpType BuildEnumUnderlyingType() => CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(_inputType!.ValueType) ?? throw new InvalidOperationException($"Failed to create CSharpType for {_inputType.ValueType}");
    }
}
