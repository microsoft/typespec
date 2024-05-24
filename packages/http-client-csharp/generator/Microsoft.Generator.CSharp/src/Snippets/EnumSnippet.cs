// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record EnumSnippet(EnumType EnumType, ValueExpression Untyped) : TypedSnippet(EnumType.Type, Untyped)
    {
        public TypedSnippet ToSerial()
            => EnumType.SerializationMethodName is {} name
                ? EnumType.IsExtensible
                    ? new FrameworkTypeExpression(EnumType.ValueType.FrameworkType, Untyped.Invoke(name))
                    : new FrameworkTypeExpression(EnumType.ValueType.FrameworkType, new InvokeStaticMethodExpression(EnumType.Type, name, new[] { Untyped }, null, true))
                : EnumType is { IsExtensible: true, IsStringValueType: true }
                    ? Untyped.InvokeToString()
                    : throw new InvalidOperationException($"No conversion available fom {EnumType.Type.Name}");

        public static TypedSnippet ToEnum(EnumType enumType, ValueExpression value)
            => enumType.IsExtensible
                ? new EnumSnippet(enumType, Snippet.New.Instance(enumType.Type, value))
                : new EnumSnippet(enumType, new InvokeStaticMethodExpression(enumType.Type, $"To{enumType.Name}", new[] { value }, null, true));
    }
}
