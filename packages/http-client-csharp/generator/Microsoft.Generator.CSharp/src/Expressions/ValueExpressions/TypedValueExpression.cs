// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// A wrapper around ValueExpression that also specifies return type of the expression
    /// Return type doesn't affect how expression is written, but helps creating strong-typed helpers to create value expressions.
    /// </summary>
    /// <param name="Type">Type expected to be returned by value expression.</param>
    /// <param name="Untyped"></param>
    public abstract record TypedValueExpression(CSharpType Type, ValueExpression Untyped) : ValueExpression
    {
        public override void Write(CodeWriter writer) => Untyped.Write(writer);
        public static implicit operator TypedValueExpression(FieldDeclaration field) => new VariableReference(field.Type, field.Name);
        public static implicit operator TypedValueExpression(PropertyDeclaration property) => new VariableReference(property.PropertyType, property.Name);
        public static implicit operator TypedValueExpression(Parameter parameter) => new ParameterReference(parameter);

        public TypedValueExpression NullableStructValue() => this is not ConstantExpression && Type is { IsNullable: true, IsValueType: true } ? new TypedMemberExpression(this, nameof(Nullable<int>.Value), Type.WithNullable(false)) : this;

        public TypedValueExpression NullConditional() => Type.IsNullable ? new TypedNullConditionalExpression(this) : this;

        public virtual TypedValueExpression Property(string propertyName, CSharpType propertyType)
            => new TypedMemberExpression(this, propertyName, propertyType);

        protected static ValueExpression ValidateType(TypedValueExpression typed, CSharpType type)
        {
            if (type.Equals(typed.Type, ignoreNullable: true))
            {
                return typed.Untyped;
            }

            throw new InvalidOperationException($"Expression with return type {typed.Type.Name} is cast to type {type.Name}");
        }
    }
}
