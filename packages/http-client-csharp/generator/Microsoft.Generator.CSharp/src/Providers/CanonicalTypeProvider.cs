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
        private readonly InputModelType? _inputModel;
        private readonly TypeProvider _generatedTypeProvider;

        public CanonicalTypeProvider(TypeProvider generatedTypeProvider, InputType? inputType)
        {
            _generatedTypeProvider = generatedTypeProvider;
            _inputModel = inputType as InputModelType;
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
            var specProperties = _inputModel?.Properties ?? [];
            var specPropertiesMap = specProperties.ToDictionary(p => p.Name.ToCleanName(), p => p);
            var generatedProperties = _generatedTypeProvider.Properties;
            var customProperties = _generatedTypeProvider.CustomCodeView?.Properties ?? [];

            Dictionary<string, string?> serializedNameMapping = BuildSerializationNameMap();

            // Update the serializedName of generated properties if necessary
            foreach (var generatedProperty in generatedProperties)
            {
                if (serializedNameMapping.TryGetValue(generatedProperty.Name, out var serializedName) && serializedName != null)
                {
                    generatedProperty.WireInfo!.SerializedName = serializedName;
                }
            }

            Dictionary<InputModelProperty, PropertyProvider> specToCustomPropertiesMap = BuildSpecToCustomPropertyMap(customProperties, specPropertiesMap);

            foreach (var customProperty in customProperties)
            {
                InputModelProperty? specProperty = null;

                if (((customProperty.OriginalName != null && specPropertiesMap.TryGetValue(customProperty.OriginalName, out var candidateSpecProperty))
                     || specPropertiesMap.TryGetValue(customProperty.Name, out candidateSpecProperty))
                    // Ensure that the spec property is mapped to this custom property
                    && specToCustomPropertiesMap[candidateSpecProperty] == customProperty)
                {
                    specProperty = candidateSpecProperty;
                    customProperty.WireInfo = new PropertyWireInformation(specProperty);
                }

                string? serializedName = specProperty?.SerializedName;
                bool hasCustomSerialization = false;
                // Update the serializedName of custom properties if necessary
                if (serializedNameMapping.TryGetValue(customProperty.Name, out var customSerializedName) ||
                    (customProperty.OriginalName != null && serializedNameMapping.TryGetValue(customProperty.OriginalName, out customSerializedName)))
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
                if (specProperty?.Type is InputEnumType { IsExtensible: true } inputEnumType)
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
                        TypeFactory.CreatePrimitiveCSharpTypeCore(inputEnumType.ValueType));
                }
            }

            return [..generatedProperties, ..customProperties];
        }

        private static Dictionary<InputModelProperty, PropertyProvider> BuildSpecToCustomPropertyMap(
            IReadOnlyList<PropertyProvider> customProperties,
            Dictionary<string, InputModelProperty> specPropertiesMap)
        {
            var specToCustomPropertiesMap = new Dictionary<InputModelProperty, PropertyProvider>();
            // Create a map from spec properties to custom properties so that we know which custom properties are replacing spec properties
            foreach (var customProperty in customProperties)
            {
                if ((customProperty.OriginalName != null && specPropertiesMap.TryGetValue(customProperty.OriginalName, out var specProperty))
                    || specPropertiesMap.TryGetValue(customProperty.Name, out specProperty))
                {
                    // If the spec property is not already mapped to a custom property, map it to this custom property
                    specToCustomPropertiesMap.TryAdd(specProperty, customProperty);
                }
            }
            return specToCustomPropertiesMap;
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
