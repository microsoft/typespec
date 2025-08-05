// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public abstract class EnumProvider : TypeProvider
    {
        private readonly InputEnumType _inputType;

        public static EnumProvider Create(InputEnumType input, TypeProvider? declaringType = null)
        {
            bool isApiVersionEnum = input.Usage.HasFlag(InputModelTypeUsage.ApiVersionEnum);
            var fixedEnumProvider = isApiVersionEnum
                ? new ApiVersionEnumProvider(input, declaringType)
                : new FixedEnumProvider(input, declaringType);
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
            _deprecated = input.Deprecation;
            IsExtensible = input.IsExtensible;
        }

        /// <summary>
        /// Updates the enum provider with new values for its enum-specific properties and inherits the base TypeProvider update functionality.
        /// </summary>
        /// <param name="enumValues">The new enum values.</param>
        /// <param name="methods">The new methods.</param>
        /// <param name="constructors">The new constructors.</param>
        /// <param name="properties">The new properties.</param>
        /// <param name="fields">The new fields.</param>
        /// <param name="serializations">The new serializations.</param>
        /// <param name="nestedTypes">The new nested types.</param>
        /// <param name="attributes">The new attributes.</param>
        /// <param name="xmlDocs">The new XML docs.</param>
        /// <param name="modifiers">The new modifiers.</param>
        /// <param name="name">The new name.</param>
        /// <param name="namespace">The new namespace.</param>
        /// <param name="relativeFilePath">The new relative file path.</param>
        /// <param name="reset">Whether to reset the type provider before applying the other changes in the update.</param>
        public void Update(
            IEnumerable<EnumTypeMember>? enumValues = null,
            IEnumerable<MethodProvider>? methods = null,
            IEnumerable<ConstructorProvider>? constructors = null,
            IEnumerable<PropertyProvider>? properties = null,
            IEnumerable<FieldProvider>? fields = null,
            IEnumerable<TypeProvider>? serializations = null,
            IEnumerable<TypeProvider>? nestedTypes = null,
            IEnumerable<AttributeStatement>? attributes = null,
            XmlDocProvider? xmlDocs = null,
            TypeSignatureModifiers? modifiers = null,
            string? name = null,
            string? @namespace = null,
            string? relativeFilePath = null,
            bool reset = false)
        {
            // Handle enum-specific properties first
            if (enumValues != null)
            {
                // Store the new enum values for derived classes to use
                _updatedEnumValues = (enumValues as IReadOnlyList<EnumTypeMember>) ?? enumValues.ToList();
                // Reset cached enum values to force rebuild with new values
                ResetEnumValues();
            }

            // Call base Update method for common TypeProvider properties
            base.Update(
                methods: methods,
                constructors: constructors,
                properties: properties,
                fields: fields,
                serializations: serializations,
                nestedTypes: nestedTypes,
                attributes: attributes,
                xmlDocs: xmlDocs,
                modifiers: modifiers,
                name: name,
                @namespace: @namespace,
                relativeFilePath: relativeFilePath,
                reset: reset);
        }

        private IReadOnlyList<EnumTypeMember>? _updatedEnumValues;

        /// <summary>
        /// Gets the updated enum values if they have been set via the Update method.
        /// Derived classes should check this property in their BuildEnumValues implementation.
        /// </summary>
        protected IReadOnlyList<EnumTypeMember>? UpdatedEnumValues => _updatedEnumValues;

        public bool IsExtensible { get; }
        private bool? _isIntValue;
        internal bool IsIntValueType => _isIntValue ??= EnumUnderlyingType.Equals(typeof(int)) || EnumUnderlyingType.Equals(typeof(long));
        private bool? _isFloatValue;
        internal bool IsFloatValueType => _isFloatValue ??= EnumUnderlyingType.Equals(typeof(float)) || EnumUnderlyingType.Equals(typeof(double));
        private bool? _isStringValue;
        internal bool IsStringValueType => _isStringValue ??= EnumUnderlyingType.Equals(typeof(string));
        internal bool IsNumericValueType => IsIntValueType || IsFloatValueType;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override string BuildName() => _inputType.Name.ToIdentifierName();
        protected override FormattableString BuildDescription() => DocHelpers.GetFormattableDescription(_inputType.Summary, _inputType.Doc) ?? FormattableStringHelpers.Empty;

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
