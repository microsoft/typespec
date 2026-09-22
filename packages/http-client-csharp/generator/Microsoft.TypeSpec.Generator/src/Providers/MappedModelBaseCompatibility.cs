// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Validates whether a mapped system model can safely replace a current generated base.
    /// </summary>
    internal sealed class MappedModelBaseCompatibility
    {
        private readonly ModelProvider _model;
        private InputModelType InputModel => _model.InputModel;

        public MappedModelBaseCompatibility(ModelProvider model)
        {
            _model = model;
        }

        public static bool IsSupportedModelBase(SystemObjectModelProvider mappedBase)
            => (mappedBase.UsesLastContractType ||
                mappedBase.InputModel.BaseModel is null &&
                mappedBase.InputModel.DiscriminatorProperty is null &&
                mappedBase.InputModel.DiscriminatorValue is null &&
                mappedBase.InputModel.DerivedModels.Count == 0 &&
                mappedBase.InputModel.DiscriminatedSubtypes.Count == 0) &&
                mappedBase.SystemType.IsFrameworkType &&
                mappedBase.SystemType.FrameworkType.IsClass &&
                !HasAbstractMembers(mappedBase.SystemType.FrameworkType) &&
                !mappedBase.SystemType.FrameworkType.IsSealed &&
                mappedBase.SystemType.FrameworkType != typeof(Array) &&
                mappedBase.SystemType.FrameworkType != typeof(Delegate) &&
                mappedBase.SystemType.FrameworkType != typeof(MulticastDelegate) &&
                mappedBase.SystemType.FrameworkType != typeof(Enum) &&
                mappedBase.SystemType.FrameworkType != typeof(ValueType) &&
                IsPublicFrameworkType(mappedBase.SystemType.FrameworkType);

        public bool CanUse(SystemObjectModelProvider mappedBase)
        {
            if (InputModel.BaseModel is null ||
                HasDuplicateAdditionalProperties(mappedBase) ||
                !mappedBase.HasReconstructibleLastContractConstructor ||
                !mappedBase.HasCompatibleLastContractProperties() ||
                !mappedBase.HasCompatibleLastContractNonPropertyMembers() ||
                !mappedBase.HasCompatibleLastContractInterfaces(_model.LastContractView?.BaseTypeProvider))
            {
                return false;
            }

            var lookup = new MappedPropertyLookup(mappedBase);
            return HasOneToOneMappedPropertyMatches(mappedBase) &&
                HasNoCustomMemberCollisions(mappedBase) &&
                HasCompatibleGeneratedMemberNames(mappedBase) &&
                HasCompatibleCurrentModelProperties(lookup) &&
                HasCompatibleDisplacedBase(mappedBase, lookup);
        }

        public static bool AreContractsEquivalent(
            SystemObjectModelProvider left,
            SystemObjectModelProvider right)
        {
            // Inherited input contracts affect the effective property and constructor surface.
            // Keep hierarchical candidates ambiguous rather than attempting recursive reconciliation here.
            if (left.InputModel.BaseModel is not null || right.InputModel.BaseModel is not null)
            {
                return false;
            }

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
                    InputTypeStructuralComparer.Equals(left.InputModel.AdditionalProperties, rightAdditionalProperties);
        }

        private bool HasDuplicateAdditionalProperties(SystemObjectModelProvider mappedBase)
            => InputModel.AdditionalProperties is not null &&
                mappedBase.InputModel.AdditionalProperties is not null;

        private static bool HasOneToOneMappedPropertyMatches(SystemObjectModelProvider mappedBase)
        {
            var matchedProperties = new HashSet<PropertyProvider>(ReferenceEqualityComparer.Instance);
            foreach (var inputProperty in mappedBase.InputModel.Properties)
            {
                PropertyProvider? matchedProperty = null;
                foreach (var effectiveProperty in mappedBase.Properties)
                {
                    if (!CodeModelGenerator.Instance.TypeFactory.IsLastContractModelBasePropertyCompatible(
                        mappedBase.SystemType,
                        inputProperty,
                        effectiveProperty))
                    {
                        continue;
                    }

                    if (matchedProperty is not null || !matchedProperties.Add(effectiveProperty))
                    {
                        return false;
                    }
                    matchedProperty = effectiveProperty;
                }

                if (matchedProperty is null)
                {
                    return false;
                }
            }
            return true;
        }

        private bool HasNoCustomMemberCollisions(SystemObjectModelProvider mappedBase)
        {
            if (_model.CustomCodeView is not { } customCode)
            {
                return true;
            }

            if (customCode.Constructors.Count > 0)
            {
                return false;
            }

            var customMemberNames = customCode.Properties.Select(property => property.Name)
                .Concat(customCode.Fields.Select(field => field.Name))
                .Concat(customCode.Methods.Select(method => method.Signature.Name))
                .ToHashSet(StringComparer.Ordinal);
            return !customMemberNames.Overlaps(mappedBase.GetPublicApiMemberNames());
        }

        private bool HasCompatibleGeneratedMemberNames(SystemObjectModelProvider mappedBase)
        {
            var displacedPropertyNames = mappedBase.InputModel.Properties
                .Select(property => property.Name)
                .ToHashSet(StringComparer.Ordinal);
            var generatedPropertyNames = InputModel.Properties
                .Where(property => !displacedPropertyNames.Contains(property.Name))
                .Select(GetInputPropertyClrName)
                .ToHashSet(StringComparer.Ordinal);
            return !generatedPropertyNames.Overlaps(mappedBase.GetFrameworkPublicApiMemberNames());
        }

        private bool HasCompatibleCurrentModelProperties(MappedPropertyLookup lookup)
        {
            var currentBaseByWireName = InputModel.BaseModel?.Properties
                .GroupBy(property => property.SerializedName ?? property.Name, StringComparer.Ordinal)
                .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
            return InputModel.Properties.Where(property => !property.IsHttpMetadata).All(property =>
            {
                var wireName = property.SerializedName ?? property.Name;
                if (currentBaseByWireName?.TryGetValue(wireName, out var currentBaseProperty) == true)
                {
                    return AreMappedPropertyShapesCompatible(property, currentBaseProperty, ignoreRequiredness: true);
                }

                var clrName = GetInputPropertyClrName(property);
                var hasMappedInputProperty = lookup.ByWireName.ContainsKey(wireName) ||
                    lookup.ByClrName.ContainsKey(clrName);
                return IsMappedPropertyCompatible(property, lookup.ByWireName, lookup.ByClrName) &&
                    (hasMappedInputProperty || !lookup.EffectiveClrNames.Contains(clrName));
            });
        }

        private bool HasCompatibleDisplacedBase(
            SystemObjectModelProvider mappedBase,
            MappedPropertyLookup lookup)
        {
            var currentBase = InputModel.BaseModel;
            if (currentBase is null)
            {
                return false;
            }

            if (mappedBase.UsesLastContractType &&
                !currentBase.Properties.All(property => IsRepresentedByEffectiveMappedProperty(
                    mappedBase.SystemType,
                    property,
                    mappedBase.Properties)))
            {
                return false;
            }

            if (!mappedBase.UsesLastContractType &&
                currentBase.Properties.Count != mappedBase.InputModel.Properties.Count)
            {
                return false;
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
                {
                    var wireName = property.SerializedName ?? property.Name;
                    return lookup.ByWireName.ContainsKey(wireName) &&
                        IsMappedPropertyCompatible(property, lookup.ByWireName, lookup.ByClrName);
                }))
            {
                return false;
            }

            return HasCompatibleAdditionalProperties(currentBase, mappedBase);
        }

        private static bool HasCompatibleAdditionalProperties(
            InputModelType currentBase,
            SystemObjectModelProvider mappedBase)
            => currentBase.AdditionalProperties is null
                ? mappedBase.InputModel.AdditionalProperties is null
                : !mappedBase.UsesLastContractType &&
                    mappedBase.InputModel.AdditionalProperties is { } mappedAdditionalProperties &&
                    InputTypeStructuralComparer.Equals(currentBase.AdditionalProperties, mappedAdditionalProperties);

        private static bool IsMappedPropertyCompatible(
            InputModelProperty property,
            IReadOnlyDictionary<string, InputModelProperty> mappedByWireName,
            IReadOnlyDictionary<string, InputModelProperty> mappedByClrName)
        {
            var wireName = property.SerializedName ?? property.Name;
            var clrName = GetInputPropertyClrName(property);
            var hasWireMatch = mappedByWireName.TryGetValue(wireName, out var wireMatch);
            var hasClrMatch = mappedByClrName.TryGetValue(clrName, out var clrMatch);
            if (!hasWireMatch && !hasClrMatch)
            {
                return true;
            }

            return hasWireMatch && hasClrMatch &&
                ReferenceEquals(wireMatch, clrMatch) &&
                AreMappedPropertyShapesCompatible(property, wireMatch!);
        }

        private static string GetInputPropertyClrName(InputModelProperty property)
            => property.IsExactName
                ? property.Name
                : property.Name.ToIdentifierName().NormalizeCSharpAcronyms(property.Type.IsDateTimeInputType());

        private static bool IsRepresentedByEffectiveMappedProperty(
            CSharpType mappedBase,
            InputModelProperty property,
            IReadOnlyList<PropertyProvider> effectiveProperties)
            => effectiveProperties.Any(effective =>
                CodeModelGenerator.Instance.TypeFactory.IsLastContractModelBasePropertyCompatible(
                    mappedBase,
                    property,
                    effective));

        private static bool AreMappedPropertyShapesCompatible(
            InputModelProperty current,
            InputModelProperty mapped,
            bool ignoreRequiredness = false)
            => (ignoreRequiredness || current.IsRequired == mapped.IsRequired) &&
                GetInputPropertyClrName(current) == GetInputPropertyClrName(mapped) &&
                current.IsReadOnly == mapped.IsReadOnly &&
                current.IsHttpMetadata == mapped.IsHttpMetadata &&
                current.IsDiscriminator == mapped.IsDiscriminator &&
                current.Encode == mapped.Encode &&
                InputSerializationOptionsStructuralComparer.Equals(
                    current.SerializationOptions,
                    mapped.SerializationOptions) &&
                (current.Type is InputNullableType) == (mapped.Type is InputNullableType) &&
                InputTypeStructuralComparer.Equals(current.Type, mapped.Type);

        private static bool HasAbstractMembers(Type type)
            => type.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)
                .Any(method => method.IsAbstract);

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

        private sealed class MappedPropertyLookup
        {
            public MappedPropertyLookup(SystemObjectModelProvider mappedBase)
            {
                ByWireName = mappedBase.InputModel.Properties
                    .GroupBy(property => property.SerializedName ?? property.Name, StringComparer.Ordinal)
                    .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
                ByClrName = mappedBase.InputModel.Properties
                    .GroupBy(GetInputPropertyClrName, StringComparer.Ordinal)
                    .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
                EffectiveClrNames = mappedBase.UsesLastContractType
                    ? mappedBase.Properties.Select(property => property.Name).ToHashSet(StringComparer.Ordinal)
                    : new HashSet<string>(StringComparer.Ordinal);
            }

            public IReadOnlyDictionary<string, InputModelProperty> ByWireName { get; }
            public IReadOnlyDictionary<string, InputModelProperty> ByClrName { get; }
            public IReadOnlySet<string> EffectiveClrNames { get; }
        }
    }
}
