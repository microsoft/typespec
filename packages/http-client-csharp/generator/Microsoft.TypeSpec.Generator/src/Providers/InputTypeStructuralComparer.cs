// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Compares input types by the metadata that affects their generated and serialized shape.
    /// </summary>
    internal static class InputTypeStructuralComparer
    {
        public static bool Equals(InputType current, InputType mapped)
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
                    Equals(currentNullable.Type, mappedNullable.Type);
            }
            if (current is InputArrayType || mapped is InputArrayType)
            {
                return current is InputArrayType currentArray && mapped is InputArrayType mappedArray &&
                    Equals(currentArray.ValueType, mappedArray.ValueType);
            }
            if (current is InputDictionaryType || mapped is InputDictionaryType)
            {
                return current is InputDictionaryType currentDictionary && mapped is InputDictionaryType mappedDictionary &&
                    Equals(currentDictionary.KeyType, mappedDictionary.KeyType) &&
                    Equals(currentDictionary.ValueType, mappedDictionary.ValueType);
            }
            if (current is InputUnionType || mapped is InputUnionType)
            {
                return current is InputUnionType currentUnion && mapped is InputUnionType mappedUnion &&
                    currentUnion.VariantTypes.Count == mappedUnion.VariantTypes.Count &&
                    currentUnion.VariantTypes.Zip(mappedUnion.VariantTypes).All(pair =>
                        Equals(pair.First, pair.Second));
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
                    Equals(currentDateTime.WireType, mappedDateTime.WireType) &&
                    EqualsOptional(currentDateTime.BaseType, mappedDateTime.BaseType);
            }
            if (current is InputDurationType || mapped is InputDurationType)
            {
                return current is InputDurationType currentDuration && mapped is InputDurationType mappedDuration &&
                    currentDuration.CrossLanguageDefinitionId == mappedDuration.CrossLanguageDefinitionId &&
                    currentDuration.Encode == mappedDuration.Encode &&
                    Equals(currentDuration.WireType, mappedDuration.WireType) &&
                    EqualsOptional(currentDuration.BaseType, mappedDuration.BaseType);
            }
            if (current is InputLiteralType || mapped is InputLiteralType)
            {
                return current is InputLiteralType currentLiteral && mapped is InputLiteralType mappedLiteral &&
                    object.Equals(currentLiteral.Value, mappedLiteral.Value) &&
                    Equals(currentLiteral.ValueType, mappedLiteral.ValueType);
            }
            if (current is InputEnumTypeValue || mapped is InputEnumTypeValue)
            {
                return current is InputEnumTypeValue currentEnumValue && mapped is InputEnumTypeValue mappedEnumValue &&
                    object.Equals(currentEnumValue.Value, mappedEnumValue.Value) &&
                    Equals(currentEnumValue.ValueType, mappedEnumValue.ValueType) &&
                    Equals(currentEnumValue.EnumType, mappedEnumValue.EnumType);
            }
            if (current is InputStreamingType || mapped is InputStreamingType)
            {
                return current is InputStreamingType currentStreaming && mapped is InputStreamingType mappedStreaming &&
                    currentStreaming.CrossLanguageDefinitionId == mappedStreaming.CrossLanguageDefinitionId &&
                    currentStreaming.StreamKind == mappedStreaming.StreamKind &&
                    currentStreaming.ContentTypes.SequenceEqual(mappedStreaming.ContentTypes) &&
                    currentStreaming.TerminalEventType == mappedStreaming.TerminalEventType &&
                    currentStreaming.TerminalEventValue == mappedStreaming.TerminalEventValue &&
                    Equals(currentStreaming.ValueType, mappedStreaming.ValueType);
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
                    Equals(currentEnum.ValueType, mappedEnum.ValueType) &&
                    (!string.IsNullOrEmpty(currentEnum.CrossLanguageDefinitionId) &&
                        currentEnum.CrossLanguageDefinitionId == mappedEnum.CrossLanguageDefinitionId ||
                    string.IsNullOrEmpty(currentEnum.CrossLanguageDefinitionId) &&
                        string.IsNullOrEmpty(mappedEnum.CrossLanguageDefinitionId) &&
                        currentEnum.Namespace == mappedEnum.Namespace && currentEnum.Name == mappedEnum.Name);
            }
            return false;
        }

        private static bool EqualsOptional(InputType? current, InputType? mapped)
            => current is null
                ? mapped is null
                : mapped is not null && Equals(current, mapped);
    }
}
