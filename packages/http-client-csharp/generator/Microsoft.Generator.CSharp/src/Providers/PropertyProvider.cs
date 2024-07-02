// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public class PropertyProvider
    {
        public FormattableString Description { get; }
        public XmlDocSummaryStatement XmlDocSummary { get; }
        public MethodSignatureModifiers Modifiers { get; }
        public CSharpType Type { get; }
        public string Name { get; }
        public PropertyBody Body { get; }
        public CSharpType? ExplicitInterface { get; }
        public XmlDocProvider XmlDocs { get; }
        public PropertyWireInformation? WireInfo { get; }

        private Lazy<ParameterProvider> _parameter;
        private Lazy<ParameterProvider> _inputParameter;

        public ParameterProvider Parameter => _parameter.Value;
        public ParameterProvider InputParameter => _inputParameter.Value;

        public PropertyProvider(InputModelProperty inputProperty)
        {
            var propertyType = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(inputProperty.Type);
            var serializationFormat = CodeModelPlugin.Instance.TypeFactory.GetSerializationFormat(inputProperty.Type);
            var propHasSetter = PropertyHasSetter(propertyType, inputProperty);
            MethodSignatureModifiers setterModifier = propHasSetter ? MethodSignatureModifiers.Public : MethodSignatureModifiers.None;

            Type = propertyType;
            Modifiers = MethodSignatureModifiers.Public;
            Name = inputProperty.Name.FirstCharToUpperCase();
            Body = new AutoPropertyBody(propHasSetter, setterModifier, GetPropertyInitializationValue(propertyType, inputProperty));
            Description = string.IsNullOrEmpty(inputProperty.Description) ? PropertyDescriptionBuilder.CreateDefaultPropertyDescription(Name, !Body.HasSetter) : $"{inputProperty.Description}";
            XmlDocSummary = PropertyDescriptionBuilder.BuildPropertyDescription(inputProperty, propertyType, serializationFormat, Description);
            XmlDocs = GetXmlDocs();
            WireInfo = new PropertyWireInformation(inputProperty);

            InitializeParameter(Name, FormattableStringHelpers.FromString(inputProperty.Description), Type, GetParameterValidation(inputProperty, Type));
        }

        public PropertyProvider(
            FormattableString? description,
            MethodSignatureModifiers modifiers,
            CSharpType type,
            string name,
            PropertyBody body,
            CSharpType? explicitInterface = null,
            PropertyWireInformation? wireInfo = null)
        {
            Description = description ?? PropertyDescriptionBuilder.CreateDefaultPropertyDescription(name, !body.HasSetter);
            XmlDocSummary = new XmlDocSummaryStatement([Description]);
            Modifiers = modifiers;
            Type = type;
            Name = name;
            Body = body;
            ExplicitInterface = explicitInterface;
            XmlDocs = GetXmlDocs();
            WireInfo = wireInfo;

            InitializeParameter(Name, description ?? FormattableStringHelpers.Empty, Type, ParameterValidationType.None);
        }

        [MemberNotNull(nameof(_parameter))]
        [MemberNotNull(nameof(_inputParameter))]
        private void InitializeParameter(string propertyName, FormattableString description, CSharpType propertyType, ParameterValidationType validation)
        {
            var parameterName = propertyName.FirstCharToLowerCase();
            _parameter = new(() => new ParameterProvider(parameterName, description, propertyType));
            _inputParameter = new(() => BuildParameter(parameterName, description, propertyType.InputType, validation));
        }

        private static ParameterProvider BuildParameter(string name, FormattableString description, CSharpType type, ParameterValidationType validation)
        {
            return new(name, description, type)
            {
                Validation = validation
            };
        }

        private static ParameterValidationType GetParameterValidation(InputModelProperty property, CSharpType propertyType)
        {
            // We do not validate a parameter when it is a value type (struct or int, etc)
            if (propertyType.IsValueType)
            {
                return ParameterValidationType.None;
            }

            // or it is readonly
            if (property.IsReadOnly)
            {
                return ParameterValidationType.None;
            }

            // or it is optional
            if (!property.IsRequired)
            {
                return ParameterValidationType.None;
            }

            // or it is nullable
            if (propertyType.IsNullable)
            {
                return ParameterValidationType.None;
            }

            return ParameterValidationType.AssertNotNull;
        }

        private XmlDocProvider GetXmlDocs()
        {
            // TODO -- should write parameter xml doc if this is an IndexerDeclaration: https://github.com/microsoft/typespec/issues/3276

            return new XmlDocProvider()
            {
                Summary = XmlDocSummary,
            };
        }

        /// <summary>
        /// Returns true if the property has a setter.
        /// </summary>
        /// <param name="type">The <see cref="CSharpType"/> of the property.</param>
        private bool PropertyHasSetter(CSharpType type, InputModelProperty inputProperty)
        {
            if (inputProperty.IsDiscriminator)
            {
                return true;
            }

            if (inputProperty.IsReadOnly)
            {
                return false;
            }

            if (type.IsLiteral && inputProperty.IsRequired)
            {
                return false;
            }

            if (type.IsCollection && !type.IsReadOnlyMemory)
            {
                return type.IsNullable;
            }

            return true;
        }

        private ValueExpression? GetPropertyInitializationValue(CSharpType propertyType, InputModelProperty inputProperty)
        {
            if (!inputProperty.IsRequired)
                return null;

            if (propertyType.IsLiteral)
            {
                if (!propertyType.IsNullable)
                {
                    return Snippet.Literal(propertyType.Literal);
                }
                else
                {
                    return Snippet.DefaultOf(propertyType);
                }
            }

            return null;
        }

        private string GetDebuggerDisplay()
        {
            return $"Name: {Name}, Type: {Type}";
        }

        private MemberExpression? _asMember;
        public static implicit operator MemberExpression(PropertyProvider property)
            => property._asMember ??= new MemberExpression(null, property.Name);
    }
}
