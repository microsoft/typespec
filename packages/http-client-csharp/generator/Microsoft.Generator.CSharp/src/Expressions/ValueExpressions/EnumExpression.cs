// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record EnumExpression(EnumTypeProvider EnumType, ValueExpression Untyped) : TypedValueExpression(EnumType.Type, Untyped)
    {
        public TypedValueExpression ToSerial()
            => EnumType.ToSerial(Untyped);

        public static TypedValueExpression ToEnum(EnumTypeProvider enumType, ValueExpression value)
            => enumType.IsExtensible
                ? new EnumExpression(enumType, Snippets.New.Instance(enumType.Type, value))
                : new EnumExpression(enumType, new InvokeStaticMethodExpression(enumType.Type, $"To{enumType.Name}", new[] { value }, null, true));
    }
}
