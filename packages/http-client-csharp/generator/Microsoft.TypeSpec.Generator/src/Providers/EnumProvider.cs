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
            var normalizedNames = new string[previousNames.Length];
            for (int i = 0; i < previousNames.Length; i++)
            {
                var name = previousNames[i];
                if (inputValues[i].IsExactName || IsCustomizedValueName(name))
                {
                    normalizedNames[i] = name;
                    continue;
                }

                var normalizedName = name.NormalizeCSharpAcronyms();
                normalizedNames[i] = lastContractNames.Contains(name, StringComparer.Ordinal) && !IsCustomizedValueName(normalizedName)
                    ? name
                    : normalizedName;
            }
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
                    var preservedName = GetBackCompatibleName(name, normalizedNames, lastContractNames, inputValues[i].IsExactName);
                    hasLastContractCollision = memberOwners?.Any(n => n != preservedName) == true ||
                        fieldOwners?.Any(n => n != preservedName) == true;
                }

                // Include backing fields and custom renames when checking for new declaration collisions.
                if (hasLastContractCollision ||
                    HasDeclarationCollision(name, previousNames[i], previousNameSet, nameCounts))
                {
                    normalizedNames[i] = previousNames[i];
                }
            }

            return normalizedNames;
        }

        private bool HasDeclarationCollision(string name, string previousName, HashSet<string> previousNames, Dictionary<string, int> nameCounts)
        {
            foreach (var declarationName in IsExtensible ? new[] { name, name + "Value" } : new[] { name })
            {
                if (previousNames.Contains(declarationName) || nameCounts[declarationName] > 1 || declarationName == Name)
                {
                    return true;
                }

                var isBackingField = declarationName != name;
                var previousDeclarationName = isBackingField ? previousName + "Value" : previousName;
                foreach (var field in CustomCodeView?.Fields ?? [])
                {
                    if (field.Name != declarationName)
                    {
                        continue;
                    }

                    var isRenamed = field.OriginalName != null && field.OriginalName != declarationName && field.OriginalName != previousDeclarationName;
                    if ((!isBackingField && IsExtensible) || isRenamed)
                    {
                        return true;
                    }
                }

                if (IsExtensible)
                {
                    foreach (var property in CustomCodeView?.Properties ?? [])
                    {
                        if (property.Name != declarationName)
                        {
                            continue;
                        }

                        var isRenamed = property.OriginalName != null && property.OriginalName != declarationName && property.OriginalName != previousDeclarationName;
                        if (isBackingField || isRenamed)
                        {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        private protected virtual bool IsCustomizedValueName(string name) =>
            GetMemberSuppressionAttributes().Any(a => a.ConstructorArguments.Length > 0 &&
                a.ConstructorArguments[0].Value is string suppressedName && suppressedName == name);

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
