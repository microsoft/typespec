// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;

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
            MethodSignatureModifiers setterModifier = !property.IsReadOnly ? MethodSignatureModifiers.Public : MethodSignatureModifiers.None;

            // Exclude setter generation for collection properties https://github.com/Azure/autorest.csharp/issues/4616
            // Add Remarks and Example for BinaryData Properties https://github.com/Azure/autorest.csharp/issues/4617
            var propertyDeclaration = new PropertyDeclaration(
                    Description: FormattableStringHelpers.FromString(property.Description),
                    Modifiers: MethodSignatureModifiers.Public,
                    PropertyType: propertyType,
                    Name: property.Name.FirstCharToUpperCase(),
                    PropertyBody: new AutoPropertyBody(!property.IsReadOnly, setterModifier, GetPropertyInitializationValue(property, propertyType))
                    );

            return propertyDeclaration;
        }

        private ConstantExpression? GetPropertyInitializationValue(InputModelProperty property, CSharpType propertyType)
        {
            if (!property.IsRequired)
                return null;

            // The IsLiteral is returning false for int and float enum value types - https://github.com/Azure/autorest.csharp/issues/4630
            // if (propertyType.IsLiteral && propertyType.Literal?.Value != null)
            if (property.Type is InputLiteralType literal)
            {
                if (!propertyType.IsNullable)
                {
                    var constant = Constant.Parse(literal.Value, propertyType);
                    return new ConstantExpression(constant);
                }
                else
                {
                    return new ConstantExpression(Constant.NewInstanceOf(propertyType));
                }
            }

            return null;
        }
    }
}
