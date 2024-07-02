// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
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
            return CodeModelPlugin.Instance.GetSerializationTypeProviders(this, _inputModel).ToArray();
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers() => _declarationModifiers;

        private IReadOnlyDictionary<InputModelProperty, PropertyProvider>? _propertiesCache;
        internal IReadOnlyDictionary<InputModelProperty, PropertyProvider> PropertiesCache => _propertiesCache ??= BuildPropertiesCache();

        private IReadOnlyDictionary<InputModelProperty, PropertyProvider> BuildPropertiesCache()
        {
            var propertiesCount = _inputModel.Properties.Count;
            var cache = new Dictionary<InputModelProperty, PropertyProvider>(propertiesCount);

            for (int i = 0; i < propertiesCount; i++)
            {
                var inputProperty = _inputModel.Properties[i];
                var property = new PropertyProvider(inputProperty);
                cache.Add(inputProperty, property);
            }

            return cache;
        }

        protected override PropertyProvider[] BuildProperties()
        {
            return PropertiesCache.Values.ToArray();
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

            foreach (var (inputProperty, property) in PropertiesCache)
            {
                if (_isStruct || (inputProperty is { IsRequired: true, IsDiscriminator: false } && !property.Type.IsLiteral))
                {
                    if (!inputProperty.IsReadOnly)
                    {
                        constructorParameters.Add(property.InputParameter);
                    }
                }
            }

            return constructorParameters;
        }

        private MethodBodyStatement GetPropertyInitializers(IReadOnlyList<ParameterProvider> parameters)
        {
            List<MethodBodyStatement> methodBodyStatements = new();

            var parameterNames = parameters.ToHashSet();

            Dictionary<string, ParameterProvider> parameterMap = parameters.ToDictionary(
                parameter => parameter.Name,
                parameter => parameter);

            foreach (var property in Properties)
            {
                ValueExpression? initializationValue = null;
                var parameter = property.InputParameter;

                if (parameterNames.Contains(parameter) || _isStruct)
                {
                    initializationValue = parameter;

                    if (CSharpType.RequiresToList(parameter.Type, property.Type))
                    {
                        initializationValue= parameter.Type.IsNullable
                            ? Linq.ToList(new NullConditionalExpression(initializationValue))
                            : Linq.ToList(initializationValue);
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
