// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record EnumExpression(EnumTypeProvider EnumType, ValueExpression Untyped) : TypedValueExpression(EnumType.Type, Untyped)
    {
        // TODO -- fix this when methods for enums are ready
        //public TypedValueExpression ToSerial()
        //    => EnumType.SerializationMethodName is {} name
        //        ? EnumType.IsExtensible
        //            ? new FrameworkTypeExpression(EnumType.ValueType.FrameworkType, Untyped.Invoke(name))
        //            : new FrameworkTypeExpression(EnumType.ValueType.FrameworkType, new InvokeStaticMethodExpression(EnumType.Type, name, new[] { Untyped }, null, true))
        //        : EnumType is { IsExtensible: true, IsStringValueType: true }
        //            ? Untyped.InvokeToString()
        //            : throw new InvalidOperationException($"No conversion available fom {EnumType.Type.Name}");

        public static TypedValueExpression ToEnum(EnumTypeProvider enumType, ValueExpression value)
            => enumType.IsExtensible
                ? new EnumExpression(enumType, Snippets.New.Instance(enumType.Type, value))
                : new EnumExpression(enumType, new InvokeStaticMethodExpression(enumType.Type, $"To{enumType.Name}", new[] { value }, null, true));
    }
}
