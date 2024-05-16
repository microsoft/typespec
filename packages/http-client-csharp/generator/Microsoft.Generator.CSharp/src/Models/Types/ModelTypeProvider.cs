// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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

        public ModelTypeProvider(InputModelType inputModel, SourceInputModel? sourceInputModel)
            : base(sourceInputModel)
        {
            Name = inputModel.Name.ToCleanName();
            Namespace = GetDefaultModelNamespace(CodeModelPlugin.Instance.Configuration.Namespace);

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

            var initializationConstructor = BuildInitializationConstructor();
            if (initializationConstructor != null)
            {
                constructors.Add(initializationConstructor);
            }

            var serializationConstructor = BuildSerializationConstructor();
            bool serializationParametersMatchInitialization = initializationConstructor != null &&
                initializationConstructor.Signature.Parameters.SequenceEqual(serializationConstructor.Signature.Parameters, Parameter.EqualityComparerByType);

            if (!serializationParametersMatchInitialization)
            {
                constructors.Add(serializationConstructor);
            }

            if (initializationConstructor?.Signature.Parameters.Count > 0)
            {
                var emptyConstructor = BuildEmptyConstructor();
                constructors.Add(emptyConstructor);
            }

            return constructors.ToArray();
        }

        private IReadOnlyList<Parameter> BuildConstructorParameters(bool isSerializationConstructor)
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

                // All properties should be included in the serialization ctor
                if (isSerializationConstructor)
                {
                    constructorParameters.Add(parameter with { Validation = ValidationType.None });
                }
                else
                {
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

        private CSharpMethod? BuildInitializationConstructor()
        {
            if (_inputModel.IsUnknownDiscriminatorModel)
            {
                return null;
            }

            var accessibility = DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)
                ? MethodSignatureModifiers.Protected
                : _inputModel.Usage.HasFlag(InputModelTypeUsage.Input)
                    ? MethodSignatureModifiers.Public
                    : MethodSignatureModifiers.Internal;
            var constructorParameters = BuildConstructorParameters(false);

            var constructor = new CSharpMethod(
                signature: new ConstructorSignature(
                    Type,
                    $"Initializes a new instance of {Type:C}",
                    null,
                    accessibility,
                    constructorParameters),
                body: new MethodBodyStatement[]
                {
                    new ParameterValidationBlock(constructorParameters),
                    GetPropertyInitializers(constructorParameters)
                },
                kind: CSharpMethodKinds.Constructor);

            return constructor;
        }

        private CSharpMethod BuildSerializationConstructor()
        {
            var constructorParameters = BuildConstructorParameters(true);

            return new CSharpMethod(
                signature: new ConstructorSignature(
                    Type,
                    $"Initializes a new instance of {Type:C}",
                    null,
                    MethodSignatureModifiers.Internal,
                    constructorParameters),
                body: new MethodBodyStatement[]
                {
                    new ParameterValidationBlock(constructorParameters),
                    GetPropertyInitializers(constructorParameters)
                },
                kind: CSharpMethodKinds.Constructor);
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

            return methodBodyStatements;
        }

        private CSharpMethod BuildEmptyConstructor()
        {
            var accessibility = IsStruct ? MethodSignatureModifiers.Public : MethodSignatureModifiers.Internal;
            return new CSharpMethod(
                signature: new ConstructorSignature(Type, $"Initializes a new instance of {Type:C} for deserialization.", null, accessibility, Array.Empty<Parameter>()),
                body: new MethodBodyStatement(),
                kind: CSharpMethodKinds.Constructor);
        }
    }
}
