// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record EnumExpression(EnumTypeProvider EnumType, ValueExpression Untyped) : TypedValueExpression(EnumType.Type, Untyped)
    {
        public TypedValueExpression ToSerial()
            => EnumType.IsExtensible
                ? new FrameworkTypeExpression(EnumType.ValueType.FrameworkType, Untyped.Invoke(EnumType.SerializationMethodName))
                : new FrameworkTypeExpression(EnumType.ValueType.FrameworkType, new InvokeStaticMethodExpression(EnumType.Type, EnumType.SerializationMethodName, [Untyped], null, true));

        public static TypedValueExpression ToEnum(EnumTypeProvider enumType, ValueExpression value)
            => enumType.IsExtensible
                ? new EnumExpression(enumType, Snippets.New.Instance(enumType.Type, value))
                : new EnumExpression(enumType, new InvokeStaticMethodExpression(enumType.Type, enumType.DeserializationMethodName, [value], null, true));
    }
}
