// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
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
        private InputModelType InputModel => _model.InputModel;

        public ModelBaseTypeCompatibility(ModelProvider model)
        {
            _model = model;
        }

        public bool CanRestore(ModelProvider candidate)
        {
            if (candidate is not SystemObjectModelProvider && candidate.LastContractView?.BaseType is not null)
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
                ? mappedBase.SystemType.IsFrameworkType &&
                    mappedBase.SystemType.FrameworkType.IsClass &&
                    !mappedBase.SystemType.FrameworkType.IsSealed &&
                    mappedBase.SystemType.FrameworkType != typeof(Array) &&
                    mappedBase.SystemType.FrameworkType != typeof(Delegate) &&
                    mappedBase.SystemType.FrameworkType != typeof(MulticastDelegate) &&
                    mappedBase.SystemType.FrameworkType != typeof(Enum) &&
                    mappedBase.SystemType.FrameworkType != typeof(ValueType) &&
                    IsPublicFrameworkType(mappedBase.SystemType.FrameworkType)
                :
                !candidate.IsExternal &&
                candidate.CustomCodeView is null &&
                candidate.BaseType is null &&
                candidate.InputModel.DiscriminatorProperty is null &&
                candidate.InputModel.DiscriminatorValue is null &&
                candidate.InputModel.DerivedModels.Count == 0 &&
                candidate.InputModel.DiscriminatedSubtypes.Count == 0 &&
                HasCompatibleLastContractProperties(candidate) &&
                candidate.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Class) &&
                !candidate.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Sealed) &&
                (!_model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public) ||
                    candidate.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));

        public bool CanUseMappedBase(SystemObjectModelProvider mappedBase)
        {
            if (InputModel.AdditionalProperties is not null && mappedBase.InputModel.AdditionalProperties is not null)
            {
                return false;
            }

            var mappedByWireName = mappedBase.InputModel.Properties
                .GroupBy(property => property.SerializedName ?? property.Name, StringComparer.Ordinal)
                .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
            var mappedByClrName = mappedBase.InputModel.Properties
                .GroupBy(GetInputPropertyClrName, StringComparer.Ordinal)
                .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

            if (!InputModel.Properties.Where(property => !property.IsHttpMetadata).All(property =>
                IsMappedPropertyCompatible(property, mappedByWireName, mappedByClrName, requireMatch: false)))
            {
                return false;
            }

            var currentBase = InputModel.BaseModel;
            if (currentBase is null)
            {
                return true;
            }

            var currentBaseProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(currentBase);
            if (currentBaseProvider is SystemObjectModelProvider ||
                currentBaseProvider?.CustomCodeView is not null ||
                currentBaseProvider?.BaseType is not null ||
                currentBase.External is not null ||
                currentBase.BaseModel is not null ||
                currentBase.DiscriminatorProperty is not null ||
                currentBase.DiscriminatorValue is not null ||
                !currentBase.Properties.All(property =>
                    mappedByWireName.ContainsKey(property.SerializedName ?? property.Name)))
            {
                return false;
            }

            if (currentBase.AdditionalProperties is null)
            {
                return mappedBase.InputModel.AdditionalProperties is null;
            }

            return mappedBase.InputModel.AdditionalProperties is { } mappedAdditionalProperties &&
                AreInputTypesStructurallyEqual(currentBase.AdditionalProperties, mappedAdditionalProperties);
        }

        public static bool AreMappedContractsEquivalent(
            SystemObjectModelProvider left,
            SystemObjectModelProvider right)
        {
            if (left.InputModel.Properties.Count != right.InputModel.Properties.Count)
            {
                return false;
            }

            if (!left.InputModel.Properties.Zip(right.InputModel.Properties).All(pair =>
                (pair.First.SerializedName ?? pair.First.Name) == (pair.Second.SerializedName ?? pair.Second.Name) &&
                GetInputPropertyClrName(pair.First) == GetInputPropertyClrName(pair.Second) &&
                AreMappedPropertyShapesCompatible(pair.First, pair.Second)))
            {
                return false;
            }

            return left.InputModel.AdditionalProperties is null
                ? right.InputModel.AdditionalProperties is null
                : right.InputModel.AdditionalProperties is { } rightAdditionalProperties &&
                    AreInputTypesStructurallyEqual(left.InputModel.AdditionalProperties, rightAdditionalProperties);
        }

        private bool HasCompatibleLastContractProperties(ModelProvider candidate)
        {
            if (candidate.LastContractView is not { } lastContract)
            {
                return true;
            }

            var currentProperties = candidate.Properties
                .Where(property => MethodSignatureHelper.IsPublicApi(property.Modifiers))
                .ToDictionary(property => property.Name, StringComparer.Ordinal);
            var previousProperties = lastContract.Properties
                .Where(property => MethodSignatureHelper.IsPublicApi(property.Modifiers))
                .ToDictionary(property => property.Name, StringComparer.Ordinal);
            return previousProperties.Values.All(previousProperty =>
                    currentProperties.TryGetValue(previousProperty.Name, out var currentProperty) &&
                    currentProperty.Type.Equals(previousProperty.Type, ignoreNullable: true) &&
                    currentProperty.Body.HasSetter == previousProperty.Body.HasSetter) &&
                !currentProperties.Values.Any(property =>
                    IsRequiredInitializationProperty(property) &&
                    (!previousProperties.ContainsKey(property.Name) ||
                        !LastContractConstructorHasParameter(property)));
        }

        private static bool IsRequiredInitializationProperty(PropertyProvider property)
            => property.WireInfo is { IsRequired: true, IsReadOnly: false } &&
                !property.Type.IsLiteral;

        private bool LastContractConstructorHasParameter(PropertyProvider property)
            => _model.LastContractView?.Constructors.Any(constructor =>
                MethodSignatureHelper.IsPublicApi(constructor.Signature.Modifiers) &&
                constructor.Signature.Parameters.Any(parameter =>
                    parameter.Name == property.AsParameter.Name &&
                    parameter.Type.Equals(property.Type, ignoreNullable: true) &&
                    parameter.DefaultValue is null)) == true;

        private static bool IsMappedPropertyCompatible(
            InputModelProperty property,
            IReadOnlyDictionary<string, InputModelProperty> mappedByWireName,
            IReadOnlyDictionary<string, InputModelProperty> mappedByClrName,
            bool requireMatch)
        {
            var wireName = property.SerializedName ?? property.Name;
            var clrName = GetInputPropertyClrName(property);
            var hasWireMatch = mappedByWireName.TryGetValue(wireName, out var wireMatch);
            var hasClrMatch = mappedByClrName.TryGetValue(clrName, out var clrMatch);
            if (!hasWireMatch && !hasClrMatch)
            {
                return !requireMatch;
            }

            return hasWireMatch && hasClrMatch &&
                ReferenceEquals(wireMatch, clrMatch) &&
                AreMappedPropertyShapesCompatible(property, wireMatch!);
        }

        private static string GetInputPropertyClrName(InputModelProperty property)
            => property.IsExactName
                ? property.Name
                : property.Name.ToIdentifierName().NormalizeCSharpAcronyms(property.Type.IsDateTimeInputType());

        private static bool AreMappedPropertyShapesCompatible(InputModelProperty current, InputModelProperty mapped)
            => current.IsRequired == mapped.IsRequired &&
                current.IsReadOnly == mapped.IsReadOnly &&
                current.IsHttpMetadata == mapped.IsHttpMetadata &&
                current.IsDiscriminator == mapped.IsDiscriminator &&
                current.Encode == mapped.Encode &&
                (current.Type is InputNullableType) == (mapped.Type is InputNullableType) &&
                AreInputTypesStructurallyEqual(current.Type, mapped.Type);

        private static bool AreInputTypesStructurallyEqual(InputType current, InputType mapped)
        {
            if (current.External is not null || mapped.External is not null)
            {
                return current.External is not null && mapped.External is not null &&
                    current.External.Identity == mapped.External.Identity &&
                    current.External.Package == mapped.External.Package &&
                    current.External.MinVersion == mapped.External.MinVersion;
            }
            if (current is InputNullableType || mapped is InputNullableType)
            {
                return current is InputNullableType currentNullable && mapped is InputNullableType mappedNullable &&
                    AreInputTypesStructurallyEqual(currentNullable.Type, mappedNullable.Type);
            }
            if (current is InputArrayType || mapped is InputArrayType)
            {
                return current is InputArrayType currentArray && mapped is InputArrayType mappedArray &&
                    AreInputTypesStructurallyEqual(currentArray.ValueType, mappedArray.ValueType);
            }
            if (current is InputDictionaryType || mapped is InputDictionaryType)
            {
                return current is InputDictionaryType currentDictionary && mapped is InputDictionaryType mappedDictionary &&
                    AreInputTypesStructurallyEqual(currentDictionary.KeyType, mappedDictionary.KeyType) &&
                    AreInputTypesStructurallyEqual(currentDictionary.ValueType, mappedDictionary.ValueType);
            }
            if (current is InputUnionType || mapped is InputUnionType)
            {
                return current is InputUnionType currentUnion && mapped is InputUnionType mappedUnion &&
                    currentUnion.VariantTypes.Count == mappedUnion.VariantTypes.Count &&
                    currentUnion.VariantTypes.Zip(mappedUnion.VariantTypes).All(pair =>
                        AreInputTypesStructurallyEqual(pair.First, pair.Second));
            }
            if (current is InputPrimitiveType || mapped is InputPrimitiveType)
            {
                return current is InputPrimitiveType currentPrimitive && mapped is InputPrimitiveType mappedPrimitive &&
                    currentPrimitive.Kind == mappedPrimitive.Kind &&
                    currentPrimitive.Encode == mappedPrimitive.Encode;
            }
            if (current is InputDateTimeType || mapped is InputDateTimeType)
            {
                return current is InputDateTimeType currentDateTime && mapped is InputDateTimeType mappedDateTime &&
                    currentDateTime.CrossLanguageDefinitionId == mappedDateTime.CrossLanguageDefinitionId &&
                    currentDateTime.Encode == mappedDateTime.Encode &&
                    AreInputTypesStructurallyEqual(currentDateTime.WireType, mappedDateTime.WireType) &&
                    AreOptionalInputTypesStructurallyEqual(currentDateTime.BaseType, mappedDateTime.BaseType);
            }
            if (current is InputDurationType || mapped is InputDurationType)
            {
                return current is InputDurationType currentDuration && mapped is InputDurationType mappedDuration &&
                    currentDuration.CrossLanguageDefinitionId == mappedDuration.CrossLanguageDefinitionId &&
                    currentDuration.Encode == mappedDuration.Encode &&
                    AreInputTypesStructurallyEqual(currentDuration.WireType, mappedDuration.WireType) &&
                    AreOptionalInputTypesStructurallyEqual(currentDuration.BaseType, mappedDuration.BaseType);
            }
            if (current is InputLiteralType || mapped is InputLiteralType)
            {
                return current is InputLiteralType currentLiteral && mapped is InputLiteralType mappedLiteral &&
                    Equals(currentLiteral.Value, mappedLiteral.Value) &&
                    AreInputTypesStructurallyEqual(currentLiteral.ValueType, mappedLiteral.ValueType);
            }
            if (current is InputEnumTypeValue || mapped is InputEnumTypeValue)
            {
                return current is InputEnumTypeValue currentEnumValue && mapped is InputEnumTypeValue mappedEnumValue &&
                    Equals(currentEnumValue.Value, mappedEnumValue.Value) &&
                    AreInputTypesStructurallyEqual(currentEnumValue.ValueType, mappedEnumValue.ValueType) &&
                    AreInputTypesStructurallyEqual(currentEnumValue.EnumType, mappedEnumValue.EnumType);
            }
            if (current is InputStreamingType || mapped is InputStreamingType)
            {
                return current is InputStreamingType currentStreaming && mapped is InputStreamingType mappedStreaming &&
                    currentStreaming.CrossLanguageDefinitionId == mappedStreaming.CrossLanguageDefinitionId &&
                    currentStreaming.StreamKind == mappedStreaming.StreamKind &&
                    currentStreaming.ContentTypes.SequenceEqual(mappedStreaming.ContentTypes) &&
                    currentStreaming.TerminalEventType == mappedStreaming.TerminalEventType &&
                    currentStreaming.TerminalEventValue == mappedStreaming.TerminalEventValue &&
                    AreInputTypesStructurallyEqual(currentStreaming.ValueType, mappedStreaming.ValueType);
            }
            if (current is InputModelType || mapped is InputModelType)
            {
                return current is InputModelType currentModel && mapped is InputModelType mappedModel &&
                    (!string.IsNullOrEmpty(currentModel.CrossLanguageDefinitionId) &&
                        currentModel.CrossLanguageDefinitionId == mappedModel.CrossLanguageDefinitionId ||
                    string.IsNullOrEmpty(currentModel.CrossLanguageDefinitionId) &&
                        string.IsNullOrEmpty(mappedModel.CrossLanguageDefinitionId) &&
                        currentModel.Namespace == mappedModel.Namespace && currentModel.Name == mappedModel.Name);
            }
            if (current is InputEnumType || mapped is InputEnumType)
            {
                return current is InputEnumType currentEnum && mapped is InputEnumType mappedEnum &&
                    currentEnum.IsExtensible == mappedEnum.IsExtensible &&
                    AreInputTypesStructurallyEqual(currentEnum.ValueType, mappedEnum.ValueType) &&
                    (!string.IsNullOrEmpty(currentEnum.CrossLanguageDefinitionId) &&
                        currentEnum.CrossLanguageDefinitionId == mappedEnum.CrossLanguageDefinitionId ||
                    string.IsNullOrEmpty(currentEnum.CrossLanguageDefinitionId) &&
                        string.IsNullOrEmpty(mappedEnum.CrossLanguageDefinitionId) &&
                        currentEnum.Namespace == mappedEnum.Namespace && currentEnum.Name == mappedEnum.Name);
            }
            return false;
        }

        private static bool AreOptionalInputTypesStructurallyEqual(InputType? current, InputType? mapped)
            => current is null
                ? mapped is null
                : mapped is not null && AreInputTypesStructurallyEqual(current, mapped);

        private static bool IsPublicFrameworkType(Type type)
        {
            for (var current = type; current is not null; current = current.DeclaringType)
            {
                if (!current.IsPublic && !current.IsNestedPublic)
                {
                    return false;
                }
            }
            return true;
        }

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
