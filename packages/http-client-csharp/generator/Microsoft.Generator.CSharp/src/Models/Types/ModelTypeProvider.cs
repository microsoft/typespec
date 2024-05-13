// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    public sealed class ModelTypeProvider : TypeProvider
    {
        private readonly InputModelType _inputModel;
        private CSharpMethod? _publicConstructor;
        private CSharpMethod? _serializationConstructor;
        private CSharpMethod? _emptyConstructor;

        public override string Name { get; }

        internal List<Parameter> PublicConstructorParameters { get; } = new List<Parameter>();
        internal List<Parameter> SerializationParameters { get; } = new List<Parameter>();

        internal CSharpMethod InitializationConstructor => _publicConstructor ??= BuildInitializationConstructor();
        internal CSharpMethod SerializationConstructor => _serializationConstructor ??= BuildSerializationConstructor();
        internal CSharpMethod? EmptyConstructor => _emptyConstructor ??= BuildEmptyConstructor();


        public ModelTypeProvider(InputModelType inputModel, SourceInputModel? sourceInputModel)
            : base(sourceInputModel)
        {
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

            _inputModel = inputModel;
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
            List<CSharpMethod> constructors = new List<CSharpMethod>();
            BuildConstructorParameters();

            var skipInitializerConstructor = _inputModel.IsUnknownDiscriminatorModel;
            if (!skipInitializerConstructor)
                constructors.Add(InitializationConstructor);

            if (SerializationConstructor != InitializationConstructor)
                constructors.Add(SerializationConstructor);

            if (EmptyConstructor != null)
                constructors.Add(EmptyConstructor);

            return constructors.ToArray();
        }

        private void BuildConstructorParameters()
        {
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

                // All properties should be included in the serialization ctor
                SerializationParameters.Add(parameter with { Validation = ValidationType.None });

                // For classes, only required + not readonly + not initialization value + not discriminator could get into the public ctor
                // For structs, all properties must be set in the public ctor
                if (IsStruct || (property is { IsRequired: true, IsDiscriminator: false } && initializationValue == null))
                {
                    if (!property.IsReadOnly)
                    {
                        PublicConstructorParameters.Add(parameter with { Type = parameter.Type.InputType });
                    }
                }
            }
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

        private CSharpMethod BuildInitializationConstructor()
        {
            var accessibility = DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)
                ? MethodSignatureModifiers.Protected
                : _inputModel.Usage.HasFlag(InputModelTypeUsage.Input)
                    ? MethodSignatureModifiers.Public
                    : MethodSignatureModifiers.Internal;

            var constructor = new CSharpMethod(
                signature: new ConstructorSignature(
                    Type,
                    $"Initializes a new instance of {Type:C}",
                    null,
                    accessibility,
                    PublicConstructorParameters),
                body: new MethodBodyStatement[]
                {
                    new ParameterValidationBlock(PublicConstructorParameters),
                    GetPropertyInitializers(PublicConstructorParameters)
                },
                kind: CSharpMethodKinds.Constructor);

            return constructor;
        }

        private CSharpMethod BuildSerializationConstructor()
        {
            // The property bag never needs deserialization, therefore we return the initialization constructor here so that we do not write it in the generated code
            if (_inputModel.IsPropertyBag)
                return InitializationConstructor;

            // Verifies the serialization ctor has the same parameter list as the public one, we return the initialization ctor
            if (!SerializationParameters.Any(p => p.Type.IsList) && PublicConstructorParameters.SequenceEqual(SerializationParameters, Parameter.EqualityComparerByType))
                return InitializationConstructor;

            return new CSharpMethod(
                signature: new ConstructorSignature(
                    Type,
                    $"Initializes a new instance of {Type:C}",
                    null,
                    MethodSignatureModifiers.Internal,
                    SerializationParameters),
                body: new MethodBodyStatement[]
                {
                    new ParameterValidationBlock(SerializationParameters),
                    GetPropertyInitializers(SerializationParameters)
                },
                kind: CSharpMethodKinds.Constructor);
        }

        private MethodBodyStatement[] GetPropertyInitializers(IReadOnlyList<Parameter> parameters)
        {
            List<MethodBodyStatement> methodBodyStatements = new();

            Dictionary<string, Parameter> parameterMap = parameters.ToDictionary(
                parameter => parameter.Name,
                parameter => parameter);

            foreach (var property in Properties)
            {
                ValueExpression? initializationValue = null;

                if (parameterMap.TryGetValue(property.Name.ToVariableName(), out var parameter) || IsStruct)
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

            return methodBodyStatements.ToArray();
        }

        private CSharpMethod? BuildEmptyConstructor()
        {

            var initCtorParameterCount = _inputModel.IsUnknownDiscriminatorModel ? int.MaxValue : InitializationConstructor.Signature.Parameters.Count; // if the ctor is skipped, we return a large number to avoid the case that the skipped ctor has 0 parameter.

            if (initCtorParameterCount > 0)
            {
                var accessibility = IsStruct ? MethodSignatureModifiers.Public : MethodSignatureModifiers.Internal;
                return new CSharpMethod(
                    signature: new ConstructorSignature(Type, $"Initializes a new instance of {Type:C}", null, accessibility, Array.Empty<Parameter>()),
                    body: new MethodBodyStatement(),
                    kind: CSharpMethodKinds.Constructor);
            }

            return null;
        }
    }
}
