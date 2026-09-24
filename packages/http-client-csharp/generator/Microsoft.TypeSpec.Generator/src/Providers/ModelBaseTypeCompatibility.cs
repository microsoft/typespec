// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Validates whether a generated or mapped model can safely restore a previously shipped base type.
    /// </summary>
    internal sealed class ModelBaseTypeCompatibility
    {
        private readonly ModelProvider _model;
        private readonly MappedModelBaseCompatibility _mappedCompatibility;
        private InputModelType InputModel => _model.InputModel;

        public ModelBaseTypeCompatibility(ModelProvider model)
        {
            _model = model;
            _mappedCompatibility = new MappedModelBaseCompatibility(model);
        }

        public bool CanRestore(ModelProvider candidate)
        {
            // Custom members are supported only when the previous base is a mapped external contract.
            // Generated-base restoration with custom code still requires broader member reconciliation.
            if (candidate is not SystemObjectModelProvider &&
                (_model.CustomCodeView is not null || candidate.LastContractView?.BaseType is not null))
            {
                return false;
            }

            return candidate is SystemObjectModelProvider mappedBase
                ? CanUseMappedBase(mappedBase)
                : InputModel.Properties.Count == 0 &&
                    InputModel.AdditionalProperties is null &&
                    !CurrentBaseRequiresReconciliation();
        }

        public bool IsSupportedModelBase(ModelProvider candidate)
            => candidate is SystemObjectModelProvider mappedBase
                ? MappedModelBaseCompatibility.IsSupportedModelBase(mappedBase)
                : InputModel.Properties.Count == 0 &&
                    InputModel.AdditionalProperties is null &&
                    _model.CustomCodeView is null &&
                    !candidate.IsExternal &&
                    candidate.CustomCodeView is null &&
                    candidate.LastContractView is not null &&
                    candidate.BaseType is null &&
                    candidate.InputModel.DiscriminatorProperty is null &&
                    candidate.InputModel.DiscriminatorValue is null &&
                    candidate.InputModel.DerivedModels.Count == 0 &&
                    candidate.InputModel.DiscriminatedSubtypes.Count == 0 &&
                    HasCompatibleLastContractProperties(candidate) &&
                    HasNoUnsupportedLastContractMembers(candidate) &&
                    candidate.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Class) &&
                    !candidate.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Sealed) &&
                    (!_model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public) ||
                        candidate.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));

        public bool CanUseMappedBase(SystemObjectModelProvider mappedBase)
            => _mappedCompatibility.CanUse(mappedBase);

        public static bool AreMappedContractsEquivalent(
            SystemObjectModelProvider left,
            SystemObjectModelProvider right)
            => MappedModelBaseCompatibility.AreContractsEquivalent(left, right);

        private static bool HasNoUnsupportedLastContractMembers(ModelProvider candidate)
        {
            if (candidate.LastContractView is not { } lastContract)
            {
                return true;
            }

            var currentGeneratedMethods = candidate.Methods
                .Concat(candidate.SerializationProviders.SelectMany(provider => provider.Methods))
                .ToArray();
            var currentInterfaces = candidate.Implements
                .Concat(candidate.SerializationProviders.SelectMany(provider => provider.Implements)).ToArray();
            return lastContract.Implements.All(previous => currentInterfaces.Any(current =>
                    ModelBaseMemberCompatibility.AreTypesCompatible(previous, current))) &&
                lastContract.Constructors
                    .Where(constructor => MethodSignatureHelper.IsPublicApi(constructor.Signature.Modifiers))
                    .All(constructor => SystemObjectModelProvider.HasSupportedConstructorParameters(constructor.Signature.Parameters) &&
                        constructor.Signature.Parameters.All(parameter => candidate.Properties.Any(property =>
                            property.AsParameter.Name == parameter.Name &&
                            (ModelBaseMemberCompatibility.AreTypesCompatible(parameter.Type, property.Type) ||
                                ModelBaseMemberCompatibility.AreTypesCompatible(parameter.Type, property.Type.InputType))))) &&
                lastContract.Methods
                    .Where(method => MethodSignatureHelper.IsPublicApi(method.Signature.Modifiers))
                    .All(previous => currentGeneratedMethods.Any(current =>
                        AreGeneratedMethodSignaturesEquivalent(previous.Signature, current.Signature))) &&
                !lastContract.Fields.Any(field =>
                    field.Modifiers.HasFlag(FieldModifiers.Public) ||
                    field.Modifiers.HasFlag(FieldModifiers.Protected));
        }

        private static bool AreGeneratedMethodSignaturesEquivalent(
            MethodSignature previous,
            MethodSignature current)
            => !previous.HasUnsupportedBaseContract && !current.HasUnsupportedBaseContract &&
                previous.GenericArguments is not { Count: > 0 } &&
                current.GenericArguments is not { Count: > 0 } &&
                MethodSignature.MethodSignatureComparer.Equals(previous, current) &&
                previous.Parameters.Zip(current.Parameters).All(pair =>
                    ModelBaseMemberCompatibility.AreParametersCompatible(pair.First, pair.Second)) &&
                previous.Modifiers == current.Modifiers &&
                (previous.ReturnType is null
                    ? current.ReturnType is null
                    : current.ReturnType is not null &&
                        ModelBaseMemberCompatibility.AreTypesCompatible(previous.ReturnType, current.ReturnType));

        private bool HasCompatibleLastContractProperties(ModelProvider candidate)
        {
            if (candidate.LastContractView is not { } lastContract)
            {
                return true;
            }

            var currentProperties = GetUniquePublicProperties(candidate.Properties);
            var previousProperties = GetUniquePublicProperties(lastContract.Properties);
            if (currentProperties is null || previousProperties is null)
            {
                return false;
            }
            return previousProperties.Values.All(previousProperty =>
                    currentProperties.TryGetValue(previousProperty.Name, out var currentProperty) &&
                    ModelBaseMemberCompatibility.ArePropertiesCompatible(previousProperty, currentProperty)) &&
                !currentProperties.Values.Any(property =>
                    IsRequiredInitializationProperty(property) &&
                    (!previousProperties.ContainsKey(property.Name) ||
                        !LastContractDerivedConstructorHasRequiredParameter(property)));
        }

        private static Dictionary<string, PropertyProvider>? GetUniquePublicProperties(IReadOnlyList<PropertyProvider> properties)
        {
            var result = new Dictionary<string, PropertyProvider>(StringComparer.Ordinal);
            foreach (var property in properties.Where(property => MethodSignatureHelper.IsPublicApi(property.Modifiers)))
            {
                // Overloaded indexers can share a symbol name. They are unsupported contracts, not
                // malformed input that should abort generation with a duplicate-key exception.
                if (!result.TryAdd(property.Name, property))
                {
                    return null;
                }
            }
            return result;
        }

        private static bool IsRequiredInitializationProperty(PropertyProvider property)
            => property.WireInfo is { IsRequired: true, IsReadOnly: false } &&
                !property.Type.IsLiteral;

        private bool LastContractDerivedConstructorHasRequiredParameter(PropertyProvider property)
            => _model.LastContractView?.Constructors.Any(constructor =>
                MethodSignatureHelper.IsPublicApi(constructor.Signature.Modifiers) &&
                constructor.Signature.Parameters.Any(parameter =>
                    parameter.Name == property.AsParameter.Name &&
                    parameter.Type.Equals(property.Type, ignoreNullable: true) &&
                    parameter.DefaultValue is null)) == true;

        private bool CurrentBaseRequiresReconciliation()
        {
            var currentBase = InputModel.BaseModel;
            if (currentBase is null)
            {
                return false;
            }

            var currentBaseProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(currentBase);
            return currentBaseProvider is SystemObjectModelProvider ||
                currentBaseProvider?.CustomCodeView is not null ||
                currentBaseProvider?.BaseType is not null ||
                currentBase.External is not null ||
                currentBase.BaseModel is not null ||
                currentBase.Properties.Count > 0 ||
                currentBase.AdditionalProperties is not null ||
                currentBase.DiscriminatorProperty is not null ||
                currentBase.DiscriminatorValue is not null;
        }
    }
}
