// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Common.Output.Expressions.Statements
{
    internal record InvokeStaticMethodStatement(CSharpType? MethodType, string MethodName, IReadOnlyList<ValueExpression> Arguments, IReadOnlyList<CSharpType>? TypeArguments = null, bool CallAsExtension = false, bool CallAsAsync = false) : MethodBodyStatement
    {
        public InvokeStaticMethodStatement(CSharpType? methodType, string methodName) : this(methodType, methodName, Array.Empty<ValueExpression>()) { }
        public InvokeStaticMethodStatement(CSharpType? methodType, string methodName, ValueExpression arg) : this(methodType, methodName, new[] { arg }) { }
        public InvokeStaticMethodStatement(CSharpType? methodType, string methodName, ValueExpression arg1, ValueExpression arg2) : this(methodType, methodName, new[] { arg1, arg2 }) { }
        public static InvokeStaticMethodStatement Extension(CSharpType? methodType, string methodName, ValueExpression instanceReference) => new(methodType, methodName, new[] { instanceReference }, CallAsExtension: true);
        public static InvokeStaticMethodStatement Extension(CSharpType? methodType, string methodName, ValueExpression instanceReference, ValueExpression arg) => new(methodType, methodName, new[] { instanceReference, arg }, CallAsExtension: true);
    }
}
