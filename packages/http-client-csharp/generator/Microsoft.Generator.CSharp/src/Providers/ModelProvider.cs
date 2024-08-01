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
        private readonly InputModelType _inputModel;

        protected override FormattableString Description { get; }

        private readonly bool _isStruct;
        private readonly TypeSignatureModifiers _declarationModifiers;

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

            _isStruct = inputModel.ModelAsStruct;
        }

        protected override string GetNamespace() => CodeModelPlugin.Instance.Configuration.ModelNamespace;

        protected override CSharpType? GetBaseType()
        {
            if (_inputModel.BaseModel == null)
                return null;

            return CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(_inputModel.BaseModel);
        }

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return [.. CodeModelPlugin.Instance.TypeFactory.CreateSerializations(_inputModel)];
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override string BuildName() => _inputModel.Name.ToCleanName();

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _declarationModifiers;

        protected override PropertyProvider[] BuildProperties()
        {
            var propertiesCount = _inputModel.Properties.Count;
            var propertyDeclarations = new List<PropertyProvider>(propertiesCount);

            for (int i = 0; i < propertiesCount; i++)
            {
                var property = _inputModel.Properties[i];
                var outputProperty = CodeModelPlugin.Instance.TypeFactory.CreatePropertyProvider(property);
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
                return [];
            }

            // Build the initialization constructor
            var accessibility = DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)
                ? MethodSignatureModifiers.Protected
                : _inputModel.Usage.HasFlag(InputModelTypeUsage.Input)
                    ? MethodSignatureModifiers.Public
                    : MethodSignatureModifiers.Internal;
            var (constructorParameters, constructorInitializer) = BuildConstructorParameters();

            var constructor = new ConstructorProvider(
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

        // TODO -- figure out how to reuse this piece of code because similar code exists in MrwSerializationDefinition as well https://github.com/microsoft/typespec/issues/3871
        private (IReadOnlyList<ParameterProvider> Parameters, ConstructorInitializer? Initializer) BuildConstructorParameters()
        {
            // we need to find all the properties on our base model, we add the reverse because our convention is to have the properties from base model first.
            var baseProperties = _inputModel.GetAllBaseModels().Reverse().SelectMany(model => CodeModelPlugin.Instance.TypeFactory.CreateModel(model)?.Properties ?? []);
            var basePropertyCount = baseProperties.Count();
            var parameterCapacity = basePropertyCount + Properties.Count;
            var baseParameters = new List<ParameterProvider>(basePropertyCount);
            var constructorParameters = new List<ParameterProvider>(parameterCapacity);

            // add the base parameters
            foreach (var property in baseProperties)
            {
                AddInitializationParameter(baseParameters, property, _isStruct);
            }
            constructorParameters.AddRange(baseParameters);

            // construct the initializer using the parameters from base signature
            var constructorInitializer = new ConstructorInitializer(true, baseParameters);

            foreach (var property in Properties)
            {
                AddInitializationParameter(constructorParameters, property, _isStruct);
            }

            return (constructorParameters, constructorInitializer);

            static void AddInitializationParameter(List<ParameterProvider> parameters, PropertyProvider property, bool isStruct)
            {
                // we only add those properties with wire info indicating they are coming from specs.
                if (property.WireInfo is not { } wireInfo)
                {
                    return;
                }
                if (isStruct || (wireInfo is { IsRequired: true, IsDiscriminator: false } && !property.Type.IsLiteral))
                {
                    if (!wireInfo.IsReadOnly)
                    {
                        parameters.Add(property.AsParameter.ToPublicInputParameter());
                    }
                }
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

            return methodBodyStatements;
        }
    }
}
