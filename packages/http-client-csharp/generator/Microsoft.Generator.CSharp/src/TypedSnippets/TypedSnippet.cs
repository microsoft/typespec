// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    /// <summary>
    /// A wrapper around ValueExpression that also specifies return type of the expression
    /// Return type doesn't affect how expression is written, but helps creating strong-typed helpers to create value expressions.
    /// </summary>
    /// <param name="Type">Type expected to be returned by value expression.</param>
    /// <param name="Untyped"></param>
    public abstract record TypedSnippet(CSharpType Type, ValueExpression Untyped)
    {
        public virtual ValueExpression Property(string propertyName, bool nullConditional = false)
            => new MemberExpression(nullConditional ? new NullConditionalExpression(this) : this, propertyName);

        public ValueExpression NullableStructValue() => Type is { IsNullable: true, IsValueType: true } ? new MemberExpression(this, nameof(Nullable<int>.Value)) : this;

        public ValueExpression NullConditional() => Type.IsNullable ? new NullConditionalExpression(this) : this;

        protected static ValueExpression ValidateType(TypedSnippet typed, CSharpType type)
        {
            if (type.Equals(typed.Type, ignoreNullable: true))
            {
                return typed;
            }

            throw new InvalidOperationException($"Expression with return type {typed.Type.Name} is cast to type {type.Name}");
        }

        public static implicit operator ValueExpression(TypedSnippet typed) => typed.Untyped;
    }
}
