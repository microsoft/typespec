// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record EnumExpression(EnumTypeProvider EnumType, ValueExpression Untyped) : TypedValueExpression(EnumType.Type, Untyped)
    {
        // TODO -- we need to rethink how to implement this because this involves the serialization and deserialization of enums, and now this is extendable by plugin writers. Tracking https://github.com/microsoft/typespec/issues/3420
        public TypedValueExpression ToSerial()
        {
            throw new NotImplementedException();
            //return EnumType.IsExtensible
            //            ? new FrameworkTypeExpression(EnumType.ValueType.FrameworkType, Untyped.Invoke(EnumType.SerializationMethodName))
            //            : new FrameworkTypeExpression(EnumType.ValueType.FrameworkType, new InvokeStaticMethodExpression(EnumType.Type, EnumType.SerializationMethodName, [Untyped], null, true));
        }

        public static TypedValueExpression ToEnum(EnumTypeProvider enumType, ValueExpression value)
        {
            throw new NotImplementedException();
            //return enumType.IsExtensible
            //            ? new EnumExpression(enumType, Snippets.New.Instance(enumType.Type, value))
            //            : new EnumExpression(enumType, new InvokeStaticMethodExpression(enumType.Type, enumType.DeserializationMethodName, [value], null, true));
        }
    }
}
