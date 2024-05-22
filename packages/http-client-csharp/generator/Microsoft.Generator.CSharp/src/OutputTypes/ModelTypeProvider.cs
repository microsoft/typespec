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

        public IReadOnlyList<InputModelType> DerivedModels { get; }

        /// <summary>
        /// The serializations providers for the model provider.
        /// </summary>
        public IReadOnlyList<TypeProvider> SerializationProviders { get; } = Array.Empty<TypeProvider>();

        public ModelTypeProvider(InputModelType inputModel, SourceInputModel? sourceInputModel)
            : base(sourceInputModel)
        {
            _inputModel = inputModel;
            Name = inputModel.Name.ToCleanName();
            if (inputModel.Accessibility == "internal")
            {
                DeclarationModifiers = TypeSignatureModifiers.Partial | TypeSignatureModifiers.Internal;
            }

            bool isAbstract = inputModel.DiscriminatorPropertyName is not null && inputModel.DiscriminatorValue is null;
            if (isAbstract)
            {
                DeclarationModifiers |= TypeSignatureModifiers.Abstract;
            }

            DerivedModels = inputModel.DerivedModels;
            if (inputModel.Usage.HasFlag(InputModelTypeUsage.Json))
            {
                SerializationProviders = CodeModelPlugin.Instance.GetSerializationTypeProviders(this);
            }
        }

        protected override PropertyDeclaration[] BuildProperties()
        {
            var propertiesCount = _inputModel.Properties.Count;
            var propertyDeclarations = new PropertyDeclaration[propertiesCount];

            for (int i = 0; i < propertiesCount; i++)
            {
                var property = _inputModel.Properties[i];
                propertyDeclarations[i] = BuildPropertyDeclaration(property);
            }

            return propertyDeclarations;
        }

        private PropertyDeclaration BuildPropertyDeclaration(InputModelProperty property)
        {
            var propertyType = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(property.Type);
            var serializationFormat = CodeModelPlugin.Instance.TypeFactory.GetSerializationFormat(property.Type);
            var propHasSetter = PropertyHasSetter(propertyType, property);
            MethodSignatureModifiers setterModifier = propHasSetter ? MethodSignatureModifiers.Public : MethodSignatureModifiers.None;

            var propertyDeclaration = new PropertyDeclaration(
                Description: PropertyDescriptionBuilder.BuildPropertyDescription(property, propertyType, serializationFormat, !propHasSetter),
                OriginalDescription: property.Description,
                Modifiers: MethodSignatureModifiers.Public,
                Type: propertyType,
                Name: property.Name.FirstCharToUpperCase(),
                Body: new AutoPropertyBody(propHasSetter, setterModifier, GetPropertyInitializationValue(property, propertyType))
                );

            return propertyDeclaration;
        }

        /// <summary>
        /// Returns true if the property has a setter.
        /// </summary>
        /// <param name="type">The <see cref="CSharpType"/> of the property.</param>
        /// <param name="prop">The <see cref="InputModelProperty"/>.</param>
        private bool PropertyHasSetter(CSharpType type, InputModelProperty prop)
        {
            if (prop.IsDiscriminator)
            {
                return true;
            }

            if (prop.IsReadOnly)
            {
                return false;
            }

            if (IsStruct)
            {
                return false;
            }

            if (type.IsLiteral && prop.IsRequired)
            {
                return false;
            }

            if (type.IsCollection && !type.IsReadOnlyMemory)
            {
                return type.IsNullable;
            }

            return true;
        }

        private ValueExpression? GetPropertyInitializationValue(InputModelProperty property, CSharpType propertyType)
        {
            if (!property.IsRequired)
                return null;

            if (propertyType.IsLiteral)
            {
                if (!propertyType.IsNullable)
                {
                    return Literal(propertyType.Literal);
                }
                else
                {
                    return DefaultOf(propertyType);
                }
            }

            return null;
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
                var initializationValue = GetPropertyInitializationValue(property, propertyType);
                var parameterValidation = GetParameterValidation(property, propertyType);

                var parameter = new Parameter(
                   Name: property.Name.ToVariableName(),
                   Description: FormattableStringHelpers.FromString(property.Description),
                   Type: propertyType,
                   DefaultValue: null,
                   Validation: parameterValidation,
                   Initializer: null);

                // For classes, only required + not readonly + not initialization value + not discriminator could get into the public ctor
                // For structs, all properties must be set in the public ctor
                if (IsStruct || (property is { IsRequired: true, IsDiscriminator: false } && initializationValue == null))
                {
                    if (!property.IsReadOnly)
                    {
                        constructorParameters.Add(parameter with { Type = parameter.Type.InputType });
                    }
                }
            }

            return constructorParameters;
        }

        private static ValidationType GetParameterValidation(InputModelProperty property, CSharpType propertyType)
        {
            // We do not validate a parameter when it is a value type (struct or int, etc)
            if (propertyType.IsValueType)
            {
                return ValidationType.None;
            }

            // or it is readonly
            if (property.IsReadOnly)
            {
                return ValidationType.None;
            }

            // or it is optional
            if (!property.IsRequired)
            {
                return ValidationType.None;
            }

            // or it is nullable
            if (propertyType.IsNullable)
            {
                return ValidationType.None;
            }

            return ValidationType.AssertNotNull;
        }

        private MethodBodyStatement GetPropertyInitializers(IReadOnlyList<Parameter> parameters)
        {
            List<MethodBodyStatement> methodBodyStatements = new();
            Dictionary<string, Parameter> parameterMap = parameters.ToDictionary(
                parameter => parameter.Name,
                parameter => parameter);

            foreach (var property in Properties)
            {
                Parameter? parameter = parameterMap.GetValueOrDefault(property.Name.ToVariableName());
                methodBodyStatements.Add(property.ToInitializationStatement(parameter));
            }

            return methodBodyStatements;
        }
    }
}
