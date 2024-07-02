// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    public sealed class ModelProvider : TypeProvider
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

            bool isAbstract = inputModel.DiscriminatorProperty is not null && inputModel.DiscriminatorValue is null;
            if (isAbstract)
            {
                _declarationModifiers |= TypeSignatureModifiers.Abstract;
            }

            _isStruct = inputModel.ModelAsStruct;
        }

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return CodeModelPlugin.Instance.TypeFactory.GetSerializationTypeProviders(this, _inputModel).ToArray();
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _declarationModifiers;

        protected override PropertyProvider[] BuildProperties()
        {
            var propertiesCount = _inputModel.Properties.Count;
            var propertyDeclarations = new PropertyProvider[propertiesCount];

            for (int i = 0; i < propertiesCount; i++)
            {
                var property = _inputModel.Properties[i];
                propertyDeclarations[i] = new PropertyProvider(property);
            }

            return propertyDeclarations;
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
            var constructorParameters = BuildConstructorParameters();

            var constructor = new MethodProvider(
                signature: new ConstructorSignature(
                    Type,
                    $"Initializes a new instance of {Type:C}",
                    accessibility,
                    constructorParameters),
                bodyStatements: new MethodBodyStatement[]
                {
                    GetPropertyInitializers(constructorParameters)
                },
                this);

            return [constructor];
        }

        private IReadOnlyList<ParameterProvider> BuildConstructorParameters()
        {
            List<ParameterProvider> constructorParameters = new List<ParameterProvider>();

            foreach (var property in _inputModel.Properties)
            {
                CSharpType propertyType = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(property.Type);
                if (_isStruct || (property is { IsRequired: true, IsDiscriminator: false } && !propertyType.IsLiteral))
                {
                    if (!property.IsReadOnly)
                    {
                        constructorParameters.Add(new ParameterProvider(property)
                        {
                            Type = propertyType.InputType
                        });
                    }
                }
            }

            return constructorParameters;
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
                                Linq.ToList(new NullConditionalExpression(initializationValue)) :
                                Linq.ToList(initializationValue);
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
