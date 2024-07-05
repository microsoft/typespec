// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
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
        private VariableExpression? _variable;
        public FormattableString Description { get; }
        public XmlDocSummaryStatement XmlDocSummary { get; }
        public MethodSignatureModifiers Modifiers { get; }
        public CSharpType Type { get; }
        public string Name { get; }
        public PropertyBody Body { get; }
        public CSharpType? ExplicitInterface { get; }
        public XmlDocProvider XmlDocs { get; }
        public PropertyWireInformation? WireInfo { get; }

        public PropertyProvider(InputModelProperty inputProperty)
        {
            var propertyType = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(inputProperty.Type);
            if (!inputProperty.IsRequired && !propertyType.IsCollection)
            {
                propertyType = propertyType.WithNullable(true);
            }
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
        }

        public VariableExpression AsVariableExpression => _variable ??= new(Type, Name.ToVariableName());

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
