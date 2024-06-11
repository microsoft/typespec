// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Providers
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public class PropertyProvider
    {
        public IReadOnlyList<FormattableString> Description { get; }
        public MethodSignatureModifiers Modifiers { get; }
        public CSharpType Type { get; }
        public string Name { get; }
        public PropertyBody Body { get; }
        public IReadOnlyDictionary<CSharpType, FormattableString>? Exceptions { get; }
        public CSharpType? ExplicitInterface { get; }
        public PropertyProvider(InputModelProperty inputProperty)
        {
            var propertyType = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(inputProperty.Type);
            var serializationFormat = CodeModelPlugin.Instance.TypeFactory.GetSerializationFormat(inputProperty.Type);
            var propHasSetter = PropertyHasSetter(propertyType, inputProperty);
            MethodSignatureModifiers setterModifier = propHasSetter ? MethodSignatureModifiers.Public : MethodSignatureModifiers.None;

            Type = propertyType;
            Modifiers = MethodSignatureModifiers.Public;
            Description = PropertyDescriptionBuilder.BuildPropertyDescription(inputProperty, propertyType, serializationFormat, !propHasSetter);
            Name = inputProperty.Name.FirstCharToUpperCase();
            Body = new AutoPropertyBody(propHasSetter, setterModifier, GetPropertyInitializationValue(propertyType, inputProperty));
        }

        public PropertyProvider(FormattableString? description, MethodSignatureModifiers modifiers, CSharpType type, string name, PropertyBody body, IReadOnlyDictionary<CSharpType, FormattableString>? exceptions = null, CSharpType? explicitInterface = null)
        {
            Description = [description ?? PropertyDescriptionBuilder.CreateDefaultPropertyDescription(name, !body.HasSetter)];
            Modifiers = modifiers;
            Type = type;
            Name = name;
            Body = body;
            Exceptions = exceptions;
            ExplicitInterface = explicitInterface;
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
    }
}
