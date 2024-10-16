// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.SourceInput;

namespace Microsoft.Generator.CSharp.Providers
{
    internal class CanonicalTypeProvider : TypeProvider
    {
        private readonly TypeProvider _generatedTypeProvider;
        private readonly Dictionary<string, InputModelProperty> _specPropertiesMap;
        private readonly Dictionary<string, string?> _serializedNameMap;
        private readonly Dictionary<InputModelProperty, FieldProvider> _specToCustomFieldMap;

        public CanonicalTypeProvider(TypeProvider generatedTypeProvider, InputType? inputType)
        {
            _generatedTypeProvider = generatedTypeProvider;
            var inputModel = inputType as InputModelType;
            var specProperties = inputModel?.Properties ?? [];
            _specPropertiesMap = specProperties.ToDictionary(p => p.Name.ToCleanName(), p => p);
            _serializedNameMap = BuildSerializationNameMap();
            _specToCustomFieldMap = BuildSpecToCustomFieldMap();
        }
        protected override string BuildRelativeFilePath() => throw new InvalidOperationException("This type should not be writing in generation");

        protected override string BuildName() => _generatedTypeProvider.Name;

        protected override string GetNamespace() => _generatedTypeProvider.Namespace;

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _generatedTypeProvider.DeclarationModifiers;

        private protected override PropertyProvider[] FilterCustomizedProperties(PropertyProvider[] canonicalProperties) => canonicalProperties;

        private protected override CanonicalTypeProvider GetCanonicalView() => this;

        // TODO - Implement BuildMethods, BuildConstructors, etc as needed

        protected override PropertyProvider[] BuildProperties()
        {
            var generatedProperties = _generatedTypeProvider.Properties;
            var customProperties = _generatedTypeProvider.CustomCodeView?.Properties ?? [];

            // Update the serializedName of generated properties if necessary
            foreach (var generatedProperty in generatedProperties)
            {
                if (_serializedNameMap.TryGetValue(generatedProperty.Name, out var serializedName) && serializedName != null)
                {
                    generatedProperty.WireInfo!.SerializedName = serializedName;
                }
            }

            Dictionary<InputModelProperty, PropertyProvider> specToCustomPropertiesMap = BuildSpecToCustomPropertyMap(customProperties);

            foreach (var customProperty in customProperties)
            {
                InputModelProperty? specProperty = null;

                if (((customProperty.OriginalName != null && _specPropertiesMap.TryGetValue(customProperty.OriginalName, out var candidateSpecProperty))
                     || _specPropertiesMap.TryGetValue(customProperty.Name, out candidateSpecProperty))
                    // Ensure that the spec property is mapped to this custom property
                    && specToCustomPropertiesMap.TryGetValue(candidateSpecProperty, out var mappedProperty) && mappedProperty == customProperty)
                {
                    specProperty = candidateSpecProperty;
                    customProperty.IsDiscriminator = specProperty.IsDiscriminator;
                    customProperty.WireInfo = new PropertyWireInformation(specProperty);
                }

                string? serializedName = specProperty?.SerializedName;
                bool hasCustomSerialization = false;
                // Update the serializedName of custom properties if necessary
                if (_serializedNameMap.TryGetValue(customProperty.Name, out var customSerializedName) ||
                    (customProperty.OriginalName != null && _serializedNameMap.TryGetValue(customProperty.OriginalName, out customSerializedName)))
                {
                    hasCustomSerialization = true;
                    if (customSerializedName != null)
                    {
                        serializedName = customSerializedName;
                    }
                }

                if (serializedName != null || hasCustomSerialization)
                {
                    if (specProperty == null)
                    {
                        customProperty.WireInfo = new(
                            SerializationFormat.Default,
                            false,
                            !customProperty.Body.HasSetter,
                            customProperty.Type.IsNullable,
                            false,
                            serializedName ?? customProperty.Name.ToVariableName());;
                    }
                    else
                    {
                        customProperty.WireInfo!.SerializedName = serializedName!;
                    }
                }

                // handle customized extensible enums, since the custom type would not be an enum, but the spec type would be an enum

                if (IsExtensibleEnum(specProperty!, out var inputEnumType))
                {
                    customProperty.Type = new CSharpType(
                        customProperty.Type.Name,
                        customProperty.Type.Namespace,
                        customProperty.Type.IsValueType,
                        customProperty.Type.IsNullable,
                        customProperty.Type.DeclaringType,
                        customProperty.Type.Arguments,
                        customProperty.Type.IsPublic,
                        customProperty.Type.IsStruct,
                        customProperty.Type.BaseType,
                        TypeFactory.CreatePrimitiveCSharpTypeCore(inputEnumType!.ValueType));
                }
            }

            return [..generatedProperties, ..customProperties];
        }

        protected override FieldProvider[] BuildFields()
        {
            var generatedFields = _generatedTypeProvider.Fields;
            var customFields = _generatedTypeProvider.CustomCodeView?.Fields ?? [];

            // Update the serializedName of generated properties if necessary
            foreach (var generatedField in generatedFields)
            {
                if (_serializedNameMap.TryGetValue(generatedField.Name, out var serializedName) && serializedName != null)
                {
                    generatedField.WireInfo!.SerializedName = serializedName;
                }
            }

            foreach (var customField in customFields)
            {
                InputModelProperty? specProperty = null;

                if (((customField.OriginalName != null && _specPropertiesMap.TryGetValue(customField.OriginalName, out var candidateSpecProperty))
                     || _specPropertiesMap.TryGetValue(customField.Name, out candidateSpecProperty))
                    // Ensure that the spec property is mapped to this custom property
                    && _specToCustomFieldMap[candidateSpecProperty] == customField)
                {
                    specProperty = candidateSpecProperty;
                    customField.WireInfo = new PropertyWireInformation(specProperty);
                }

                string? serializedName = specProperty?.SerializedName;
                bool hasCustomSerialization = false;
                // Update the serializedName of custom properties if necessary
                if (_serializedNameMap.TryGetValue(customField.Name, out var customSerializedName) ||
                    (customField.OriginalName != null && _serializedNameMap.TryGetValue(customField.OriginalName, out customSerializedName)))
                {
                    hasCustomSerialization = true;
                    if (customSerializedName != null)
                    {
                        serializedName = customSerializedName;
                    }
                }

                if (serializedName != null || hasCustomSerialization)
                {
                    if (specProperty == null)
                    {
                        customField.WireInfo = new(
                            SerializationFormat.Default,
                            false,
                            true,
                            customField.Type.IsNullable,
                            false,
                            serializedName ?? customField.Name.ToVariableName());;
                    }
                    else
                    {
                        customField.WireInfo!.SerializedName = serializedName!;
                    }
                }

                // handle customized extensible enums, since the custom type would not be an enum, but the spec type would be an enum
                if (IsExtensibleEnum(specProperty!, out var inputEnumType))
                {
                    customField.Type = new CSharpType(
                        customField.Type.Name,
                        customField.Type.Namespace,
                        customField.Type.IsValueType,
                        customField.Type.IsNullable,
                        customField.Type.DeclaringType,
                        customField.Type.Arguments,
                        customField.Type.IsPublic,
                        customField.Type.IsStruct,
                        customField.Type.BaseType,
                        TypeFactory.CreatePrimitiveCSharpTypeCore(inputEnumType!.ValueType));
                }
            }

            return [..generatedFields, ..customFields];
        }

        private static bool IsExtensibleEnum(InputModelProperty? inputProperty, out InputEnumType? inputEnumType)
        {
            switch (inputProperty?.Type)
            {
                case InputEnumType { IsExtensible: true } enumType:
                    inputEnumType = enumType;
                    return true;
                case InputLiteralType { ValueType: InputEnumType { IsExtensible: true } enumTypeFromLiteral }:
                    inputEnumType = enumTypeFromLiteral;
                    return true;
                default:
                    inputEnumType = null;
                    return false;
            }
        }

        private Dictionary<InputModelProperty, PropertyProvider> BuildSpecToCustomPropertyMap(IReadOnlyList<PropertyProvider> customProperties)
        {
            var specToCustomPropertiesMap = new Dictionary<InputModelProperty, PropertyProvider>();
            // Create a map from spec properties to custom properties so that we know which custom properties are replacing spec properties
            foreach (var customProperty in customProperties)
            {
                if ((customProperty.OriginalName != null && _specPropertiesMap.TryGetValue(customProperty.OriginalName, out var specProperty))
                    || _specPropertiesMap.TryGetValue(customProperty.Name, out specProperty))
                {
                    // If the spec property is not already mapped to a custom property or field, map it to this custom property
                    if (!_specToCustomFieldMap.ContainsKey(specProperty))
                    {
                        specToCustomPropertiesMap.TryAdd(specProperty, customProperty);
                    }
                }
            }
            return specToCustomPropertiesMap;
        }

        private Dictionary<InputModelProperty, FieldProvider> BuildSpecToCustomFieldMap()
        {
            var customFields = _generatedTypeProvider.CustomCodeView?.Fields ?? [];
            var specToCustomFieldsMap = new Dictionary<InputModelProperty, FieldProvider>();
            // Create a map from spec properties to custom properties so that we know which custom properties are replacing spec properties
            foreach (var customField in customFields)
            {
                if ((customField.OriginalName != null && _specPropertiesMap.TryGetValue(customField.OriginalName, out var specProperty))
                    || _specPropertiesMap.TryGetValue(customField.Name, out specProperty))
                {
                    // If the spec property is not already mapped to a custom property, map it to this custom property
                    specToCustomFieldsMap.TryAdd(specProperty, customField);
                }
            }
            return specToCustomFieldsMap;
        }

        private Dictionary<string, string?> BuildSerializationNameMap()
        {
            var serializationAttributes = _generatedTypeProvider.CustomCodeView?.GetAttributes().
                Where(a => a.AttributeClass?.Name == CodeGenAttributes.CodeGenSerializationAttributeName) ?? [];
            var serializedNameMapping = new Dictionary<string, string?>();
            foreach (var serializationAttribute in serializationAttributes)
            {
                if (CodeGenAttributes.TryGetCodeGenSerializationAttributeValue(
                        serializationAttribute,
                        out var propertyName,
                        out string? serializationName,
                        out _,
                        out _,
                        out _))
                {
                    serializedNameMapping[propertyName] = serializationName;
                }
            }
            return serializedNameMapping;
        }
    }
}
