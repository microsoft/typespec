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
                ? mappedBase.SystemType.IsFrameworkType &&
                    mappedBase.SystemType.FrameworkType.IsClass &&
                    !HasAbstractMembers(mappedBase.SystemType.FrameworkType) &&
                    !mappedBase.SystemType.FrameworkType.IsSealed &&
                    mappedBase.SystemType.FrameworkType != typeof(Array) &&
                    mappedBase.SystemType.FrameworkType != typeof(Delegate) &&
                    mappedBase.SystemType.FrameworkType != typeof(MulticastDelegate) &&
                    mappedBase.SystemType.FrameworkType != typeof(Enum) &&
                    mappedBase.SystemType.FrameworkType != typeof(ValueType) &&
                    IsPublicFrameworkType(mappedBase.SystemType.FrameworkType)
                :
                InputModel.Properties.Count == 0 &&
                InputModel.AdditionalProperties is null &&
                _model.CustomCodeView is null &&
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
            if (InputModel.BaseModel is null ||
                HasDuplicateAdditionalProperties(mappedBase) ||
                !mappedBase.HasReconstructibleLastContractConstructor)
            {
                return false;
            }

            var lookup = new MappedPropertyLookup(mappedBase);
            return HasOneToOneMappedPropertyMatches(mappedBase) &&
                HasNoCustomMemberCollisions(mappedBase) &&
                HasCompatibleCurrentModelProperties(lookup) &&
                HasCompatibleDisplacedBase(mappedBase, lookup);
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
            return !mappedBase.Properties.Any(property =>
                MethodSignatureHelper.IsPublicApi(property.Modifiers) &&
                customMemberNames.Contains(property.Name));
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
                    InputTypeStructuralComparer.Equals(left.InputModel.AdditionalProperties, rightAdditionalProperties);
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
                        !LastContractDerivedConstructorHasRequiredParameter(property)));
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
                (current.Type is InputNullableType) == (mapped.Type is InputNullableType) &&
                InputTypeStructuralComparer.Equals(current.Type, mapped.Type);

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
