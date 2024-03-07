// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    /// <summary>
    /// A wrapper around ValueExpression that also specifies return type of the expression
    /// Return type doesn't affect how expression is written, but help creating strong-typed helpers to create value expressions
    /// </summary>
    /// <param name="Type">Type expected to be returned by value expression</param>
    /// <param name="Untyped"></param>
    internal abstract record TypedValueExpression(CSharpType Type, ValueExpression Untyped) : ValueExpression
    {
        public static implicit operator TypedValueExpression(FieldDeclaration name) => new VariableReference(name.Type, name.Declaration);
        public static implicit operator TypedValueExpression(Parameter parameter) => new ParameterReference(parameter);

        public TypedValueExpression NullableStructValue() => this is not ConstantExpression && Type is { IsNullable: true, IsValueType: true } ? new TypedMemberExpression(this, nameof(Nullable<int>.Value), Type.WithNullable(false)) : this;

        public TypedValueExpression NullConditional() => Type.IsNullable ? new TypedNullConditionalExpression(this) : this;

        public virtual TypedValueExpression Property(string propertyName, CSharpType propertyType)
            => new TypedMemberExpression(this, propertyName, propertyType);

        protected static ValueExpression ValidateType(TypedValueExpression typed, CSharpType type)
        {
            if (type.EqualsIgnoreNullable(typed.Type))
            {
                return typed.Untyped;
            }

            throw new InvalidOperationException($"Expression with return type {typed.Type.Name} is cast to type {type.Name}");
        }
    }
}
