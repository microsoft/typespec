// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    public sealed class ModelTypeProvider : TypeProvider
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

        public ModelTypeProvider(InputModelType inputModel, SourceInputModel? sourceInputModel)
            : base(sourceInputModel)
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
                SerializationProviders = CodeModelPlugin.Instance.GetSerializationTypeProviders(this);
            }

            _isStruct = false; // this is only a temporary placeholder because we do not support to generate structs yet.
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _declarationModifiers;

        protected override PropertyDeclaration[] BuildProperties()
        {
            var propertiesCount = _inputModel.Properties.Count;
            var propertyDeclarations = new PropertyDeclaration[propertiesCount];

            for (int i = 0; i < propertiesCount; i++)
            {
                var property = _inputModel.Properties[i];
                propertyDeclarations[i] = new PropertyDeclaration(property);
            }

            return propertyDeclarations;
        }

        protected override CSharpMethod[] BuildConstructors()
        {
            if (_inputModel.IsUnknownDiscriminatorModel)
            {
                return Array.Empty<CSharpMethod>();
            }

            // Build the initialization constructor
            var accessibility = DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)
                ? MethodSignatureModifiers.Protected
                : _inputModel.Usage.HasFlag(InputModelTypeUsage.Input)
                    ? MethodSignatureModifiers.Public
                    : MethodSignatureModifiers.Internal;
            var constructorParameters = BuildConstructorParameters();

            var constructor = new CSharpMethod(
                signature: new ConstructorSignature(
                    Type,
                    $"Initializes a new instance of {Type:C}",
                    null,
                    accessibility,
                    constructorParameters),
                bodyStatements: new MethodBodyStatement[]
                {
                    new ParameterValidationBlock(constructorParameters),
                    GetPropertyInitializers(constructorParameters)
                },
                kind: CSharpMethodKinds.Constructor);

            return new CSharpMethod[] { constructor };
        }

        private IReadOnlyList<Parameter> BuildConstructorParameters()
        {
            List<Parameter> constructorParameters = new List<Parameter>();

            foreach (var property in _inputModel.Properties)
            {
                CSharpType propertyType = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(property.Type);
                if (_isStruct || (property is { IsRequired: true, IsDiscriminator: false } && !propertyType.IsLiteral))
                {
                    if (!property.IsReadOnly)
                    {
                        constructorParameters.Add(new Parameter(property)
                        {
                            Type = propertyType.InputType
                        });
                    }
                }
            }

            return constructorParameters;
        }

        private MethodBodyStatement GetPropertyInitializers(IReadOnlyList<Parameter> parameters)
        {
            List<MethodBodyStatement> methodBodyStatements = new();

            Dictionary<string, Parameter> parameterMap = parameters.ToDictionary(
                parameter => parameter.Name,
                parameter => parameter);

            foreach (var property in Properties)
            {
                ValueExpression? initializationValue = null;

                if (parameterMap.TryGetValue(property.Name.ToVariableName(), out var parameter) || _isStruct)
                {
                    if (parameter != null)
                    {
                        initializationValue = new ParameterReference(parameter);

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
