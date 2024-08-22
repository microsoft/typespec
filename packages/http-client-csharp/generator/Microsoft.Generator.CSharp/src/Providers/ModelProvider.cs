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
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    public sealed class ModelProvider : TypeProvider
    {
        private const string PrivateAdditionalPropertiesPropertyDescription = "Keeps track of any properties unknown to the library.";
        private const string PrivateAdditionalPropertiesPropertyName = "_serializedAdditionalRawData";
        private readonly InputModelType _inputModel;

        protected override FormattableString Description { get; }

        private readonly bool _isStruct;
        private readonly TypeSignatureModifiers _declarationModifiers;
        private readonly CSharpType _privateAdditionalRawDataPropertyType = typeof(IDictionary<string, BinaryData>);
        private readonly Lazy<TypeProvider?>? _baseTypeProvider;
        private FieldProvider? _rawDataField;
        private ModelProvider? _baseModelProvider;
        private ConstructorProvider? _fullConstructor;

        public ModelProvider(InputModelType inputModel)
        {
            _inputModel = inputModel;
            Description = inputModel.Description != null ? FormattableStringHelpers.FromString(inputModel.Description) : $"The {Name}.";
            _declarationModifiers = TypeSignatureModifiers.Partial |
                (inputModel.ModelAsStruct ? TypeSignatureModifiers.ReadOnly | TypeSignatureModifiers.Struct : TypeSignatureModifiers.Class);

            if (inputModel.Access == "internal")
            {
                _declarationModifiers |= TypeSignatureModifiers.Internal;
            }

            bool isAbstract = inputModel.DiscriminatorProperty is not null && inputModel.DiscriminatorValue is null;
            if (isAbstract)
            {
                _declarationModifiers |= TypeSignatureModifiers.Abstract;
            }

            if (inputModel.BaseModel is not null)
            {
                _baseTypeProvider = new(() => CodeModelPlugin.Instance.TypeFactory.CreateModel(inputModel.BaseModel));
            }

            _isStruct = inputModel.ModelAsStruct;
        }

        private ModelProvider? BaseModelProvider
            => _baseModelProvider ??= (_baseTypeProvider?.Value is ModelProvider baseModelProvider ? baseModelProvider : null);
        private FieldProvider? RawDataField => _rawDataField ??= BuildRawDataField();

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

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _declarationModifiers;

        /// <summary>
        /// Builds the fields for the model by adding the raw data field.
        /// </summary>
        /// <returns>The list of <see cref="FieldProvider"/> for the model.</returns>
        protected override FieldProvider[] BuildFields()
        {
            return RawDataField != null ? [RawDataField] : [];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            var propertiesCount = _inputModel.Properties.Count;
            var propertyDeclarations = new List<PropertyProvider>(propertiesCount);

            for (int i = 0; i < propertiesCount; i++)
            {
                var property = _inputModel.Properties[i];
                var outputProperty = CodeModelPlugin.Instance.TypeFactory.CreatePropertyProvider(property, this);
                if (outputProperty != null)
                {
                    propertyDeclarations.Add(outputProperty);
                }
            }

            return propertyDeclarations.ToArray();
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            if (_inputModel.IsUnknownDiscriminatorModel)
            {
                return [FullConstructor];
            }

            // Build the initialization constructor
            var accessibility = DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)
                ? MethodSignatureModifiers.Protected
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
                AddInitializationParameterForCtor(baseParameters, property, _isStruct, isPrimaryConstructor);
            }

            constructorParameters.AddRange(baseParameters);

            // construct the initializer using the parameters from base signature
            var constructorInitializer = new ConstructorInitializer(true, baseParameters);

            foreach (var property in Properties)
            {
                AddInitializationParameterForCtor(constructorParameters, property, _isStruct, isPrimaryConstructor);
            }

            if (RawDataField != null && !isPrimaryConstructor)
            {
                constructorParameters.Add(RawDataField.AsParameter);
            }

            return (constructorParameters, constructorInitializer);
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
                if (isStruct || (wireInfo.IsRequired && !wireInfo.IsDiscriminator && !property.Type.IsLiteral))
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

                if (parameterMap.TryGetValue(property.AsParameter.Name, out var parameter) || _isStruct)
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

            if (!isPrimaryConstructor && RawDataField != null)
            {
                methodBodyStatements.Add(RawDataField.Assign(RawDataField.AsParameter).Terminate());
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
                type: _privateAdditionalRawDataPropertyType,
                description: FormattableStringHelpers.FromString(PrivateAdditionalPropertiesPropertyDescription),
                name: PrivateAdditionalPropertiesPropertyName,
                enclosingType: this);

            return rawDataField;
        }
    }
}
