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
    public class ModelProvider : TypeProvider
    {
        private readonly InputModelType _inputModel;
        public override string RelativeFilePath => Path.Combine("src", "Generated", "Models", $"{Name}.cs");
        public override string Name { get; }
        public override string Namespace { get; }
        protected override FormattableString Description { get; }

        private readonly bool _isStruct;
        private readonly TypeSignatureModifiers _declarationModifiers;

        public ModelProvider(InputModelType inputModel)
        {
            _inputModel = inputModel;
            Name = inputModel.Name.ToCleanName();
            Namespace = GetDefaultModelNamespace(CodeModelPlugin.Instance.Configuration.Namespace);
            Description = inputModel.Description != null ? FormattableStringHelpers.FromString(inputModel.Description) : $"The {Name}.";
            _declarationModifiers = TypeSignatureModifiers.Partial |
                (inputModel.ModelAsStruct ? TypeSignatureModifiers.ReadOnly | TypeSignatureModifiers.Struct : TypeSignatureModifiers.Class);
            if (inputModel.Access == "internal")
            {
                _declarationModifiers |= TypeSignatureModifiers.Internal;
            }

            bool isAbstract = inputModel.DiscriminatorProperty is not null;
            if (isAbstract)
            {
                _declarationModifiers |= TypeSignatureModifiers.Abstract;
            }

            Inherits = _inputModel.BaseModel != null
                ? CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(_inputModel.BaseModel)
                : null;

            _discriminator = new(BuildDiscriminator);
            _isStruct = inputModel.ModelAsStruct;
        }

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return CodeModelPlugin.Instance.GetSerializationTypeProviders(this, _inputModel).ToArray();
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _declarationModifiers;

        private IReadOnlyDictionary<InputModelProperty, PropertyProvider>? _propertiesCache;
        private IReadOnlyDictionary<InputModelProperty, PropertyProvider> BuildPropertiesCache()
        {
            if (_propertiesCache != null)
            {
                return _propertiesCache;
            }

            // get all the properties from my base type
            var propertiesOnBase = new HashSet<string>();

            if (Inherits is { IsFrameworkType: false, Implementation: TypeProvider baseType })
            {
                foreach (var property in baseType.Properties)
                {
                    propertiesOnBase.Add(property.Name);
                }
            }

            var cache = new Dictionary<InputModelProperty, PropertyProvider>(_inputModel.Properties.Count);
            _propertiesCache = cache;
            var propertiesCount = _inputModel.Properties.Count;

            for (int i = 0; i < propertiesCount; i++)
            {
                var inputProperty = _inputModel.Properties[i];
                var property = new PropertyProvider(inputProperty);
                if (!propertiesOnBase.Contains(property.Name))
                {
                    cache.Add(inputProperty, property);
                }
            }

            return _propertiesCache;
        }

        private readonly Lazy<ModelDiscriminator?> _discriminator;
        public ModelDiscriminator? Discriminator => _discriminator.Value;

        protected virtual ModelDiscriminator? BuildDiscriminator()
        {
            var inputDiscriminatorProperty = _inputModel.DiscriminatorProperty;

            if (inputDiscriminatorProperty != null)
            {
                // I am a base model in a discriminated set, build the implementation types
                var discriminatorProperty = BuildPropertiesCache()[inputDiscriminatorProperty];

                return new ModelDiscriminator(
                    discriminatorProperty,
                    inputDiscriminatorProperty.SerializedName,
                    BuildDiscriminatedSubtypes(_inputModel.DiscriminatedSubtypes),
                    _inputModel.DiscriminatorValue
                    );
            }
            else
            {
                // I am a derived model in a discriminator or I do not have a discriminator
                // find the discriminator in my direct parent
                if (Inherits is not { IsFrameworkType: false, Implementation: ModelProvider parent } || parent.Discriminator == null)
                {
                    // I do not have a discriminator
                    return null;
                }

                return new ModelDiscriminator(
                    parent.Discriminator.DiscriminatorProperty,
                    parent.Discriminator.DiscriminatorSerializedName,
                    BuildDiscriminatedSubtypes(_inputModel.DiscriminatedSubtypes),
                    _inputModel.DiscriminatorValue
                    );
            }

            static IReadOnlyDictionary<string, CSharpType> BuildDiscriminatedSubtypes(IReadOnlyDictionary<string, InputModelType> discriminatedSubtypes)
            {
                var implementations = new Dictionary<string, CSharpType>(discriminatedSubtypes.Count);

                foreach (var (value, derived) in discriminatedSubtypes)
                {
                    implementations.Add(value, CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(derived));
                }

                return implementations;
            }
        }

        protected override PropertyProvider[] BuildProperties()
        {
            return BuildPropertiesCache().Values.ToArray();
        }

        protected override MethodProvider[] BuildConstructors()
        {
            if (_inputModel.IsUnknownDiscriminatorModel)
            {
                return Array.Empty<MethodProvider>();
            }

            // Build the initialization constructor
            var accessibility = DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)
                ? MethodSignatureModifiers.Protected
                : _inputModel.Usage.HasFlag(InputModelTypeUsage.Input)
                    ? MethodSignatureModifiers.Public
                    : MethodSignatureModifiers.Internal;
            var (constructorParameters, constructorInitializer) = BuildConstructorParameters();

            var constructor = new MethodProvider(
                signature: new ConstructorSignature(
                    Type,
                    $"Initializes a new instance of {Type:C}",
                    accessibility,
                    constructorParameters,
                    Initializer: constructorInitializer),
                bodyStatements: new MethodBodyStatement[]
                {
                    GetPropertyInitializers(constructorParameters)
                },
                this);

            return [constructor];
        }

        private (IReadOnlyList<ParameterProvider> Parameters, ConstructorInitializer? Initializer) BuildConstructorParameters()
        {
            var baseConstructor = GetBaseConstructor(Inherits);
            var baseParameters = baseConstructor?.Parameters ?? [];
            var parameterCapacity = baseParameters.Count + _inputModel.Properties.Count;
            var parameterNames = baseParameters.Select(p => p.Name).ToHashSet();
            var constructorParameters = new List<ParameterProvider>(parameterCapacity);

            // add the base parameters
            constructorParameters.AddRange(baseParameters);

            // construct the initializer using the parameters from base signature
            var constructorInitializer = new ConstructorInitializer(true, baseParameters);

            foreach (var property in _inputModel.Properties)
            {
                CSharpType propertyType = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(property.Type);
                if (_isStruct || (property is { IsRequired: true, IsDiscriminator: false } && !propertyType.IsLiteral))
                {
                    if (!property.IsReadOnly)
                    {
                        var parameter = new ParameterProvider(property)
                        {
                            Type = propertyType.InputType
                        };
                        if (!parameterNames.Contains(parameter.Name))
                        {
                            constructorParameters.Add(parameter);
                        }
                    }
                }
            }

            return (constructorParameters, constructorInitializer);

            static ConstructorSignature? GetBaseConstructor(CSharpType? baseType)
            {
                // find the constructor on the base type
                if (baseType is not { IsFrameworkType: false, Implementation: TypeProvider baseModel })
                {
                    return null;
                }

                if (baseModel.Constructors.Count == 0)
                {
                    return null;
                }

                // we cannot know which ctor to call, but in our implementation, there should only be one
                var ctor = baseModel.Constructors[0];
                if (ctor.Signature is not ConstructorSignature ctorSignature)
                {
                    return null;
                }

                return ctorSignature;
            }
        }

        private MethodBodyStatement GetPropertyInitializers(IReadOnlyList<ParameterProvider> parameters)
        {
            List<MethodBodyStatement> methodBodyStatements = new();

            Dictionary<string, ParameterProvider> parameterMap = parameters.ToDictionary(
                parameter => parameter.Name,
                parameter => parameter);

            foreach (var property in Properties)
            {
                ValueExpression? initializationValue = null;

                if (parameterMap.TryGetValue(property.Name.ToVariableName(), out var parameter) || _isStruct)
                {
                    if (parameter != null)
                    {
                        initializationValue = parameter;

                        if (CSharpType.RequiresToList(parameter.Type, property.Type))
                        {
                            initializationValue = parameter.Type.IsNullable ?
                                new NullConditionalExpression(initializationValue).ToList() :
                                initializationValue.ToList();
                        }
                    }
                }
                else if (initializationValue == null && property.Type.IsCollection)
                {
                    // TO-DO: Properly initialize collection properties - https://github.com/microsoft/typespec/issues/3509
                    initializationValue = New.Instance(property.Type.PropertyInitializationType);
                }

                if (initializationValue != null)
                {
                    methodBodyStatements.Add(property.Assign(initializationValue).Terminate());
                }
            }

            return methodBodyStatements;
        }
    }
}
