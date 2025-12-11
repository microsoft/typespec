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
        private readonly InputEnumType? _inputType;

        /// <summary>
        /// Gets the fixed enum view of this enum. This is set during <see cref="Create"/> to enable
        /// switching between fixed and extensible enum implementations after visitors run.
        /// </summary>
        internal FixedEnumProvider? FixedEnumView { get; private protected set; }

        /// <summary>
        /// Gets the extensible enum view of this enum. This is set during <see cref="Create"/> to enable
        /// switching between fixed and extensible enum implementations after visitors run.
        /// </summary>
        internal ExtensibleEnumProvider? ExtensibleEnumView { get; private protected set; }

        public static EnumProvider Create(InputEnumType input, TypeProvider? declaringType = null)
        {
            bool isApiVersionEnum = input.Usage.HasFlag(InputModelTypeUsage.ApiVersionEnum);
            var fixedEnumProvider = isApiVersionEnum
                ? new ApiVersionEnumProvider(input, declaringType)
                : new FixedEnumProvider(input, declaringType);
            var extensibleEnumProvider = new ExtensibleEnumProvider(input, declaringType);

            // Cross-link both views so they can reference each other
            fixedEnumProvider.ExtensibleEnumView = extensibleEnumProvider;
            fixedEnumProvider.FixedEnumView = fixedEnumProvider;
            extensibleEnumProvider.FixedEnumView = fixedEnumProvider;
            extensibleEnumProvider.ExtensibleEnumView = extensibleEnumProvider;

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

        /// <summary>
        /// Gets the final enum provider based on the current <see cref="TypeProvider.CustomCodeView"/> state.
        /// This should be called after all visitors have had a chance to modify the type's namespace,
        /// as namespace changes can affect which custom code is discovered.
        /// </summary>
        /// <returns>The appropriate enum provider (fixed or extensible) based on custom code.</returns>
        internal EnumProvider GetFinalProvider()
        {
            // Re-check CustomCodeView which may have changed after namespace updates
            var customCodeView = CustomCodeView;

            if (customCodeView != null)
            {
                // Custom code is a struct -> use extensible enum
                if (customCodeView.Type.IsValueType && customCodeView.Type.IsStruct)
                {
                    return ExtensibleEnumView ?? this;
                }
                // Custom code is an enum -> use fixed enum
                if (customCodeView.Type.IsValueType && !customCodeView.Type.IsStruct)
                {
                    return FixedEnumView ?? this;
                }
            }

            // No custom code or can't determine - use original selection based on IsExtensible
            return IsExtensible ? (ExtensibleEnumView ?? this) : (FixedEnumView ?? this);
        }

        protected EnumProvider(InputEnumType? input)
        {
            _inputType = input;
            _deprecated = input?.Deprecation;
            IsExtensible = input?.IsExtensible ?? false;
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

        protected override string BuildName() => _inputType!.Name.ToIdentifierName();
        protected override FormattableString BuildDescription() => DocHelpers.GetFormattableDescription(_inputType!.Summary, _inputType.Doc) ?? FormattableStringHelpers.Empty;

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return [.. CodeModelGenerator.Instance.TypeFactory.CreateSerializations(_inputType!, this)];
        }
        protected override string BuildNamespace() => string.IsNullOrEmpty(_inputType?.Namespace) ?
            // TODO - this should not be necessary as every enum should have a namespace https://github.com/Azure/typespec-azure/issues/2210
            CodeModelGenerator.Instance.TypeFactory.PrimaryNamespace : // we default to this model namespace when the namespace is empty
            CodeModelGenerator.Instance.TypeFactory.GetCleanNameSpace(_inputType.Namespace);

        protected override bool GetIsEnum() => true;
        protected override CSharpType BuildEnumUnderlyingType() => CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(_inputType!.ValueType) ?? throw new InvalidOperationException($"Failed to create CSharpType for {_inputType.ValueType}");
    }
}
