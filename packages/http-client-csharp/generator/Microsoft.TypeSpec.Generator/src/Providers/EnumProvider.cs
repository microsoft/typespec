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

        protected EnumProvider(InputEnumType? input)
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

        protected override string BuildName() => _inputType!.IsExactName ? _inputType.Name : _inputType.Name.ToIdentifierName();
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
        // Names of members already implemented in custom code. Extensible enums expose their members
        // as properties while fixed enums expose them as fields, so we inspect the appropriate set
        // based on the concrete provider type.
        private HashSet<string> CustomMemberNames => _customMemberNames ??= new HashSet<string>(
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
            IReadOnlyList<string> lastContractNames)
        {
            if (lastContractNames.Count == 0)
            {
                return generatedName;
            }

            if (lastContractNames.Any(n => n.Equals(generatedName, StringComparison.OrdinalIgnoreCase)))
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

        protected override bool GetIsEnum() => true;
        protected override CSharpType BuildEnumUnderlyingType() => CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(_inputType!.ValueType) ?? throw new InvalidOperationException($"Failed to create CSharpType for {_inputType.ValueType}");
    }
}
