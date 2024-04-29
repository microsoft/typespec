// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    public sealed class ModelTypeProvider : TypeProvider
    {
        private readonly InputModelType _inputModel;

        public override string Name { get; }

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
            var propHasSetter = PropertyHasSetter(propertyType, property);
            MethodSignatureModifiers setterModifier = propHasSetter ? MethodSignatureModifiers.Public : MethodSignatureModifiers.None;

            // Add Remarks and Example for BinaryData Properties https://github.com/Azure/autorest.csharp/issues/4617
            var propertyDeclaration = new PropertyDeclaration(
                    description: FormattableStringHelpers.FromString(property.Description),
                    modifiers: MethodSignatureModifiers.Public,
                    propertyType: propertyType,
                    name: property.Name.FirstCharToUpperCase(),
                    propertyBody: new AutoPropertyBody(propHasSetter, setterModifier, GetPropertyInitializationValue(property, propertyType))
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

            // The IsLiteral is returning false for int and float enum value types - https://github.com/Azure/autorest.csharp/issues/4630
            if (propertyType.IsLiteral)
                //if (property.Type is InputLiteralType literal)
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
    }
}
