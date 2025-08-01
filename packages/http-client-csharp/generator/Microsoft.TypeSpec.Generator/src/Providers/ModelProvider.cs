// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public class ModelProvider : TypeProvider
    {
        private const string AdditionalBinaryDataPropsFieldDescription = "Keeps track of any properties unknown to the library.";
        private readonly InputModelType _inputModel;

        // Note the description cannot be built from the constructor as it would lead to a circular dependency between the base
        // and derived models resulting in a stack overflow.
        protected override FormattableString BuildDescription()
        {
            var description = DocHelpers.GetFormattableDescription(_inputModel.Summary, _inputModel.Doc) ??
                              $"The {Name}.";
            if (_isAbstract)
            {
                _derivedModels = BuildDerivedModels();
                var publicDerivedModels = _derivedModels.Where(m => m.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public)).ToList();
                var derivedClassesDescription =
                    "Please note this is the abstract base class. The derived classes available for instantiation are: ";
                bool addComma = publicDerivedModels.Count > 2;
                for (int i = 0; i < publicDerivedModels.Count; i++)
                {
                    if (i == publicDerivedModels.Count - 1)
                    {
                        derivedClassesDescription += $"{(i > 0 ? "and " : "")}<see cref=\"{publicDerivedModels[i].Name}\"/>.";
                    }
                    else
                    {
                        derivedClassesDescription += $"<see cref=\"{publicDerivedModels[i].Name}\"/>{(addComma ? ", ": " ")}";
                    }
                }

                description = $"{description}\n{derivedClassesDescription}";
            }

            return description;
        }

        private readonly bool _isAbstract;

        private readonly CSharpType _additionalBinaryDataPropsFieldType = typeof(IDictionary<string, BinaryData>);
        private readonly Type _additionalPropsUnknownType = typeof(BinaryData);
        private readonly Lazy<TypeProvider?>? _baseTypeProvider;
        private FieldProvider? _rawDataField;
        private List<FieldProvider>? _additionalPropertyFields;
        private List<PropertyProvider>? _additionalPropertyProperties;
        private ModelProvider? _baseModelProvider;
        private ConstructorProvider? _fullConstructor;

        public ModelProvider(InputModelType inputModel) : base(inputModel)
        {
            _inputModel = inputModel;
            _isAbstract = _inputModel.DiscriminatorProperty is not null && _inputModel.DiscriminatorValue is null;

            if (inputModel.BaseModel is not null)
            {
                _baseTypeProvider = new(() => CodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel.BaseModel));
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
            var derivedModels = new HashSet<ModelProvider>(_inputModel.DiscriminatedSubtypes.Count + _inputModel.DerivedModels.Count);
            // add discriminated subtypes
            foreach (var subtype in _inputModel.DiscriminatedSubtypes)
            {
                var model = CodeModelGenerator.Instance.TypeFactory.CreateModel(subtype.Value);
                if (model != null)
                {
                    derivedModels.Add(model);
                }
            }

            // add derived models
            foreach (var derivedModel in _inputModel.DerivedModels)
            {
                var model = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedModel);
                if (model != null)
                {
                    derivedModels.Add(model);
                }
            }

            return [.. derivedModels];
        }
        internal override TypeProvider? BaseTypeProvider => BaseModelProvider;

        public ModelProvider? BaseModelProvider
            => _baseModelProvider ??= (_baseTypeProvider?.Value is ModelProvider baseModelProvider ? baseModelProvider : null);
        private FieldProvider? RawDataField => _rawDataField ??= BuildRawDataField();
        private List<FieldProvider> AdditionalPropertyFields => _additionalPropertyFields ??= BuildAdditionalPropertyFields();
        private List<PropertyProvider> AdditionalPropertyProperties => _additionalPropertyProperties ??= BuildAdditionalPropertyProperties();
        internal bool SupportsBinaryDataAdditionalProperties => AdditionalPropertyProperties.Any(p => p.Type.ElementType.Equals(_additionalPropsUnknownType));
        public ConstructorProvider FullConstructor => _fullConstructor ??= BuildFullConstructor();

        protected override string BuildNamespace() => string.IsNullOrEmpty(_inputModel.Namespace) ?
            // TODO remove null check once https://github.com/Azure/typespec-azure/issues/2209 is fixed.
            CodeModelGenerator.Instance.TypeFactory.PrimaryNamespace :
            CodeModelGenerator.Instance.TypeFactory.GetCleanNameSpace(_inputModel.Namespace);

        protected override CSharpType? BuildBaseType()
        {
            return BaseModelProvider?.Type;
        }

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return [.. CodeModelGenerator.Instance.TypeFactory.CreateSerializations(_inputModel, this)];
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override string BuildName() => _inputModel.Name.ToIdentifierName();

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
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

            if (_isAbstract)
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
                if (IsDiscriminator(property))
                    continue;

                var derivedProperty = InputDerivedProperties.FirstOrDefault(p => p.Value.ContainsKey(property.Name)).Value?[property.Name];
                if (derivedProperty is not null)
                {
                    if (!DomainEqual(property, derivedProperty))
                    {
                        fields.Add(new FieldProvider(
                            FieldModifiers.Private | FieldModifiers.Protected,
                            CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(property.Type)!,
                            $"_{property.Name.ToVariableName()}",
                            this));
                    }
                }
            }
            return [.. fields];
        }

        private static bool IsDiscriminator(InputProperty property)
        {
            return property is InputModelProperty modelProperty && modelProperty.IsDiscriminator;
        }

        private List<FieldProvider> BuildAdditionalPropertyFields()
        {
            var fields = new List<FieldProvider>();

            if (_inputModel.AdditionalProperties != null)
            {
                var valueType = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(_inputModel.AdditionalProperties);
                if (valueType != null)
                {
                    if (valueType.IsUnion)
                    {
                        foreach (var unionType in valueType.UnionItemTypes)
                        {
                            AddFieldForAdditionalProperties(unionType, fields, true);
                        }
                    }
                    else
                    {
                        AddFieldForAdditionalProperties(valueType, fields, false);
                    }
                }
            }

            return fields;
        }

        private void AddFieldForAdditionalProperties(CSharpType valueType, List<FieldProvider> fields, bool isUnionType)
        {
            var originalType = new CSharpType(typeof(IDictionary<,>), typeof(string), valueType);
            var additionalPropsType = ReplaceUnverifiableType(originalType);

            if ((isUnionType && additionalPropsType.ContainsBinaryData)
                || additionalPropsType.Equals(_additionalBinaryDataPropsFieldType))
            {
                return;
            }

            fields.Add(new(
                FieldModifiers.Private,
                additionalPropsType,
                BuildAdditionalTypePropertiesFieldName(additionalPropsType.ElementType),
                this));
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
                    i == 0 ? AdditionalPropertiesHelper.DefaultAdditionalPropertiesPropertyName : field.Name.ToIdentifierName(),
                    assignment,
                    this)
                {
                    BackingField = field,
                    IsAdditionalProperties = true
                });
                containsAdditionalTypeProperties = true;
            }

            if (RawDataField == null || _inputModel.AdditionalProperties == null)
            {
                return properties;
            }

            var apValueType = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(_inputModel.AdditionalProperties);
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
                    ? AdditionalPropertiesHelper.DefaultAdditionalPropertiesPropertyName
                    : RawDataField.Name.ToIdentifierName();
                var type = !_inputModel.Usage.HasFlag(InputModelTypeUsage.Input)
                    ? additionalPropsType.OutputType
                    : additionalPropsType;
                var assignment = type.IsReadOnlyDictionary
                    ? new ExpressionPropertyBody(New.ReadOnlyDictionary(type.Arguments[0], type.ElementType, RawDataField))
                    : new ExpressionPropertyBody(RawDataField);
                var property = new PropertyProvider(
                    null,
                    MethodSignatureModifiers.Public,
                    type,
                    name,
                    assignment,
                    this)
                {
                    BackingField = RawDataField,
                    IsAdditionalProperties = true
                };
                properties.Add(property);
            }

            return properties;
        }

        private Dictionary<InputModelType, Dictionary<string, InputModelProperty>>? _inputDerivedProperties;
        private Dictionary<InputModelType, Dictionary<string, InputModelProperty>> InputDerivedProperties => _inputDerivedProperties ??= BuildDerivedProperties();

        private Dictionary<InputModelType, Dictionary<string, InputModelProperty>> BuildDerivedProperties()
        {
            Dictionary<InputModelType, Dictionary<string, InputModelProperty>> derivedProperties = [];
            var derivedModels = new List<InputModelType>();
            EnumerateDerivedModels(_inputModel, derivedModels);
            foreach (var derivedModel in derivedModels)
            {
                var derivedModelProperties = derivedModel.Properties;
                if (derivedModelProperties.Count > 0)
                {
                    derivedProperties[derivedModel] = derivedModelProperties.ToDictionary(p => p.Name);
                }
            }
            return derivedProperties;
        }

        private void EnumerateDerivedModels(InputModelType inputModel, List<InputModelType> derivedModels)
        {
            foreach (var derivedModel in inputModel.DerivedModels)
            {
                derivedModels.Add(derivedModel);
                EnumerateDerivedModels(derivedModel, derivedModels);
            }
        }

        protected override PropertyProvider[] BuildProperties()
        {
            var propertiesCount = _inputModel.Properties.Count;
            var properties = new List<PropertyProvider>(propertiesCount + 1);
            Dictionary<string, InputModelProperty> baseProperties = EnumerateBaseModels().SelectMany(m => m.Properties).GroupBy(x => x.Name).Select(g => g.First()).ToDictionary(p => p.Name) ?? [];
            var baseModelDiscriminator = _inputModel.BaseModel?.DiscriminatorProperty;
            for (int i = 0; i < propertiesCount; i++)
            {
                var property = _inputModel.Properties[i];
                var isDiscriminator = IsDiscriminator(property);

                if (isDiscriminator && property.Name == baseModelDiscriminator?.Name)
                    continue;

                var outputProperty = CodeModelGenerator.Instance.TypeFactory.CreateProperty(property, this);
                if (outputProperty is null)
                    continue;

                if (!isDiscriminator)
                {
                    var derivedProperty = InputDerivedProperties.FirstOrDefault(p => p.Value.ContainsKey(property.Name)).Value?[property.Name];
                    if (derivedProperty is not null)
                    {
                        if (DomainEqual(property, derivedProperty))
                        {
                            outputProperty.Modifiers |= MethodSignatureModifiers.Virtual;
                        }
                    }
                    var baseProperty = baseProperties.GetValueOrDefault(property.Name);
                    if (baseProperty is not null)
                    {
                        if (DomainEqual(baseProperty, property))
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
                            outputProperty.BackingField = BaseModelProvider?.Fields.FirstOrDefault(f => f.Name == fieldName);
                        }
                        outputProperty.BaseProperty = CodeModelGenerator.Instance.TypeFactory.CreateProperty(baseProperty, BaseModelProvider!);
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

        private IEnumerable<InputModelType> EnumerateBaseModels()
        {
            var model = _inputModel;
            while (model.BaseModel != null)
            {
                yield return model.BaseModel;
                model = model.BaseModel;
            }
        }

        private static bool DomainEqual(InputProperty baseProperty, InputProperty derivedProperty)
        {
            if (baseProperty.Type.Name != derivedProperty.Type.Name)
                return false;
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

        private IEnumerable<PropertyProvider> GetAllBasePropertiesForConstructorInitialization()
        {
            var properties = new Stack<List<PropertyProvider>>();
            var modelProvider = BaseModelProvider;
            bool isDirectBase = true;
            while (modelProvider != null)
            {
                properties.Push([]);
                foreach (var property in modelProvider.CanonicalView.Properties)
                {
                    if (property.IsDiscriminator)
                    {
                        // In the case of nested discriminators, we only need to include the direct base discriminator property,
                        // as this is the only one that will be initialized in this model's constructor.
                        if (isDirectBase)
                        {
                            properties.Peek().Add(property);
                        }
                    }
                    else
                    {
                        properties.Peek().Add(property);
                    }
                }

                modelProvider = modelProvider.BaseModelProvider;
                isDirectBase = false;
            }

            // parameters need to be ordered from the base-most class to the derived class
            return properties.SelectMany(l => l);
        }

        private IEnumerable<FieldProvider> GetAllBaseFieldsForConstructorInitialization()
        {
            var fields = new Stack<List<FieldProvider>>();
            var modelProvider = BaseModelProvider;
            while (modelProvider != null)
            {
                fields.Push([]);
                foreach (var field in modelProvider.CanonicalView.Fields)
                {
                    fields.Peek().Add(field);
                }
                modelProvider = modelProvider.BaseModelProvider;
            }

            return fields.SelectMany(l => l);
        }

        private (IReadOnlyList<ParameterProvider> Parameters, ConstructorInitializer? Initializer) BuildConstructorParameters(
            bool isPrimaryConstructor)
        {
            var baseParameters = new List<ParameterProvider>();
            var constructorParameters = new List<ParameterProvider>();
            IEnumerable<PropertyProvider> baseProperties = [];
            IEnumerable<FieldProvider> baseFields = [];

            if (isPrimaryConstructor)
            {
                baseProperties = GetAllBasePropertiesForConstructorInitialization();
                baseFields = GetAllBaseFieldsForConstructorInitialization();
            }
            else if (BaseModelProvider?.FullConstructor.Signature != null)
            {
                baseParameters.AddRange(BaseModelProvider.FullConstructor.Signature.Parameters);
            }

            HashSet<PropertyProvider> overriddenProperties = CanonicalView.Properties.Where(p => p.BaseProperty is not null).Select(p => p.BaseProperty!).ToHashSet();

            // add the base parameters, if any
            foreach (var property in baseProperties)
            {
                AddInitializationParameterForCtor(baseParameters, Type.IsStruct, isPrimaryConstructor, property);
            }

            // add the base fields, if any
            foreach (var field in baseFields)
            {
                AddInitializationParameterForCtor(baseParameters, Type.IsStruct, isPrimaryConstructor, field: field);
            }

            // construct the initializer using the parameters from base signature
            var constructorInitializer = new ConstructorInitializer(true, [.. baseParameters.Select(p => GetExpressionForCtor(p, overriddenProperties, isPrimaryConstructor))]);

            foreach (var property in CanonicalView.Properties)
            {
                AddInitializationParameterForCtor(constructorParameters, Type.IsStruct, isPrimaryConstructor, property);
            }

            foreach (var field in CanonicalView.Fields)
            {
                AddInitializationParameterForCtor(constructorParameters, Type.IsStruct, isPrimaryConstructor, field: field);
            }

            constructorParameters.InsertRange(0, _inputModel.IsUnknownDiscriminatorModel
                ? baseParameters
                : baseParameters.Where(p =>
                    p.Property is null
                    || (p.Property.IsDiscriminator && !overriddenProperties.Contains(p.Property) && !isPrimaryConstructor)
                    || (!p.Property.IsDiscriminator && !overriddenProperties.Contains(p.Property))));

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
                var discriminator = BaseModelProvider?.CanonicalView.Properties.Where(p => p.IsDiscriminator).FirstOrDefault();
                if (discriminator != null)
                {
                    var type = discriminator.Type;
                    if (IsUnknownDiscriminatorModel)
                    {
                        return GetUnknownDiscriminatorExpression(discriminator);
                    }

                    if (type is { IsFrameworkType: false, IsEnum: true })
                    {
                        if (_inputModel.BaseModel.DiscriminatorProperty!.Type is InputEnumType inputEnumType)
                        {
                            var discriminatorProvider = CodeModelGenerator.Instance.TypeFactory.CreateEnum(enumType: inputEnumType);

                            var enumMember = discriminatorProvider!.EnumValues.FirstOrDefault(e => e.Value.ToString() == _inputModel.DiscriminatorValue)
                                             ?? throw new InvalidOperationException($"invalid discriminator value {_inputModel.DiscriminatorValue}");
                            var enumMemberName = enumMember.Name;

                            // Check to see if the enum member for this discriminator value has been customized
                            var customEnumProperty = discriminatorProvider.CustomCodeView?.Properties
                                .FirstOrDefault(f => f.OriginalName?.Equals(enumMemberName, StringComparison.OrdinalIgnoreCase) == true);
                            if (customEnumProperty != null)
                            {
                                enumMemberName = customEnumProperty.Name;
                            }
                            /* {KindType}.{enumMember} */
                            return Static(type).Property(enumMemberName);
                        }

                        // Handle custom fixed enum discriminator
                        if (discriminator.CustomProvider?.Value?.IsEnum == true)
                        {
                            var enumMember = discriminator.CustomProvider.Value.Fields
                                .FirstOrDefault(f => f.Name.Equals(_inputModel.DiscriminatorValue, StringComparison.OrdinalIgnoreCase));
                            if (enumMember != null)
                            {
                                return Static(type).Property(enumMember.Name);
                            }
                        }
                    }

                    // fallback to the default value
                    return Literal(_inputModel.DiscriminatorValue);
                }
            }
            return null;
        }

        private ValueExpression GetExpressionForCtor(ParameterProvider parameter, HashSet<PropertyProvider> overriddenProperties, bool isPrimaryConstructor)
        {
            if (parameter.Property is not null && parameter.Property.IsDiscriminator && _inputModel.DiscriminatorValue != null)
            {
                if (isPrimaryConstructor)
                {
                    return DiscriminatorValueExpression ?? throw new InvalidOperationException($"invalid discriminator {_inputModel.DiscriminatorValue} for property {parameter.Property.Name}");
                }
                else if (IsUnknownDiscriminatorModel)
                {
                    return GetUnknownDiscriminatorExpression(parameter.Property) ?? throw new InvalidOperationException($"invalid discriminator {_inputModel.DiscriminatorValue} for property {parameter.Property.Name}");
                }
            }

            var paramToUse = parameter.Property is not null && overriddenProperties.Contains(parameter.Property) ? Properties.First(p => p.Name == parameter.Property.Name).AsParameter : parameter;

            return paramToUse.Property is not null ? GetConversion(paramToUse.Property) : paramToUse;
        }

        private ValueExpression? GetUnknownDiscriminatorExpression(PropertyProvider property)
        {
            if (!property.IsDiscriminator || _inputModel.DiscriminatorValue == null)
            {
                return null;
            }

            var discriminatorExpression = property.AsParameter;
            var type = property.Type;

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

        private static void AddInitializationParameterForCtor(
            List<ParameterProvider> parameters,
            bool isStruct,
            bool isPrimaryConstructor,
            PropertyProvider? property = default,
            FieldProvider? field = default)
        {
            var wireInfo = property?.WireInfo ?? field?.WireInfo;
            var type = property?.Type ?? field?.Type;

            // We only add those properties with wire info indicating they are coming from specs.
            if (wireInfo == null)
            {
                return;
            }

            var parameter = property?.AsParameter ?? field!.AsParameter;
            if (isPrimaryConstructor)
            {
                if (isStruct || (wireInfo.IsRequired && !type!.IsLiteral))
                {
                    if (!wireInfo.IsReadOnly)
                    {
                        parameters.Add(parameter.ToPublicInputParameter());
                    }
                }
            }
            else
            {
                // For the serialization constructor, we always add the property as a parameter
                parameters.Add(parameter);
            }
        }

        private MethodBodyStatement GetPropertyInitializers(
            bool isPrimaryConstructor,
            IReadOnlyList<ParameterProvider>? parameters = null)
        {
            List<MethodBodyStatement> methodBodyStatements = new(CanonicalView.Properties.Count + CanonicalView.Fields.Count + 1);
            Dictionary<string, ParameterProvider> parameterMap = parameters?.ToDictionary(p => p.Name) ?? [];

            foreach (var property in CanonicalView.Properties)
            {
                CreatePropertyAssignmentStatement(isPrimaryConstructor, methodBodyStatements, parameterMap, property);
            }

            foreach (var field in CanonicalView.Fields)
            {
                CreatePropertyAssignmentStatement(isPrimaryConstructor, methodBodyStatements, parameterMap, field: field);
            }

            // handle additional properties
            foreach (var property in AdditionalPropertyProperties)
            {
                var backingField = property.BackingField;
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

        private void CreatePropertyAssignmentStatement(
            bool isPrimaryConstructor,
            List<MethodBodyStatement> methodBodyStatements,
            Dictionary<string, ParameterProvider> parameterMap,
            PropertyProvider? property = default,
            FieldProvider? field = default)
        {
            var wireInfo = property?.WireInfo ?? field?.WireInfo;
            // skip those non-spec properties
            if (wireInfo == null)
                return;

            // skip if this is an overload / new of a base property
            // also skip if the base was required or the derived property is not required
            if (property?.BaseProperty is not null && (!isPrimaryConstructor || wireInfo.IsRequired == false || property.BaseProperty.WireInfo?.IsRequired == true))
                return;

            ValueExpression assignee = property != null
                ? property.BackingField is null ? property : property.BackingField
                : field!;

            if (!isPrimaryConstructor)
            {
                // always add the property for the serialization constructor
                methodBodyStatements.Add(assignee.Assign(GetConversion(property, field)).Terminate());
                return;
            }

            ValueExpression? initializationValue = null;

            var type = property?.Type ?? field!.Type;

            if (parameterMap.TryGetValue(property?.AsParameter.Name ?? field!.AsParameter.Name, out var parameter) || Type.IsStruct)
            {
                if (parameter != null)
                {
                    initializationValue = parameter;

                    if (CSharpType.RequiresToList(parameter.Type, type))
                    {
                        initializationValue = parameter.Type.IsNullable ?
                            initializationValue.NullConditional().ToList() :
                            initializationValue.ToList();
                    }
                }
            }
            else if (initializationValue == null && type.IsCollection)
            {
                initializationValue = New.Instance(type.PropertyInitializationType);
            }

            if (initializationValue != null)
            {
                methodBodyStatements.Add(assignee.Assign(initializationValue).Terminate());
            }
        }

        private ValueExpression GetConversion(PropertyProvider? property = default, FieldProvider? field = default)
        {
            CSharpType to = property != null
                ? property.BackingField is null ? property.Type : property.BackingField.Type
                : field!.Type;
            CSharpType from = property?.Type ?? field!.Type;

            if (from.IsEnum && to.Equals(from.UnderlyingEnumType))
            {
                return from.ToSerial(property?.AsParameter ?? field!.AsParameter);
            }

            return property?.AsParameter ?? field!.AsParameter;
        }

        /// <summary>
        /// Builds the raw data field for the model to be used for serialization.
        /// </summary>
        /// <returns>The constructed <see cref="FieldProvider"/> if the model should generate the field.</returns>
        private FieldProvider? BuildRawDataField()
        {
            // check if there is a raw data field on any of the base models, if so, we do not have to have one here.
            var baseModelProvider = BaseModelProvider;
            while (baseModelProvider != null)
            {
                if (baseModelProvider.RawDataField != null)
                {
                    return null;
                }
                baseModelProvider = baseModelProvider.BaseModelProvider;
            }

            var modifiers = FieldModifiers.Private;
            if (!DeclarationModifiers.HasFlag(TypeSignatureModifiers.Sealed) && !DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct))
            {
                modifiers |= FieldModifiers.Protected;
            }
            modifiers |= FieldModifiers.ReadOnly;

            var rawDataField = new FieldProvider(
                modifiers: modifiers,
                type: _additionalBinaryDataPropsFieldType,
                description: FormattableStringHelpers.FromString(AdditionalBinaryDataPropsFieldDescription),
                name: AdditionalPropertiesHelper.AdditionalBinaryDataPropsFieldName,
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
                _ when type.IsFrameworkType && AdditionalPropertiesHelper.VerifiableAdditionalPropertyTypes.Contains(type.FrameworkType) => type,
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

            return $"_additional{name.ToIdentifierName()}Properties";
        }
    }
}
