// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.SourceInput;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    public sealed class ModelProvider : TypeProvider
    {
        private const string AdditionalBinaryDataPropsFieldDescription = "Keeps track of any properties unknown to the library.";
        private const string AdditionalBinaryDataPropsFieldName = "_additionalBinaryDataProperties";
        private const string DefaultAdditionalPropertiesPropertyName = "AdditionalProperties";
        private readonly InputModelType _inputModel;

        protected override FormattableString Description { get; }

        private readonly CSharpType _additionalBinaryDataPropsFieldType = typeof(IDictionary<string, BinaryData>);
        private readonly Type _additionalPropsUnknownType = typeof(BinaryData);
        private readonly Lazy<TypeProvider?>? _baseTypeProvider;
        private FieldProvider? _rawDataField;
        private List<FieldProvider>? _additionalPropertyFields;
        private List<PropertyProvider>? _additionalPropertyProperties;
        private ModelProvider? _baseModelProvider;
        private ConstructorProvider? _fullConstructor;

        public ModelProvider(InputModelType inputModel)
        {
            _inputModel = inputModel;
            Description = inputModel.Description != null ? FormattableStringHelpers.FromString(inputModel.Description) : $"The {Name}.";

            if (inputModel.BaseModel is not null)
            {
                _baseTypeProvider = new(() => CodeModelPlugin.Instance.TypeFactory.CreateModel(inputModel.BaseModel));
                DiscriminatorValueExpression = EnsureDiscriminatorValueExpression();
            }
        }

        public bool IsUnknownDiscriminatorModel => _inputModel.IsUnknownDiscriminatorModel;

        public string? DiscriminatorValue => _inputModel.DiscriminatorValue;
        public ValueExpression? DiscriminatorValueExpression { get; init; }

        private IReadOnlyList<ModelProvider>? _derivedModels;
        public IReadOnlyList<ModelProvider> DerivedModels => _derivedModels ??= BuildDerivedModels();

        private IReadOnlyList<ModelProvider> BuildDerivedModels()
        {
            var derivedModels = new List<ModelProvider>(_inputModel.DiscriminatedSubtypes.Count);
            foreach (var subtype in _inputModel.DiscriminatedSubtypes)
            {
                var model = CodeModelPlugin.Instance.TypeFactory.CreateModel(subtype.Value);
                if (model != null)
                {
                    derivedModels.Add(model);
                }
            }

            return derivedModels;
        }

        private ModelProvider? BaseModelProvider
            => _baseModelProvider ??= (_baseTypeProvider?.Value is ModelProvider baseModelProvider ? baseModelProvider : null);
        private FieldProvider? RawDataField => _rawDataField ??= BuildRawDataField();
        private List<FieldProvider> AdditionalPropertyFields => _additionalPropertyFields ??= BuildAdditionalPropertyFields();
        private List<PropertyProvider> AdditionalPropertyProperties => _additionalPropertyProperties ??= BuildAdditionalPropertyProperties();
        internal bool SupportsBinaryDataAdditionalProperties => AdditionalPropertyProperties.Any(p => p.Type.ElementType.Equals(_additionalPropsUnknownType));
        public ConstructorProvider FullConstructor => _fullConstructor ??= BuildFullConstructor();

        protected override string GetNamespace() => CodeModelPlugin.Instance.Configuration.ModelNamespace;

        protected override CSharpType? GetBaseType()
        {
            return BaseModelProvider?.Type;
        }

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return [.. CodeModelPlugin.Instance.TypeFactory.CreateSerializations(_inputModel, this)];
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override string BuildName() => _inputModel.Name.ToCleanName();

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            var customCodeModifiers = CustomCodeView?.DeclarationModifiers ?? TypeSignatureModifiers.None;
            var isStruct = false;
            // the information of if this model should be a struct comes from two sources:
            // 1. the customied code
            // 2. the spec
            if (customCodeModifiers.HasFlag(TypeSignatureModifiers.Struct))
            {
                isStruct = true;
            }
            if (_inputModel.ModelAsStruct)
            {
                isStruct = true;
            }
            var declarationModifiers = TypeSignatureModifiers.Partial;

            if (isStruct)
            {
                declarationModifiers |= TypeSignatureModifiers.ReadOnly | TypeSignatureModifiers.Struct;
            }
            else
            {
                declarationModifiers |= TypeSignatureModifiers.Class;
            }

            if (customCodeModifiers != TypeSignatureModifiers.None)
            {
                declarationModifiers |= GetAccessibilityModifiers(customCodeModifiers);
            }
            else if (_inputModel.Access == "internal")
            {
                declarationModifiers |= TypeSignatureModifiers.Internal;
            }

            bool isAbstract = _inputModel.DiscriminatorProperty is not null && _inputModel.DiscriminatorValue is null;
            if (isAbstract)
            {
                declarationModifiers |= TypeSignatureModifiers.Abstract;
            }

            return declarationModifiers;

            static TypeSignatureModifiers GetAccessibilityModifiers(TypeSignatureModifiers modifiers)
            {
                return modifiers & (TypeSignatureModifiers.Public | TypeSignatureModifiers.Internal | TypeSignatureModifiers.Protected | TypeSignatureModifiers.Private);
            }
        }

        /// <summary>
        /// Builds the fields for the model by adding the raw data field.
        /// </summary>
        /// <returns>The list of <see cref="FieldProvider"/> for the model.</returns>
        protected override FieldProvider[] BuildFields()
        {
            List<FieldProvider> fields = [];
            if (RawDataField != null)
            {
                fields.Add(RawDataField);
            }

            // add fields for additional properties
            if (AdditionalPropertyFields.Count > 0)
            {
                fields.AddRange(AdditionalPropertyFields);
            }

            foreach (var property in _inputModel.Properties)
            {
                if (property.IsDiscriminator)
                    continue;

                var derivedProperty = InputDerivedProperties.FirstOrDefault(p => p.Value.ContainsKey(property.Name)).Value?[property.Name];
                if (derivedProperty is not null)
                {
                    if (!derivedProperty.Type.Equals(property.Type) || !DomainEqual(property, derivedProperty))
                    {
                        fields.Add(new FieldProvider(
                            FieldModifiers.Private | FieldModifiers.Protected,
                            CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(property.Type)!,
                            $"_{property.Name.ToVariableName()}",
                            this));
                    }
                }
            }
            return [.. fields];
        }

        private List<FieldProvider> BuildAdditionalPropertyFields()
        {
            var fields = new List<FieldProvider>();

            if (_inputModel.AdditionalProperties != null)
            {
                var valueType = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(_inputModel.AdditionalProperties);
                if (valueType != null)
                {
                    if (valueType.IsUnion)
                    {
                        foreach (var unionType in valueType.UnionItemTypes)
                        {
                            AddFieldForAdditionalProperties(unionType, fields);
                        }
                    }
                    else
                    {
                        AddFieldForAdditionalProperties(valueType, fields);
                    }
                }
            }

            return fields;
        }

        private void AddFieldForAdditionalProperties(CSharpType valueType, List<FieldProvider> fields)
        {
            var originalType = new CSharpType(typeof(IDictionary<,>), typeof(string), valueType);
            var additionalPropsType = ReplaceUnverifiableType(originalType);

            if (!additionalPropsType.Equals(_additionalBinaryDataPropsFieldType))
            {
                fields.Add(new FieldProvider(
                    FieldModifiers.Private,
                    additionalPropsType,
                    BuildAdditionalTypePropertiesFieldName(additionalPropsType.ElementType),
                    this));
            }
        }

        private List<PropertyProvider> BuildAdditionalPropertyProperties()
        {
            var additionalPropertiesFieldCount = AdditionalPropertyFields.Count;
            var properties = new List<PropertyProvider>(additionalPropertiesFieldCount + 1);
            bool containsAdditionalTypeProperties = false;

            for (int i = 0; i < additionalPropertiesFieldCount; i++)
            {
                var field = AdditionalPropertyFields[i];
                var propertyType = !_inputModel.Usage.HasFlag(InputModelTypeUsage.Input) ? field.Type.OutputType : field.Type;
                var assignment = propertyType.IsReadOnlyDictionary
                   ? new ExpressionPropertyBody(New.ReadOnlyDictionary(propertyType.Arguments[0], propertyType.ElementType, field))
                   : new ExpressionPropertyBody(field);

                properties.Add(new(
                    null,
                    MethodSignatureModifiers.Public,
                    propertyType,
                    i == 0 ? DefaultAdditionalPropertiesPropertyName : field.Name.ToCleanName(),
                    assignment,
                    this));
                containsAdditionalTypeProperties = true;
            }

            if (RawDataField == null || _inputModel.AdditionalProperties == null)
            {
                return properties;
            }

            var apValueType = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(_inputModel.AdditionalProperties);
            if (apValueType == null)
            {
                return properties;
            }

            // add public property for raw binary data if the model supports additional binary data properties
            var originalType = new CSharpType(typeof(IDictionary<,>), typeof(string), apValueType);
            var additionalPropsType = ReplaceUnverifiableType(originalType);
            var shouldAddPropForUnionType = additionalPropsType.ElementType.IsUnion
                && additionalPropsType.ElementType.UnionItemTypes.Any(t => !t.IsFrameworkType);

            if (shouldAddPropForUnionType || (!apValueType.IsUnion && additionalPropsType.Equals(_additionalBinaryDataPropsFieldType)))
            {
                var name = !containsAdditionalTypeProperties
                    ? DefaultAdditionalPropertiesPropertyName
                    : RawDataField.Name.ToCleanName();
                var type = !_inputModel.Usage.HasFlag(InputModelTypeUsage.Input)
                    ? additionalPropsType.OutputType
                    : additionalPropsType;
                var assignment = type.IsReadOnlyDictionary
                    ? new ExpressionPropertyBody(New.ReadOnlyDictionary(type.Arguments[0], type.ElementType, RawDataField))
                    : new ExpressionPropertyBody(RawDataField);

                properties.Add(new(
                    null,
                    MethodSignatureModifiers.Public,
                    type,
                    name,
                    assignment,
                    this));
            }

            return properties;
        }

        private Dictionary<InputModelType, Dictionary<string, InputModelProperty>>? _inputDerivedProperties;
        private Dictionary<InputModelType, Dictionary<string, InputModelProperty>> InputDerivedProperties => _inputDerivedProperties ??= BuildDerivedProperties();

        private Dictionary<InputModelType, Dictionary<string, InputModelProperty>> BuildDerivedProperties()
        {
            Dictionary<InputModelType, Dictionary<string, InputModelProperty>> derivedProperties = [];
            foreach (var derivedModel in _inputModel.DerivedModels)
            {
                var derivedModelProperties = derivedModel.Properties;
                if (derivedModelProperties.Count > 0)
                {
                    derivedProperties[derivedModel] = derivedModelProperties.ToDictionary(p => p.Name);
                }
            }
            return derivedProperties;
        }

        protected override PropertyProvider[] BuildProperties()
        {
            var propertiesCount = _inputModel.Properties.Count;
            var properties = new List<PropertyProvider>(propertiesCount + 1);

            Dictionary<string, InputModelProperty> baseProperties = _inputModel.BaseModel?.Properties.ToDictionary(p => p.Name) ?? [];

            var customPropertyNames = new HashSet<string>();
            foreach (var customProperty in CustomCodeView?.Properties ?? [])
            {
                customPropertyNames.Add(customProperty.Name);
                foreach (var attribute in customProperty.Attributes ?? [])
                {
                    if (CodeGenAttributes.TryGetCodeGenMemberAttributeValue(attribute, out var name))
                    {
                        customPropertyNames.Add(name);
                    }
                }
            }

            for (int i = 0; i < propertiesCount; i++)
            {
                var property = _inputModel.Properties[i];

                if (property.IsDiscriminator && Type.BaseType is not null)
                    continue;

                var outputProperty = CodeModelPlugin.Instance.TypeFactory.CreatePropertyProvider(property, this);
                if (outputProperty is null)
                    continue;

                if (customPropertyNames.Contains(property.Name))
                    continue;

                if (!property.IsDiscriminator)
                {
                    var derivedProperty = InputDerivedProperties.FirstOrDefault(p => p.Value.ContainsKey(property.Name)).Value?[property.Name];
                    if (derivedProperty is not null)
                    {
                        if (derivedProperty.Type.Equals(property.Type) && DomainEqual(property, derivedProperty))
                        {
                            outputProperty.Modifiers |= MethodSignatureModifiers.Virtual;
                        }
                    }
                    var baseProperty = baseProperties.GetValueOrDefault(property.Name);
                    if (baseProperty is not null)
                    {
                        if (baseProperty.Type.Equals(property.Type) && DomainEqual(baseProperty, property))
                        {
                            outputProperty.Modifiers |= MethodSignatureModifiers.Override;
                        }
                        else
                        {
                            outputProperty.Modifiers |= MethodSignatureModifiers.New;
                            var fieldName = $"_{baseProperty.Name.ToVariableName()}";
                            outputProperty.Body = new ExpressionPropertyBody(
                                This.Property(fieldName).NullCoalesce(Default),
                                outputProperty.Body.HasSetter ? This.Property(fieldName).Assign(Value) : null);
                        }
                    }
                }

                properties.Add(outputProperty);
            }

            if (AdditionalPropertyProperties.Count > 0)
            {
                properties.AddRange(AdditionalPropertyProperties);
            }

            return [.. properties];
        }

        private static bool DomainEqual(InputModelProperty baseProperty, InputModelProperty derivedProperty)
        {
            if (baseProperty.IsRequired != derivedProperty.IsRequired)
                return false;
            var baseNullable = baseProperty.Type is InputNullableType;
            return baseNullable ? derivedProperty.Type is InputNullableType : derivedProperty.Type is not InputNullableType;
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            if (_inputModel.IsUnknownDiscriminatorModel)
            {
                return [FullConstructor];
            }

            // Build the initialization constructor
            var accessibility = DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)
                ? MethodSignatureModifiers.Private | MethodSignatureModifiers.Protected
                : _inputModel.Usage.HasFlag(InputModelTypeUsage.Input)
                    ? MethodSignatureModifiers.Public
                    : MethodSignatureModifiers.Internal;
            var (constructorParameters, constructorInitializer) = BuildConstructorParameters(true);

            var constructor = new ConstructorProvider(
                signature: new ConstructorSignature(
                    Type,
                    $"Initializes a new instance of {Type:C}",
                    accessibility,
                    constructorParameters,
                    Initializer: constructorInitializer),
                bodyStatements: new MethodBodyStatement[]
                {
                    GetPropertyInitializers(true, parameters: constructorParameters)
                },
                this);

            if (!constructorParameters.SequenceEqual(FullConstructor.Signature.Parameters))
            {
                return [constructor, FullConstructor];
            }

            return [constructor];
        }

        /// <summary>
        /// Builds the internal constructor for the model which contains all public properties
        /// as parameters.
        /// </summary>
        private ConstructorProvider BuildFullConstructor()
        {
            var (ctorParameters, ctorInitializer) = BuildConstructorParameters(false);

            return new ConstructorProvider(
                signature: new ConstructorSignature(
                    Type,
                    $"Initializes a new instance of {Type:C}",
                    MethodSignatureModifiers.Internal,
                    ctorParameters,
                    Initializer: ctorInitializer),
                bodyStatements: new MethodBodyStatement[]
                {
                    GetPropertyInitializers(false)
                },
                this);
        }

        private (IReadOnlyList<ParameterProvider> Parameters, ConstructorInitializer? Initializer) BuildConstructorParameters(
            bool isPrimaryConstructor)
        {
            var baseParameters = new List<ParameterProvider>();
            var constructorParameters = new List<ParameterProvider>();
            IEnumerable<PropertyProvider> baseProperties = [];

            if (isPrimaryConstructor)
            {
                baseProperties = _inputModel.GetAllBaseModels()
                    .Reverse()
                    .SelectMany(model => CodeModelPlugin.Instance.TypeFactory.CreateModel(model)?.Properties ?? []);
            }
            else if (BaseModelProvider?.FullConstructor.Signature != null)
            {
                baseParameters.AddRange(BaseModelProvider.FullConstructor.Signature.Parameters);
            }

            // add the base parameters, if any
            foreach (var property in baseProperties)
            {
                AddInitializationParameterForCtor(baseParameters, property, Type.IsStruct, isPrimaryConstructor);
            }

            // construct the initializer using the parameters from base signature
            var constructorInitializer = new ConstructorInitializer(true, [.. baseParameters.Select(GetExpression)]);

            foreach (var property in Properties)
            {
                AddInitializationParameterForCtor(constructorParameters, property, Type.IsStruct, isPrimaryConstructor);
            }

            constructorParameters.AddRange(_inputModel.IsUnknownDiscriminatorModel ? baseParameters : baseParameters.Where(p => p.Property is null || !p.Property.IsDiscriminator));

            if (!isPrimaryConstructor)
            {
                foreach (var property in AdditionalPropertyProperties)
                {
                    constructorParameters.Add(property.AsParameter);
                }

                // only add the raw data field if it has not already been added as a parameter for BinaryData additional properties
                if (RawDataField != null && !SupportsBinaryDataAdditionalProperties)
                    constructorParameters.Add(RawDataField.AsParameter);
            }

            return (constructorParameters, constructorInitializer);
        }

        private ValueExpression? EnsureDiscriminatorValueExpression()
        {
            if (_inputModel.BaseModel is not null && _inputModel.DiscriminatorValue is not null)
            {
                var discriminator = BaseModelProvider?.Properties.Where(p => p.IsDiscriminator).FirstOrDefault();
                if (discriminator != null)
                {
                    var type = discriminator.Type;
                    if (IsUnknownDiscriminatorModel)
                    {
                        var discriminatorExpression = discriminator.AsParameter.AsExpression;
                        if (!type.IsFrameworkType && type.IsEnum)
                        {
                            if (type.IsStruct)
                            {
                                /* kind != default ? kind : "unknown" */
                                return new TernaryConditionalExpression(discriminatorExpression.NotEqual(Default), discriminatorExpression, Literal(_inputModel.DiscriminatorValue));
                            }
                            else
                            {
                                return discriminatorExpression;
                            }
                        }
                        else
                        {
                            /* kind ?? "unknown" */
                            return discriminatorExpression.NullCoalesce(Literal(_inputModel.DiscriminatorValue));
                        }
                    }
                    else
                    {
                        if (!type.IsFrameworkType && type.IsEnum)
                        {
                            /* TODO: when customize the discriminator type to a enum, then we may not be able to get the correct TypeProvider in this way.
                             * We will handle this when issue https://github.com/microsoft/typespec/issues/4313 is resolved.
                             * */
                            var discriminatorProvider = CodeModelPlugin.Instance.TypeFactory.CreateEnum(enumType: (InputEnumType)_inputModel.BaseModel.DiscriminatorProperty!.Type);
                            var enumMember = discriminatorProvider!.EnumValues.FirstOrDefault(e => e.Value.ToString() == _inputModel.DiscriminatorValue) ?? throw new InvalidOperationException($"invalid discriminator value {_inputModel.DiscriminatorValue}");
                            /* {KindType}.{enumMember} */
                            return TypeReferenceExpression.FromType(type).Property(enumMember.Name);
                        }
                        else
                        {
                            return Literal(_inputModel.DiscriminatorValue);
                        }
                    }
                }
            }
            return null;
        }
        private ValueExpression GetExpression(ParameterProvider parameter)
        {
            if (parameter.Property is not null && parameter.Property.IsDiscriminator && _inputModel.DiscriminatorValue != null)
            {
                return DiscriminatorValueExpression ?? throw new InvalidOperationException($"invalid discriminator {_inputModel.DiscriminatorValue}");
            }

            return parameter.AsExpression;
        }

        private static void AddInitializationParameterForCtor(
            List<ParameterProvider> parameters,
            PropertyProvider property,
            bool isStruct,
            bool isPrimaryConstructor)
        {
            // We only add those properties with wire info indicating they are coming from specs.
            if (property.WireInfo is not { } wireInfo)
            {
                return;
            }

            if (isPrimaryConstructor)
            {
                if (isStruct || (wireInfo.IsRequired && !property.Type.IsLiteral))
                {
                    if (!wireInfo.IsReadOnly)
                    {
                        parameters.Add(property.AsParameter.ToPublicInputParameter());
                    }
                }
            }
            else
            {
                // For the serialization constructor, we always add the property as a parameter
                parameters.Add(property.AsParameter);
            }
        }

        private MethodBodyStatement GetPropertyInitializers(
            bool isPrimaryConstructor,
            IReadOnlyList<ParameterProvider>? parameters = null)
        {
            List<MethodBodyStatement> methodBodyStatements = new(Properties.Count + 1);
            Dictionary<string, ParameterProvider> parameterMap = parameters?.ToDictionary(p => p.Name) ?? [];

            foreach (var property in Properties)
            {
                // skip those non-spec properties
                if (property.WireInfo == null)
                {
                    continue;
                }

                if (!isPrimaryConstructor)
                {
                    // always add the property for the serialization constructor
                    methodBodyStatements.Add(property.Assign(property.AsParameter).Terminate());
                    continue;
                }

                ValueExpression? initializationValue = null;

                if (parameterMap.TryGetValue(property.AsParameter.Name, out var parameter) || Type.IsStruct)
                {
                    if (parameter != null)
                    {
                        initializationValue = parameter;

                        if (CSharpType.RequiresToList(parameter.Type, property.Type))
                        {
                            initializationValue = parameter.Type.IsNullable ?
                                initializationValue.NullConditional().ToList() :
                                initializationValue.ToList();
                        }
                    }
                }
                else if (initializationValue == null && property.Type.IsCollection)
                {
                    initializationValue = New.Instance(property.Type.PropertyInitializationType);
                }

                if (initializationValue != null)
                {
                    methodBodyStatements.Add(property.Assign(initializationValue).Terminate());
                }
            }

            // handle additional properties
            foreach (var property in AdditionalPropertyProperties)
            {
                // find the corresponding backing field for the property
                var backingField = AdditionalPropertyFields.FirstOrDefault(f => f.Type.ElementType.Equals(property.Type.ElementType))
                       ?? (RawDataField != null && property.Type.ElementType.Equals(RawDataField.Type.ElementType) ? RawDataField : null);

                if (backingField != null)
                {
                    var assignment = isPrimaryConstructor
                       ? backingField.Assign(New.Instance(backingField.Type.PropertyInitializationType))
                       : backingField.Assign(property.AsParameter);

                    methodBodyStatements.Add(assignment.Terminate());
                }
            }

            if (RawDataField != null)
            {
                // initialize the raw data field in the serialization constructor if the model does not explicitly support AP of binary data.
                if (!isPrimaryConstructor && !SupportsBinaryDataAdditionalProperties)
                {
                    methodBodyStatements.Add(RawDataField.Assign(RawDataField.AsParameter).Terminate());
                }
            }

            return methodBodyStatements;
        }

        /// <summary>
        /// Builds the raw data field for the model to be used for serialization.
        /// </summary>
        /// <returns>The constructed <see cref="FieldProvider"/> if the model should generate the field.</returns>
        private FieldProvider? BuildRawDataField()
        {
            // check if there is a raw data field on my base, if so, we do not have to have one here
            if (BaseModelProvider?.RawDataField != null)
            {
                return null;
            }

            var modifiers = FieldModifiers.Private;
            if (!DeclarationModifiers.HasFlag(TypeSignatureModifiers.Sealed))
            {
                modifiers |= FieldModifiers.Protected;
            }

            var rawDataField = new FieldProvider(
                modifiers: modifiers,
                type: _additionalBinaryDataPropsFieldType,
                description: FormattableStringHelpers.FromString(AdditionalBinaryDataPropsFieldDescription),
                name: AdditionalBinaryDataPropsFieldName,
                enclosingType: this);

            return rawDataField;
        }

        /// <summary>
        /// Replaces unverifiable types, types that do not have value kind checks during deserialization of additional properties,
        /// with the corresponding verifiable types. By default, BinaryData is used as the value type for unknown additional properties.
        /// </summary>
        /// <param name="type"></param>
        /// <returns></returns>
        private CSharpType ReplaceUnverifiableType(CSharpType type)
        {
            return type switch
            {
                _ when type.Equals(_additionalPropsUnknownType, ignoreNullable: true) => type,
                _ when type.IsFrameworkType && _verifiableAdditionalPropertyTypes.Contains(type.FrameworkType) => type,
                _ when type.IsUnion => type,
                _ when type.IsList => type.MakeGenericType([ReplaceUnverifiableType(type.Arguments[0])]),
                _ when type.IsDictionary => type.MakeGenericType([ReplaceUnverifiableType(type.Arguments[0]), ReplaceUnverifiableType(type.Arguments[1])]),
                _ => CSharpType.FromUnion([type])
            };
        }

        private static string BuildAdditionalTypePropertiesFieldName(CSharpType additionalPropertiesValueType)
        {
            var name = additionalPropertiesValueType.Name;

            while (additionalPropertiesValueType.IsCollection)
            {
                additionalPropertiesValueType = additionalPropertiesValueType.ElementType;
                name += additionalPropertiesValueType.Name;
            }

            return $"_additional{name.ToCleanName()}Properties";
        }

        /// <summary>
        /// The set of known verifiable additional property value types that have value kind checks during deserialization.
        /// </summary>
        private static readonly HashSet<Type> _verifiableAdditionalPropertyTypes =
        [
            typeof(byte), typeof(byte[]), typeof(sbyte),
            typeof(DateTime), typeof(DateTimeOffset),
            typeof(decimal), typeof(double), typeof(short), typeof(int), typeof(long), typeof(float),
            typeof(ushort), typeof(uint), typeof(ulong),
            typeof(Guid),
            typeof(string), typeof(bool)
        ];
    }
}
