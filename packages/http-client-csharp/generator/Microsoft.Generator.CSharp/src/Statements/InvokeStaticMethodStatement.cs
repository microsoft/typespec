// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class InvokeStaticMethodStatement : MethodBodyStatement
    {
        public CSharpType? MethodType { get; }
        public string MethodName { get; }
        public IReadOnlyList<ValueExpression> Arguments { get; }
        public IReadOnlyList<CSharpType>? TypeArguments { get; }
        public bool CallAsExtension { get; }
        public bool CallAsAsync { get; }

        public InvokeStaticMethodStatement(CSharpType? methodType, string methodName, IReadOnlyList<ValueExpression> arguments, IReadOnlyList<CSharpType>? typeArguments = null, bool callAsExtension = false, bool callAsAsync = false)
        {
            MethodType = methodType;
            MethodName = methodName;
            Arguments = arguments;
            TypeArguments = typeArguments;
            CallAsExtension = callAsExtension;
            CallAsAsync = callAsAsync;
        }

        public InvokeStaticMethodStatement(CSharpType? methodType, string methodName) : this(methodType, methodName, Array.Empty<ValueExpression>()) { }
        public InvokeStaticMethodStatement(CSharpType? methodType, string methodName, ValueExpression arg) : this(methodType, methodName, new[] { arg }) { }
        public InvokeStaticMethodStatement(CSharpType? methodType, string methodName, ValueExpression arg1, ValueExpression arg2) : this(methodType, methodName, new[] { arg1, arg2 }) { }
        public static InvokeStaticMethodStatement Extension(CSharpType? methodType, string methodName, ValueExpression instanceReference) => new(methodType, methodName, new[] { instanceReference }, callAsExtension: true);
        public static InvokeStaticMethodStatement Extension(CSharpType? methodType, string methodName, ValueExpression instanceReference, ValueExpression arg) => new(methodType, methodName, new[] { instanceReference, arg }, callAsExtension: true);

        internal override void Write(CodeWriter writer)
        {
            new InvokeStaticMethodExpression(MethodType, MethodName, Arguments, TypeArguments, CallAsExtension, CallAsAsync).Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
