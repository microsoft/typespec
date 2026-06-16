// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// A non-emitting <see cref="ModelProvider"/> whose surface is sourced from a type in an
    /// external library (resolved via <see cref="Utilities.ExternalTypeReferenceResolver"/> for
    /// an <see cref="InputModelType"/> whose <see cref="InputType.External"/> is set, typically
    /// via the TCGC <c>@@alternateType</c> decorator).
    ///
    /// Provided so that <see cref="ModelProvider.BaseModelProvider"/> is non-null for derived
    /// models whose base lives in an external package. Existing generator paths (constructor
    /// chaining, serialization override detection, base property/field inheritance) gate on
    /// <c>BaseModelProvider != null</c> and silently degrade to "no base" when it is null.
    /// </summary>
    /// <remarks>
    /// This provider does NOT emit a file. <see cref="OutputLibrary.BuildModels"/> filters out
    /// instances of this class before they reach the type-providers list that drives code
    /// emission. Its <see cref="BuildRelativeFilePath"/> throws to make any accidental emission
    /// loud rather than silent.
    ///
    /// Phase 2 reflects on the resolved external <see cref="Type"/>'s constructors to discover
    /// whether the base ctor accepts a discriminator (string-typed parameter whose name matches
    /// either the spec discriminator-property name or a conventional name like
    /// <c>kind</c>/<c>type</c>/<c>discriminator</c>). When found, the discriminator is exposed
    /// via <see cref="BuildProperties"/> (with full <see cref="PropertyWireInformation"/>) so
    /// both the user-facing initialization ctor and the deserialization ctor walk the same
    /// metadata and emit <c>: base("&lt;literal&gt;")</c> via the existing
    /// <see cref="ModelProvider.GetExpressionForCtor"/> logic.
    ///
    /// Non-discriminator base ctor parameters are intentionally NOT surfaced. Including them
    /// without backing property/field metadata trips assertions in the MRW serializer
    /// (it requires every ctor parameter to map to a property or field for deserialization).
    /// External bases with required non-discriminator ctor params therefore need either a
    /// hand-authored bridge in the derived's customization or a future generator enhancement.
    /// </remarks>
    internal sealed class ExternalModelProvider : ModelProvider
    {
        private readonly CSharpType _externalType;
        private readonly InputModelType _externalInputModel;

        public ExternalModelProvider(InputModelType inputModel, CSharpType externalType)
            : base(inputModel)
        {
            _externalInputModel = inputModel;
            _externalType = externalType ?? throw new ArgumentNullException(nameof(externalType));
        }

        /// <inheritdoc/>
        public override CSharpType Type => _externalType;

        // Suppress all customization-view lookups; an external base has no customization in the
        // current generation and isn't a candidate for FindForTypeInCustomization.
        private protected override TypeProvider? BuildCustomCodeView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => null;
        private protected override TypeProvider? BuildLastContractView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => null;

        protected override string BuildRelativeFilePath() =>
            throw new InvalidOperationException(
                $"{nameof(ExternalModelProvider)} for '{_externalType.FullyQualifiedName}' must not be emitted; " +
                "OutputLibrary.BuildModels is expected to filter these out.");

        protected override string BuildName() => _externalType.Name;
        protected override string BuildNamespace() => _externalType.Namespace;

        protected override CSharpType? BuildBaseType() => null;

        protected override TypeSignatureModifiers BuildDeclarationModifiers() =>
            TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;

        protected internal override FieldProvider[] BuildFields() => [];
        protected internal override ConstructorProvider[] BuildConstructors() => [];
        protected internal override MethodProvider[] BuildMethods() => [];
        protected override TypeProvider[] BuildSerializationProviders() => [];
        protected override IReadOnlyList<AttributeStatement> BuildAttributes() => [];

        // Cache the discriminator property/parameter so BuildProperties and FullConstructor
        // see the same object (preserves IsDiscriminator/WireInfo tagging end-to-end).
        private PropertyProvider? _discriminatorProperty;
        private ParameterProvider? _discriminatorParameter;
        private bool _discriminatorResolved;

        /// <summary>
        /// Surfaces the external base's discriminator (if any) so existing generator paths that
        /// walk <c>BaseModelProvider.CanonicalView.Properties</c> for ctor-initialization
        /// purposes can find it and substitute the derived's literal discriminator value at
        /// the <c>: base(...)</c> call site.
        /// </summary>
        protected internal override PropertyProvider[] BuildProperties()
        {
            EnsureDiscriminatorResolved();
            return _discriminatorProperty is null ? [] : [_discriminatorProperty];
        }

        // The synthesized FullConstructor is metadata-only — never emitted. Its parameter list
        // is the single discriminator parameter (if found). The MRW deserialization path uses
        // this signature directly (it does NOT walk CanonicalView.Properties), so the
        // discriminator MUST appear here as well.
        private ConstructorProvider? _externalFullConstructor;
        public override ConstructorProvider FullConstructor =>
            _externalFullConstructor ??= BuildExternalFullConstructor();

        private ConstructorProvider BuildExternalFullConstructor()
        {
            EnsureDiscriminatorResolved();
            var parameters = _discriminatorParameter is null
                ? Array.Empty<ParameterProvider>()
                : new[] { _discriminatorParameter };
            return new ConstructorProvider(
                new ConstructorSignature(
                    Type,
                    description: null,
                    modifiers: MethodSignatureModifiers.Protected,
                    parameters: parameters),
                bodyStatements: MethodBodyStatement.Empty,
                enclosingType: this);
        }

        /// <summary>
        /// Reflects on the resolved external <see cref="Type"/> to locate a single
        /// discriminator-shaped ctor parameter, then builds the matching synthetic
        /// <see cref="PropertyProvider"/> and <see cref="ParameterProvider"/>. The two share
        /// the same Property instance so downstream consumers see consistent
        /// <c>IsDiscriminator=true</c> tagging.
        /// </summary>
        private void EnsureDiscriminatorResolved()
        {
            if (_discriminatorResolved)
            {
                return;
            }
            _discriminatorResolved = true;

            if (_externalInputModel.DiscriminatorProperty is null || !_externalType.IsFrameworkType)
            {
                return;
            }

            ConstructorInfo[] ctors;
            try
            {
                ctors = _externalType.FrameworkType.GetConstructors(
                    BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
            }
            catch (Exception ex)
            {
                CodeModelGenerator.Instance.Emitter?.Debug(
                    $"Failed to reflect ctors on external type '{_externalType.FullyQualifiedName}': {ex.Message}");
                return;
            }

            // Accessible-from-derived-in-another-assembly: public, protected, protected internal.
            // Among those, prefer the ctor with the fewest parameters that contains a
            // discriminator-shaped parameter — that's our best guess at the "subtype" ctor.
            var discriminatorNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var modelDiscriminatorName = _externalInputModel.DiscriminatorProperty.Name;
            if (!string.IsNullOrEmpty(modelDiscriminatorName))
            {
                discriminatorNames.Add(modelDiscriminatorName);
            }

            ParameterInfo? discriminatorParamInfo = null;
            foreach (var ctor in ctors.Where(c => c.IsPublic || c.IsFamily || c.IsFamilyOrAssembly)
                                      .OrderBy(c => c.GetParameters().Length))
            {
                var paramInfo = ctor.GetParameters()
                    .FirstOrDefault(p => p.Name != null
                                         && discriminatorNames.Contains(p.Name)
                                         && CanAssignFromString(p.ParameterType));
                if (paramInfo != null)
                {
                    discriminatorParamInfo = paramInfo;
                    break;
                }
            }

            if (discriminatorParamInfo is null)
            {
                CodeModelGenerator.Instance.Emitter?.Debug(
                    $"External type '{_externalType.FullyQualifiedName}' has no accessible ctor with a " +
                    "discriminator-shaped string parameter; derived models will emit ': base()'.");
                return;
            }

            var stringType = new CSharpType(typeof(string));
            var discriminatorPropertyName = discriminatorParamInfo.Name!;
            var serializedName = _externalInputModel.DiscriminatorProperty.SerializedName
                                 ?? _externalInputModel.DiscriminatorProperty.Name
                                 ?? discriminatorPropertyName;

            _discriminatorProperty = new PropertyProvider(
                description: null,
                modifiers: MethodSignatureModifiers.Public,
                type: stringType,
                name: discriminatorPropertyName,
                body: new AutoPropertyBody(false),
                enclosingType: this,
                wireInfo: new PropertyWireInformation(
                    serializationFormat: SerializationFormat.Default,
                    isRequired: true,
                    isReadOnly: false,
                    isNullable: false,
                    isDiscriminator: true,
                    serializedName: serializedName,
                    isHttpMetadata: false,
                    isApiVersion: false));

            // PropertyProvider's ctor doesn't set IsDiscriminator (it's only inferred from
            // InputProperty in the other overload). Set explicitly so the parameter mapping in
            // ModelProvider.GetExpressionForCtor identifies this as the discriminator slot.
            _discriminatorProperty.IsDiscriminator = true;

            _discriminatorParameter = new ParameterProvider(
                name: discriminatorPropertyName,
                description: FormattableStringHelpers.Empty,
                type: stringType,
                property: _discriminatorProperty);
        }

        /// <summary>
        /// Returns <c>true</c> when the external ctor's parameter type can accept a string at
        /// the call site without an explicit cast. Covers three patterns commonly used by SDK
        /// libraries for discriminator parameters:
        /// <list type="bullet">
        /// <item><c>string</c> itself;</item>
        /// <item>extensible-enum struct with <c>public static op_Implicit(string)</c>
        /// (e.g., OpenAI's <c>ResponseItemKind</c>);</item>
        /// <item>type with a public single-arg <c>(string)</c> constructor — note: this
        /// path is detected for future use; current call-site emission only handles the
        /// first two via direct literal substitution.</item>
        /// </list>
        /// </summary>
        private static bool CanAssignFromString(Type paramType)
        {
            if (paramType == typeof(string))
            {
                return true;
            }

            try
            {
                var implicitOp = paramType.GetMethods(BindingFlags.Public | BindingFlags.Static)
                    .FirstOrDefault(m => m.Name == "op_Implicit"
                                         && m.ReturnType == paramType
                                         && m.GetParameters().Length == 1
                                         && m.GetParameters()[0].ParameterType == typeof(string));
                if (implicitOp != null)
                {
                    return true;
                }

                var stringCtor = paramType.GetConstructor(
                    BindingFlags.Public | BindingFlags.Instance,
                    binder: null,
                    types: new[] { typeof(string) },
                    modifiers: null);
                return stringCtor != null;
            }
            catch
            {
                return false;
            }
        }
    }
}
