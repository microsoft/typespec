// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Represents a model type from an external assembly (system or referenced assembly) that is mapped
    /// from an input model type. Unlike <see cref="SystemObjectTypeProvider"/> which extends <see cref="TypeProvider"/>,
    /// this class extends <see cref="ModelProvider"/> so it can serve as a <see cref="ModelProvider.BaseModelProvider"/>
    /// for derived models that inherit from system types.
    /// <para>
    /// This is used when a code generator maps an input model (e.g., an ARM Resource type) to an existing
    /// framework type (e.g., ResourceData) rather than generating a new type.
    /// </para>
    /// </summary>
    public class SystemObjectModelProvider : ModelProvider
    {
        private readonly CSharpType _systemType;
        private readonly bool _skipDerivedConstructorParameters;
        private readonly TypeProvider? _lastContractType;

        /// <summary>
        /// Initializes a new instance of <see cref="SystemObjectModelProvider"/>.
        /// </summary>
        /// <param name="systemType">The CSharp type from the external/system assembly.</param>
        /// <param name="inputModel">The input model type that this system type replaces.</param>
        public SystemObjectModelProvider(CSharpType systemType, InputModelType inputModel)
            : this(systemType, inputModel, skipDerivedConstructorParameters: false, lastContractType: null)
        {
        }

        public SystemObjectModelProvider(
            CSharpType systemType,
            InputModelType inputModel,
            bool skipDerivedConstructorParameters)
            : this(systemType, inputModel, skipDerivedConstructorParameters, lastContractType: null)
        {
        }

        internal SystemObjectModelProvider(
            CSharpType systemType,
            InputModelType inputModel,
            TypeProvider lastContractType)
            : this(systemType, inputModel, skipDerivedConstructorParameters: false, lastContractType)
        {
        }

        private SystemObjectModelProvider(
            CSharpType systemType,
            InputModelType inputModel,
            bool skipDerivedConstructorParameters,
            TypeProvider? lastContractType)
            : base(inputModel)
        {
            _systemType = systemType ?? throw new ArgumentNullException(nameof(systemType));
            _skipDerivedConstructorParameters = skipDerivedConstructorParameters;
            _lastContractType = lastContractType;
            CrossLanguageDefinitionId = inputModel.CrossLanguageDefinitionId;

            // The base ModelProvider constructor can evaluate Type before _systemType is assigned.
            // Clear those cached values so Name/Namespace/BaseType are rebuilt from the wrapped type.
            Reset();
        }

        /// <summary>
        /// Gets the underlying system <see cref="CSharpType"/> that this provider wraps.
        /// </summary>
        public CSharpType SystemType => _systemType;

        internal bool UsesLastContractType => _lastContractType is not null;

        internal bool HasReconstructibleLastContractConstructor
            => _lastContractType is null ||
                TryGetLastContractConstructor(out _, out _) &&
                HasCallableInitializationConstructor();

        private bool HasCallableInitializationConstructor()
        {
            var requiredProperties = Properties.Where(IsRequiredInitializationProperty).ToArray();
            var constructors = _lastContractType!.Constructors;
            if (constructors.Count == 0)
            {
                // A class with no declared instance constructors has an implicit parameterless constructor.
                return requiredProperties.Length == 0;
            }

            foreach (var constructor in constructors.Where(constructor =>
                MethodSignatureHelper.IsPublicApi(constructor.Signature.Modifiers) &&
                HasSupportedConstructorParameters(constructor.Signature.Parameters)))
            {
                var matches = constructor.Signature.Parameters
                    .Select(parameter => Properties.FirstOrDefault(property =>
                        property.AsParameter.Name == parameter.Name &&
                        property.Type.Equals(parameter.Type, ignoreNullable: true)))
                    .ToArray();
                if (matches.Take(requiredProperties.Length).SequenceEqual(requiredProperties) &&
                    constructor.Signature.Parameters.Skip(requiredProperties.Length)
                        .All(parameter => parameter.DefaultValue is not null))
                {
                    return true;
                }
            }
            return false;
        }

        private static bool IsRequiredInitializationProperty(PropertyProvider property)
            => property.WireInfo is { IsRequired: true, IsReadOnly: false } &&
                !property.Type.IsLiteral;

        /// <summary>
        /// Gets the cross-language definition ID from the input model.
        /// </summary>
        public string CrossLanguageDefinitionId { get; }

        /// <inheritdoc/>
        // _systemType may be null when called from base constructor before field assignment.
        protected override string BuildName() => _systemType?.Name ?? string.Empty;

        /// <inheritdoc/>
        protected override string BuildRelativeFilePath()
            => throw new InvalidOperationException("This type should not be writing in generation");

        /// <inheritdoc/>
        // _systemType may be null when called from base constructor before field assignment.
        protected override string BuildNamespace() => _systemType?.Namespace ?? string.Empty;

        /// <inheritdoc/>
        protected override CSharpType? BuildBaseType() => SystemType.BaseType ?? base.BuildBaseType();

        /// <inheritdoc/>
        private protected override bool ShouldUseFullConstructorInDerivedTypes => !_skipDerivedConstructorParameters;

        /// <inheritdoc/>
        private protected override ConstructorProvider BuildFullConstructor()
        {
            if (_lastContractType is null)
            {
                return base.BuildFullConstructor();
            }

            if (!TryGetLastContractConstructor(out var constructor, out var matchedProperties))
            {
                return base.BuildFullConstructor();
            }

            // The synthetic full constructor is prepended to derived parameters. Keep its parameters
            // required so a shipped optional parameter cannot precede a required derived parameter.
            var parameters = constructor.Signature.Parameters
                .Zip(matchedProperties)
                .Select(pair => new ParameterProvider(
                    pair.First.Name,
                    pair.First.Description,
                    pair.First.Type,
                    null,
                    pair.First.IsRef,
                    pair.First.IsOut,
                    pair.First.IsIn,
                    pair.First.IsParams,
                    pair.First.Attributes,
                    pair.Second,
                    initializationValue: pair.First.InitializationValue,
                    location: pair.First.Location,
                    wireInfo: pair.First.WireInfo,
                    validation: pair.First.Validation,
                    inputParameter: pair.First.InputParameter))
                .ToArray();

            return new ConstructorProvider(
                new ConstructorSignature(
                    Type,
                    constructor.Signature.Description,
                    MethodSignatureModifiers.Internal,
                    parameters),
                Array.Empty<MethodBodyStatement>(),
                this);
        }

        private bool TryGetLastContractConstructor(
            [NotNullWhen(true)] out ConstructorProvider? constructor,
            [NotNullWhen(true)] out IReadOnlyList<PropertyProvider>? matchedProperties)
        {
            var properties = Properties;
            foreach (var candidate in _lastContractType!.Constructors
                .Where(constructor => MethodSignatureHelper.IsPublicApi(constructor.Signature.Modifiers) &&
                    HasSupportedConstructorParameters(constructor.Signature.Parameters))
                .OrderByDescending(constructor => constructor.Signature.Parameters.Count))
            {
                var matches = candidate.Signature.Parameters
                    .Select(parameter => properties.FirstOrDefault(property =>
                        property.AsParameter.Name == parameter.Name &&
                        property.Type.Equals(parameter.Type, ignoreNullable: true)))
                    .ToArray();
                if (matches.All(property => property is not null))
                {
                    constructor = candidate;
                    matchedProperties = matches.Select(property => property!).ToArray();
                    return true;
                }
            }

            constructor = null;
            matchedProperties = null;
            return false;
        }

        internal static bool HasSupportedConstructorParameters(IReadOnlyList<ParameterProvider> parameters)
            => parameters.All(parameter =>
                !parameter.IsRef && !parameter.IsOut && !parameter.IsIn && !parameter.IsParams);

        /// <inheritdoc/>
        protected internal override PropertyProvider[] BuildProperties()
        {
            if (_lastContractType is null)
            {
                return base.BuildProperties();
            }

            var properties = new List<PropertyProvider>();
            for (var provider = _lastContractType; provider is not null; provider = provider.BaseTypeProvider)
            {
                foreach (var property in provider.Properties.Where(property =>
                    MethodSignatureHelper.IsPublicApi(property.Modifiers) &&
                    !properties.Any(existing => existing.Name == property.Name)))
                {
                    properties.Add(ApplyCurrentInputMetadata(property));
                }
            }
            return [.. properties];
        }

        private PropertyProvider ApplyCurrentInputMetadata(PropertyProvider lastContractProperty)
        {
            var matchingInputProperties = InputModel.Properties.Where(property =>
                CodeModelGenerator.Instance.TypeFactory.IsLastContractModelBasePropertyCompatible(
                    SystemType,
                    property,
                    lastContractProperty)).ToArray();
            if (matchingInputProperties.Length != 1 ||
                CodeModelGenerator.Instance.TypeFactory.CreateUncachedProperty(matchingInputProperties[0], this) is not { } property)
            {
                return lastContractProperty;
            }

            // Keep the shipped CLR surface while using the current input as the authority for wire metadata.
            property.Name = lastContractProperty.Name;
            property.Type = lastContractProperty.Type;
            property.Modifiers = lastContractProperty.Modifiers;
            property.Body = lastContractProperty.Body;
            return property;
        }

        /// <inheritdoc/>
        protected override bool ShouldSkipDerivedModelProperties => true;

        /// <inheritdoc/>
        protected internal override CSharpType[] BuildImplements()
        {
            if (SystemType.IsFrameworkType)
            {
                var frameworkType = SystemType.FrameworkType;
                var typeArguments = frameworkType.IsGenericTypeDefinition
                    ? frameworkType.GetGenericArguments()
                        .Zip(SystemType.Arguments)
                        .ToDictionary(pair => pair.First, pair => pair.Second)
                    : [];

                return [.. frameworkType.GetInterfaces().Select(type => CreateInterfaceType(type, typeArguments))];
            }

            return [.. CodeModelGenerator.Instance.SourceInputModel.FindForTypeInCurrentCompilation(
                    SystemType.Namespace,
                    SystemType.Name,
                    declaringTypeName: SystemType.DeclaringType?.Name,
                    includeReferencedAssemblies: true)?.Implements ?? []];
        }

        private static CSharpType CreateInterfaceType(
            Type type,
            IReadOnlyDictionary<Type, CSharpType> typeArguments)
        {
            if (type.IsGenericParameter && typeArguments.TryGetValue(type, out var typeArgument))
            {
                return typeArgument;
            }

            return type.IsGenericType
                ? new CSharpType(
                    type.GetGenericTypeDefinition(),
                    [.. type.GetGenericArguments().Select(argument => CreateInterfaceType(argument, typeArguments))])
                : new CSharpType(type);
        }

        /// <inheritdoc/>
        public override bool ShouldSkipDerivedSerializationMethodOverrides => true;

        /// <summary>
        /// Framework types manage their own fields; no generated fields needed.
        /// </summary>
        protected internal override FieldProvider[] BuildFields() => [];

        /// <summary>
        /// Framework types have their own serialization; no generated serialization providers needed.
        /// </summary>
        protected override TypeProvider[] BuildSerializationProviders() => [];

        /// <summary>
        /// Framework types manage their own raw data field.
        /// Returns null so derived models create their own.
        /// </summary>
        protected override FieldProvider? BuildRawDataField() => null;
    }
}
