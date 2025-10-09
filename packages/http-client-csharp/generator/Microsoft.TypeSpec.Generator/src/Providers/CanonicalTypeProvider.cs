// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator.Providers
{
    internal class CanonicalTypeProvider : TypeProvider
    {
        private readonly TypeProvider _generatedTypeProvider;
        private readonly Dictionary<string, InputModelProperty> _specPropertiesMap;
        private readonly Dictionary<string, string?> _serializedNameMap;
        private readonly Dictionary<InputModelProperty, PropertyProvider> _propertyProviderMap = new();
        private readonly HashSet<string> _renamedProperties;
        private readonly HashSet<string> _renamedFields;
        private readonly IReadOnlyList<InputModelProperty> _specProperties;

        public CanonicalTypeProvider(TypeProvider generatedTypeProvider, InputType? inputType)
        {
            _generatedTypeProvider = generatedTypeProvider;
            var inputModel = inputType as InputModelType;
            _specProperties = inputModel?.Properties ?? [];
            _specPropertiesMap = _specProperties.ToDictionary(p => p.Name.ToIdentifierName(), p => p);
            _serializedNameMap = BuildSerializationNameMap();
            _renamedProperties = (_generatedTypeProvider.CustomCodeView?.Properties ?? [])
                .Where(p => p.OriginalName != null).Select(p => p.OriginalName!).ToHashSet();
            _renamedFields = (_generatedTypeProvider.CustomCodeView?.Fields ?? [])
                .Where(p => p.OriginalName != null).Select(p => p.OriginalName!).ToHashSet();
        }
        protected override string BuildRelativeFilePath() => throw new InvalidOperationException("This type should not be writing in generation");

        protected override string BuildName() => _generatedTypeProvider.Name;

        protected override string BuildNamespace() => _generatedTypeProvider.Type.Namespace;

        protected override TypeSignatureModifiers BuildDeclarationModifiers() => _generatedTypeProvider.DeclarationModifiers;

        protected override IReadOnlyList<MethodBodyStatement> BuildAttributes()
        {
            return [.. _generatedTypeProvider.Attributes, .. _generatedTypeProvider.CustomCodeView?.Attributes ?? []];
        }

        private protected override PropertyProvider[] FilterCustomizedProperties(PropertyProvider[] canonicalProperties) => canonicalProperties;
        private protected override FieldProvider[] FilterCustomizedFields(FieldProvider[] canonicalFields) => canonicalFields;

        private protected override CanonicalTypeProvider BuildCanonicalView() => this;

        protected override ConstructorProvider[] BuildConstructors()
        {
            return [.. _generatedTypeProvider.Constructors, .. _generatedTypeProvider.CustomCodeView?.Constructors ?? []];
        }

        protected override MethodProvider[] BuildMethods()
        {
            return [.. _generatedTypeProvider.Methods, .. _generatedTypeProvider.CustomCodeView?.Methods ?? []];
        }

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

                if (generatedProperty.InputProperty is InputModelProperty specProperty)
                {
                    _propertyProviderMap[specProperty] = generatedProperty;
                }
            }

            foreach (var customProperty in customProperties)
            {
                InputModelProperty? specProperty = null;

                if (TryGetSpecProperty(customProperty, out var candidateSpecProperty))
                {
                    specProperty = candidateSpecProperty;
                    customProperty.WireInfo = new PropertyWireInformation(specProperty);
                    customProperty.IsDiscriminator = customProperty.WireInfo.IsDiscriminator;
                    customProperty.Update(description: customProperty.WireInfo.Description);

                    _propertyProviderMap[specProperty] = customProperty;
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
                            serializedName ?? customProperty.Name.ToVariableName(),
                            false);
                    }
                    else
                    {
                        customProperty.WireInfo!.SerializedName = serializedName!;
                    }
                }

                customProperty.Type = customProperty.Type.ApplyInputSpecProperty(specProperty);
                customProperty.InputProperty = specProperty;
            }

            if (_specProperties.Count > 0)
            {
                // Input properties will only contain this types properties, i.e. it won't include base type properties.
                var inputProperties = new HashSet<InputProperty>(_specProperties.Count);
                var nonSpecProperties = new List<PropertyProvider>();

                // Process all properties in single pass, categorizing them
                foreach (var prop in generatedProperties)
                {
                    if (prop.InputProperty != null)
                    {
                        inputProperties.Add(prop.InputProperty);
                    }
                    else
                    {
                        nonSpecProperties.Add(prop);
                    }
                }

                foreach (var prop in customProperties)
                {
                    // Check if custom property is in spec
                    if (_specPropertiesMap.TryGetValue(prop.Name, out var specProp) ||
                        (prop.OriginalName != null && _specPropertiesMap.TryGetValue(prop.OriginalName, out specProp)))
                    {
                        inputProperties.Add(specProp);
                    }
                    else
                    {
                        nonSpecProperties.Add(prop);
                    }
                }

                var specCount = _specProperties.Count(p => inputProperties.Contains(p));
                var result = new List<PropertyProvider>(specCount + nonSpecProperties.Count);

                // Add spec properties in order
                foreach (var specProp in _specProperties)
                {
                    if (inputProperties.Contains(specProp) &&
                        _propertyProviderMap.TryGetValue(specProp, out var provider))
                    {
                        result.Add(provider);
                    }
                }

                // Add non-spec properties
                result.AddRange(nonSpecProperties);

                return [..result];
            }

            // For other types, there is no canonical order, so we can just return generated followed by custom properties.
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
                InputProperty? specProperty = null;

                if (TryGetSpecProperty(customField, out var candidateSpecProperty))
                {
                    specProperty = candidateSpecProperty;
                    customField.WireInfo = new PropertyWireInformation(specProperty);
                    customField.Update(description: customField.WireInfo.Description);
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
                            serializedName ?? customField.Name.ToVariableName(),
                            false);
                    }
                    else
                    {
                        customField.WireInfo!.SerializedName = serializedName!;
                    }
                }

                customField.Type = customField.Type.ApplyInputSpecProperty(specProperty);
            }

            // Order is not important for fields, so we can just return generated followed by custom fields
            return [..generatedFields, ..customFields];
        }

        private bool TryGetSpecProperty(
            PropertyProvider customProperty,
            [NotNullWhen(true)] out InputModelProperty? candidateSpecProperty)
        {
            if (customProperty.OriginalName != null && _specPropertiesMap.TryGetValue(customProperty.OriginalName, out candidateSpecProperty))
            {
                return true;
            }

            if (_specPropertiesMap.TryGetValue(customProperty.Name, out candidateSpecProperty) &&
                !_renamedProperties.Contains(customProperty.Name) &&
                !_renamedFields.Contains(customProperty.Name))
            {
                return true;
            }

            candidateSpecProperty = null;
            return false;
        }

        private bool TryGetSpecProperty(FieldProvider customField, [NotNullWhen(true)] out InputModelProperty? candidateSpecProperty)
        {
            if (customField.OriginalName != null && _specPropertiesMap.TryGetValue(customField.OriginalName, out candidateSpecProperty))
            {
                return true;
            }

            if (_specPropertiesMap.TryGetValue(customField.Name, out candidateSpecProperty) &&
                !_renamedProperties.Contains(customField.Name))
            {
                return true;
            }

            candidateSpecProperty = null;
            return false;
        }

        private Dictionary<string, string?> BuildSerializationNameMap()
        {
            var serializedNameMapping = new Dictionary<string, string?>();
            foreach (var serializationAttribute in _generatedTypeProvider.CustomCodeView?.Attributes ?? [])
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
