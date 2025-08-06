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

                customProperty.Type = EnsureCorrectTypeRepresentation(specProperty, customProperty.Type);
            }

            if (_specProperties.Count > 0)
            {
                return
                [
                    // Include properties that are in the spec, ordered by the spec
                    .._specProperties.Select(p => _propertyProviderMap[p]),
                    // Include generated properties that are not in the spec
                    ..generatedProperties.Where(p => !_specPropertiesMap.ContainsKey(p.Name)),
                    // Include the custom properties that are not in the spec
                    ..customProperties.Where(p => !_specPropertiesMap.ContainsKey(p.Name) && (p.OriginalName == null || !_specPropertiesMap.ContainsKey(p.OriginalName)))
                ];
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

                customField.Type = EnsureCorrectTypeRepresentation(specProperty, customField.Type);
            }

            // Order is not important for fields, so we can just return generated followed by custom fields
            return [..generatedFields, ..customFields];
        }

        private static bool IsCustomizedEnumProperty(
            InputProperty? inputProperty,
            CSharpType customType,
            [NotNullWhen(true)] out InputType? specValueType)
        {
            var enumValueType = GetInputPrimitiveType(inputProperty?.Type);
            if (enumValueType != null)
            {
                specValueType = enumValueType;
                return true;
            }
            if (customType.IsEnum && inputProperty != null)
            {
                specValueType = inputProperty.Type is InputNullableType nullableType ? nullableType.Type : inputProperty.Type;
                return true;
            }
            specValueType = null;
            return false;
        }

        private static CSharpType EnsureCorrectTypeRepresentation(InputProperty? specProperty, CSharpType customType)
        {
            if (customType.IsCollection)
            {
                var elementType = EnsureCorrectTypeRepresentation(specProperty, customType.ElementType);
                if (customType.IsList)
                {
                    customType = new CSharpType(customType.FrameworkType, [elementType], customType.IsNullable);
                }
                else if (customType.IsDictionary)
                {
                    customType = new CSharpType(customType.FrameworkType, [customType.Arguments[0], elementType], customType.IsNullable);
                }
            }

            // handle customized enums - we need to pull the type information from the spec property
            customType = EnsureEnum(specProperty, customType);
            // ensure literal types are correctly represented in the custom field using the info from the spec property
            customType = EnsureLiteral(specProperty, customType);

            // Ensure the namespace is populated for custom model/enum types
            if (string.IsNullOrEmpty(customType.Namespace))
            {
                var modelType = GetInputModelType(specProperty?.Type);
                if (modelType != null)
                {
                    customType.Namespace = modelType.Namespace;
                }
                else
                {
                    var enumValueType = GetInputEnumType(specProperty?.Type);
                    if (enumValueType != null)
                    {
                        customType.Namespace = enumValueType.Namespace;
                    }
                }
            }

            return customType;
        }

        private static CSharpType EnsureLiteral(InputProperty? specProperty, CSharpType customType)
        {
            if (specProperty?.Type is InputLiteralType inputLiteral && (customType.IsFrameworkType || customType.IsEnum))
            {
                return CSharpType.FromLiteral(customType, inputLiteral.Value);
            }

            return customType;
        }

        private static CSharpType EnsureEnum(InputProperty? specProperty, CSharpType customType)
        {
            if (!customType.IsFrameworkType && IsCustomizedEnumProperty(specProperty, customType, out var specType))
            {
                if (specType is InputLiteralType literalType)
                {
                    specType = literalType.ValueType;
                }
                return new CSharpType(
                    customType.Name,
                    customType.Namespace,
                    customType.IsValueType,
                    customType.IsNullable,
                    customType.DeclaringType,
                    customType.Arguments,
                    customType.IsPublic,
                    customType.IsStruct,
                    customType.BaseType,
                    TypeFactory.CreatePrimitiveCSharpTypeCore(specType));
            }
            return customType;
        }

        private static InputPrimitiveType? GetInputPrimitiveType(InputType? type)
        {
            return type switch
            {
                InputNullableType nullableType => GetInputPrimitiveType(nullableType.Type),
                InputEnumTypeValue enumValueType => enumValueType.ValueType,
                InputEnumType enumType => enumType.ValueType,
                InputLiteralType inputLiteral => inputLiteral.ValueType,
                InputArrayType arrayType => GetInputPrimitiveType(arrayType.ValueType),
                InputDictionaryType dictionaryType => GetInputPrimitiveType(dictionaryType.ValueType),
                _ => null
            };
        }

        private static InputEnumType? GetInputEnumType(InputType? type)
        {
            return type switch
            {
                InputNullableType nullableType => GetInputEnumType(nullableType.Type),
                InputEnumType enumType => enumType,
                InputArrayType arrayType => GetInputEnumType(arrayType.ValueType),
                InputDictionaryType dictionaryType => GetInputEnumType(dictionaryType.ValueType),
                _ => null
            };
        }

        private static InputModelType? GetInputModelType(InputType? type)
        {
            return type switch
            {
                InputNullableType nullableType => GetInputModelType(nullableType.Type),
                InputModelType modelType => modelType,
                InputArrayType arrayType => GetInputModelType(arrayType.ValueType),
                InputDictionaryType dictionaryType => GetInputModelType(dictionaryType.ValueType),
                _ => null
            };
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
