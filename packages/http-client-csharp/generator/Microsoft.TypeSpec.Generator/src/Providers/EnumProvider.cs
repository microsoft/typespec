// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public abstract class EnumProvider : TypeProvider
    {
        public static EnumProvider Create(InputEnumType input, TypeProvider? declaringType = null)
        {
            bool isApiVersionEnum = input.Usage.HasFlag(InputModelTypeUsage.ApiVersionEnum);
            var fixedEnumProvider = isApiVersionEnum
                ? new ApiVersionEnumProvider(input, declaringType)
                : new FixedEnumProvider(input, declaringType);
            var extensibleEnumProvider = new ExtensibleEnumProvider(input, declaringType);

            // Check to see if there is custom code that customizes the enum.
            var customCodeView = fixedEnumProvider.CustomCodeView ?? extensibleEnumProvider.CustomCodeView;

            EnumProvider provider = customCodeView switch
            {
                { Type: { IsValueType: true, IsStruct: true } } => extensibleEnumProvider,
                { Type: { IsValueType: true, IsStruct: false } } => fixedEnumProvider,
                _ => input.IsExtensible ? extensibleEnumProvider : fixedEnumProvider
            };

            if (input.Access == "public")
            {
                CodeModelGenerator.Instance.AddTypeToKeep(provider);
            }

            return provider;
        }

        protected EnumProvider(InputEnumType? input)
        {
            InputType = input;
            _deprecated = input?.Deprecation;
            IsExtensible = input?.IsExtensible ?? false;
        }

        internal InputEnumType? InputType { get; }
        internal FixedEnumProvider? FixedEnumView { get; private protected set; }
        internal ExtensibleEnumProvider? ExtensibleEnumView { get; private protected set; }

        public bool IsExtensible { get; }
        private bool? _isIntValue;
        internal bool IsIntValueType => _isIntValue ??= EnumUnderlyingType.Equals(typeof(int)) || EnumUnderlyingType.Equals(typeof(long));
        private bool? _isFloatValue;
        internal bool IsFloatValueType => _isFloatValue ??= EnumUnderlyingType.Equals(typeof(float)) || EnumUnderlyingType.Equals(typeof(double));
        private bool? _isStringValue;
        internal bool IsStringValueType => _isStringValue ??= EnumUnderlyingType.Equals(typeof(string));
        internal bool IsNumericValueType => IsIntValueType || IsFloatValueType;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override string BuildName() => InputType!.Name.ToIdentifierName();
        protected override FormattableString BuildDescription() => DocHelpers.GetFormattableDescription(InputType!.Summary, InputType.Doc) ?? FormattableStringHelpers.Empty;

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return [.. CodeModelGenerator.Instance.TypeFactory.CreateSerializations(InputType!, this)];
        }
        protected override string BuildNamespace() => string.IsNullOrEmpty(InputType?.Namespace) ?
            // TODO - this should not be necessary as every enum should have a namespace https://github.com/Azure/typespec-azure/issues/2210
            CodeModelGenerator.Instance.TypeFactory.PrimaryNamespace : // we default to this model namespace when the namespace is empty
            CodeModelGenerator.Instance.TypeFactory.GetCleanNameSpace(InputType.Namespace);

        protected override bool GetIsEnum() => true;
        protected override CSharpType BuildEnumUnderlyingType() => CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(InputType!.ValueType) ?? throw new InvalidOperationException($"Failed to create CSharpType for {InputType.ValueType}");
    }
}
