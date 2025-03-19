// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public abstract class EnumProvider : TypeProvider
    {
        private readonly InputEnumType _inputType;

        public static EnumProvider Create(InputEnumType input, TypeProvider? declaringType = null)
        {
            var fixedEnumProvider = new FixedEnumProvider(input, declaringType);
            var extensibleEnumProvider = new ExtensibleEnumProvider(input, declaringType);

            // Check to see if there is custom code that customizes the enum.
            var customCodeView = fixedEnumProvider.CustomCodeView ?? extensibleEnumProvider.CustomCodeView;

            return customCodeView switch
            {
                { Type: { IsValueType: true, IsStruct: true } } => extensibleEnumProvider,
                { Type: { IsValueType: true, IsStruct: false } } => fixedEnumProvider,
                _ => input.IsExtensible ? extensibleEnumProvider : fixedEnumProvider
            };
        }

        protected EnumProvider(InputEnumType input)
        {
            _inputType = input;
            _deprecated = input.Deprecated;
            IsExtensible = input.IsExtensible;
            Description = DocHelpers.GetFormattableDescription(input.Summary, input.Doc) ?? FormattableStringHelpers.Empty;
        }

        public bool IsExtensible { get; }
        private bool? _isIntValue;
        internal bool IsIntValueType => _isIntValue ??= EnumUnderlyingType.Equals(typeof(int)) || EnumUnderlyingType.Equals(typeof(long));
        private bool? _isFloatValue;
        internal bool IsFloatValueType => _isFloatValue ??= EnumUnderlyingType.Equals(typeof(float)) || EnumUnderlyingType.Equals(typeof(double));
        private bool? _isStringValue;
        internal bool IsStringValueType => _isStringValue ??= EnumUnderlyingType.Equals(typeof(string));
        internal bool IsNumericValueType => IsIntValueType || IsFloatValueType;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override string BuildName() => _inputType.Name.ToCleanName();
        protected override FormattableString Description { get; }

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return [.. CodeModelGenerator.Instance.TypeFactory.CreateSerializations(_inputType, this)];
        }
        protected override string BuildNamespace() => string.IsNullOrEmpty(_inputType.Namespace) ?
            // TODO - this should not be necessary as every enum should have a namespace https://github.com/Azure/typespec-azure/issues/2210
            CodeModelGenerator.Instance.TypeFactory.PrimaryNamespace : // we default to this model namespace when the namespace is empty
            CodeModelGenerator.Instance.TypeFactory.GetCleanNameSpace(_inputType.Namespace);

        protected override bool GetIsEnum() => true;
        protected override CSharpType BuildEnumUnderlyingType() => CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(_inputType.ValueType) ?? throw new InvalidOperationException($"Failed to create CSharpType for {_inputType.ValueType}");
    }
}
