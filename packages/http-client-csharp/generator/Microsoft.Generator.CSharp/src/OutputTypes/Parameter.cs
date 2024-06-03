// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public sealed class Parameter : IEquatable<Parameter>
    {
        public string Name { get; }
        public FormattableString Description { get; }
        public CSharpType Type { get; init; }
        public ValueExpression? DefaultValue { get; init; }
        public ParameterValidationType? Validation { get; init; } = ParameterValidationType.None;
        public bool IsRef { get; }
        public bool IsOut { get; }
        internal static IEqualityComparer<Parameter> TypeAndNameEqualityComparer = new ParameterTypeAndNameEqualityComparer();
        internal CSharpAttribute[] Attributes { get; init; } = Array.Empty<CSharpAttribute>();

        public Parameter(InputModelProperty inputProperty)
        {
            Name = inputProperty.Name.ToVariableName();
            Description = FormattableStringHelpers.FromString(inputProperty.Description);
            Type = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(inputProperty.Type);
            Validation = GetParameterValidation(inputProperty, Type);
        }

        /// <summary>
        /// Creates a <see cref="Parameter"/> from an <see cref="InputParameter"/>.
        /// </summary>
        /// <param name="inputParameter">The <see cref="InputParameter"/> to convert.</param>
        public Parameter(InputParameter inputParameter)
        {
            // TO-DO: Add additional implementation to properly build the parameter https://github.com/Azure/autorest.csharp/issues/4607
            Name = inputParameter.Name;
            Description = FormattableStringHelpers.FromString(inputParameter.Description) ?? FormattableStringHelpers.Empty;
            Type = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(inputParameter.Type);
            Validation = inputParameter.IsRequired ? ParameterValidationType.AssertNotNull : ParameterValidationType.None;
        }

        public Parameter(
            string name,
            FormattableString description,
            CSharpType type,
            ValueExpression? defaultValue = null,
            bool isRef = false,
            bool isOut = false)
        {
            Name = name;
            Type = type;
            Description = description;
            IsRef = isRef;
            IsOut = isOut;
            DefaultValue = defaultValue;
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
            return obj is Parameter parameter && Equals(parameter);
        }

        public bool Equals(Parameter? y)
        {
            return Equals(this?.Type, y?.Type);
        }

        public override int GetHashCode()
        {
            return GetHashCode(this);
        }

        private int GetHashCode([DisallowNull] Parameter obj) => obj.Type.GetHashCode();

        private class ParameterTypeAndNameEqualityComparer : IEqualityComparer<Parameter>
        {
            public bool Equals(Parameter? x, Parameter? y)
            {
                if (ReferenceEquals(x, y))
                {
                    return true;
                }

                if (x is null || y is null)
                {
                    return false;
                }

                var result = x.Type.AreNamesEqual(y.Type) && x.Name == y.Name;
                return result;
            }

            public int GetHashCode([DisallowNull] Parameter obj)
            {
                // remove type as part of the hash code generation as the type might have changes between versions
                return HashCode.Combine(obj.Name);
            }
        }

        private string GetDebuggerDisplay()
        {
            return $"Name: {Name}, Type: {Type}";
        }

        // TO-DO: Migrate code from autorest as part of output classes migration : https://github.com/Azure/autorest.csharp/issues/4198
    }
}
