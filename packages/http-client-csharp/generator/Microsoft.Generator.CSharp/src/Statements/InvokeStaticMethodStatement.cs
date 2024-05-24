// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record InvokeStaticMethodStatement(CSharpType? MethodType, string MethodName, IReadOnlyList<ValueExpression> Arguments, IReadOnlyList<CSharpType>? TypeArguments = null, bool CallAsExtension = false, bool CallAsAsync = false) : MethodBodyStatement
    {
        public InvokeStaticMethodStatement(CSharpType? methodType, string methodName) : this(methodType, methodName, Array.Empty<ValueExpression>()) { }
        public InvokeStaticMethodStatement(CSharpType? methodType, string methodName, ValueExpression arg) : this(methodType, methodName, new[] { arg }) { }
        public InvokeStaticMethodStatement(CSharpType? methodType, string methodName, ValueExpression arg1, ValueExpression arg2) : this(methodType, methodName, new[] { arg1, arg2 }) { }
        public static InvokeStaticMethodStatement Extension(CSharpType? methodType, string methodName, ValueExpression instanceReference) => new(methodType, methodName, new[] { instanceReference }, CallAsExtension: true);
        public static InvokeStaticMethodStatement Extension(CSharpType? methodType, string methodName, ValueExpression instanceReference, ValueExpression arg) => new(methodType, methodName, new[] { instanceReference, arg }, CallAsExtension: true);

        internal override void Write(CodeWriter writer)
        {
            new InvokeStaticMethodExpression(MethodType, MethodName, Arguments, TypeArguments, CallAsExtension, CallAsAsync).Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
