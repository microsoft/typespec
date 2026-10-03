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
            bool isExactName)
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

            if (IsCustomizedValueName(generatedName) &&
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
            IReadOnlyList<string> lastContractNames)
        {
            var previousNames = inputValues.Select(v => GetGeneratedValueName(v, lastContractNames)).ToArray();
            var normalizedNames = previousNames.Select((name, i) =>
            {
                if (inputValues[i].IsExactName || IsCustomizedValueName(name))
                {
                    return name;
                }

                var normalizedName = name.NormalizeCSharpAcronyms();
                return lastContractNames.Contains(name, StringComparer.Ordinal) && !IsCustomizedValueName(normalizedName)
                    ? name
                    : normalizedName;
            }).ToArray();
            var previousNameSet = new HashSet<string>(GetDeclarationNames(previousNames), StringComparer.Ordinal);
            var nameCounts = GetDeclarationNames(normalizedNames).CountBy(n => n, StringComparer.Ordinal).ToDictionary();

            for (int i = 0; i < normalizedNames.Length; i++)
            {
                var name = normalizedNames[i];
                // Include backing fields and custom renames when checking for new declaration collisions.
                if (name != previousNames[i] &&
                    (HasCollision(name) || (IsExtensible && HasCollision(name + "Value")) ||
                    HasCustomNameCollision(name, previousNames[i])))
                {
                    normalizedNames[i] = previousNames[i];
                }
            }

            return normalizedNames;

            bool HasCollision(string name) => previousNameSet.Contains(name) || nameCounts[name] > 1 || name == Name;
        }

        private IEnumerable<string> GetDeclarationNames(IEnumerable<string> names) =>
            IsExtensible ? names.SelectMany(n => new[] { n, n + "Value" }) : names;

        private bool HasCustomNameCollision(string name, string previousName) => IsExtensible
            ? CustomCodeView?.Properties.Any(p => p.Name == name + "Value" || (p.Name == name && p.OriginalName != null &&
                p.OriginalName != name && p.OriginalName != previousName)) == true ||
                CustomCodeView?.Fields.Any(f => f.Name == name || (f.Name == name + "Value" &&
                    f.OriginalName != null && f.OriginalName != name + "Value" && f.OriginalName != previousName + "Value")) == true
            : CustomCodeView?.Fields.Any(f => f.Name == name && f.OriginalName != null &&
                f.OriginalName != name && f.OriginalName != previousName) == true;

        private bool IsCustomizedValueName(string name)
        {
            if (GetMemberSuppressionAttributes().Any(a =>
                a.ConstructorArguments.Length > 0 &&
                a.ConstructorArguments[0].Value is string memberName &&
                (memberName == name || (IsExtensible && memberName == name + "Value"))))
            {
                return true;
            }

            return IsExtensible
                ? CustomCodeView?.Properties.Any(p => p.Name == name || p.OriginalName == name) == true ||
                    CustomCodeView?.Fields.Any(f => f.Name == name + "Value" || f.OriginalName == name + "Value") == true
                : CustomCodeView?.Fields.Any(f => f.Name == name || f.OriginalName == name) == true;
        }

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
