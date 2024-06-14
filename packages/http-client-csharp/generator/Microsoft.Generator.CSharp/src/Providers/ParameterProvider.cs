// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public sealed class ParameterProvider : IEquatable<ParameterProvider>
    {
        public string Name { get; }
        public FormattableString Description { get; }
        public CSharpType Type { get; init; }
        public ValueExpression? DefaultValue { get; init; }
        public ParameterValidationType Validation { get; init; } = ParameterValidationType.None;
        public bool IsRef { get; }
        public bool IsOut { get; }
        internal IReadOnlyList<AttributeStatement> Attributes { get; } = Array.Empty<AttributeStatement>();

        public ParameterProvider(InputModelProperty inputProperty)
        {
            Name = inputProperty.Name.ToVariableName();
            Description = FormattableStringHelpers.FromString(inputProperty.Description);
            Type = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(inputProperty.Type);
            Validation = GetParameterValidation(inputProperty, Type);
        }

        /// <summary>
        /// Creates a <see cref="ParameterProvider"/> from an <see cref="InputParameter"/>.
        /// </summary>
        /// <param name="inputParameter">The <see cref="InputParameter"/> to convert.</param>
        public ParameterProvider(InputParameter inputParameter)
        {
            Name = inputParameter.Name;
            Description = FormattableStringHelpers.FromString(inputParameter.Description) ?? FormattableStringHelpers.Empty;
            Type = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(inputParameter.Type);
            Validation = inputParameter.IsRequired ? ParameterValidationType.AssertNotNull : ParameterValidationType.None;
        }

        public ParameterProvider(
            string name,
            FormattableString description,
            CSharpType type,
            ValueExpression? defaultValue = null,
            bool isRef = false,
            bool isOut = false,
            IReadOnlyList<AttributeStatement>? attributes = default)
        {
            Name = name;
            Type = type;
            Description = description;
            IsRef = isRef;
            IsOut = isOut;
            DefaultValue = defaultValue;
            Attributes = attributes ?? Array.Empty<AttributeStatement>();
        }

        private ParameterValidationType GetParameterValidation(InputModelProperty property, CSharpType propertyType)
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

        public override bool Equals(object? obj)
        {
            return obj is ParameterProvider parameter && Equals(parameter);
        }

        public bool Equals(ParameterProvider? y)
        {
            if (ReferenceEquals(this, y))
            {
                return true;
            }

            if (this is null || y is null)
            {
                return false;
            }

            return Type.AreNamesEqual(y.Type) && Name == y.Name && Attributes.SequenceEqual(y.Attributes);
        }

        public override int GetHashCode()
        {
            return GetHashCode(this);
        }

        private int GetHashCode([DisallowNull] ParameterProvider obj)
        {
            // remove type as part of the hash code generation as the type might have changes between versions
            return HashCode.Combine(obj.Name);
        }

        private string GetDebuggerDisplay()
        {
            return $"Name: {Name}, Type: {Type}";
        }

        // TO-DO: Migrate code from autorest as part of output classes migration : https://github.com/Azure/autorest.csharp/issues/4198
    }
}
