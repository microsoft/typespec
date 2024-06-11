// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    public sealed class ModelProvider : TypeProvider
    {
        private readonly InputModelType _inputModel;
        public override string Name { get; }
        public override string Namespace { get; }
        public override FormattableString Description { get; }

        private readonly bool _isStruct;
        private readonly TypeSignatureModifiers _declarationModifiers;

        /// <summary>
        /// The serializations providers for the model provider.
        /// </summary>
        public IReadOnlyList<TypeProvider> SerializationProviders { get; } = Array.Empty<TypeProvider>();

        protected override string GetFileName() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        public ModelProvider(InputModelType inputModel)
        {
            _inputModel = inputModel;
            Name = inputModel.Name.ToCleanName();
            Namespace = GetDefaultModelNamespace(CodeModelPlugin.Instance.Configuration.Namespace);
            Description = inputModel.Description != null ? FormattableStringHelpers.FromString(inputModel.Description) : FormattableStringHelpers.Empty;
            // TODO -- support generating models as structs. Tracking issue: https://github.com/microsoft/typespec/issues/3453
            _declarationModifiers = TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;
            if (inputModel.Accessibility == "internal")
            {
                _declarationModifiers |= TypeSignatureModifiers.Internal;
            }

            bool isAbstract = inputModel.DiscriminatorPropertyName is not null && inputModel.DiscriminatorValue is null;
            if (isAbstract)
            {
                _declarationModifiers |= TypeSignatureModifiers.Abstract;
            }

            if (inputModel.Usage.HasFlag(InputModelTypeUsage.Json))
            {
                SerializationProviders = CodeModelPlugin.Instance.GetSerializationTypeProviders(this, _inputModel);
            }

            _isStruct = false; // this is only a temporary placeholder because we do not support to generate structs yet.
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
                    null,
                    accessibility,
                    constructorParameters),
                bodyStatements: new MethodBodyStatement[]
                {
                    new ParameterValidationStatement(constructorParameters),
                    GetPropertyInitializers(constructorParameters)
                },
                kind: CSharpMethodKinds.Constructor);

            return new MethodProvider[] { constructor };
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
                        initializationValue = new ParameterReferenceSnippet(parameter);

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
                    methodBodyStatements.Add(Assign(new MemberExpression(null, property.Name), initializationValue));
                }
            }

            return methodBodyStatements;
        }
    }
}
