// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    internal record InvokeStaticMethodExpression(CSharpType? MethodType, string MethodName, IReadOnlyList<ValueExpression> Arguments, IReadOnlyList<CSharpType>? TypeArguments = null, bool CallAsExtension = false, bool CallAsAsync = false) : ValueExpression
    {
        public static InvokeStaticMethodExpression Extension(CSharpType? methodType, string methodName, ValueExpression instanceReference) => new(methodType, methodName, new[] { instanceReference }, CallAsExtension: true);
        public static InvokeStaticMethodExpression Extension(CSharpType? methodType, string methodName, ValueExpression instanceReference, ValueExpression arg) => new(methodType, methodName, new[] { instanceReference, arg }, CallAsExtension: true);
        public static InvokeStaticMethodExpression Extension(CSharpType? methodType, string methodName, ValueExpression instanceReference, IReadOnlyList<ValueExpression> arguments)
            => new(methodType, methodName, arguments.Prepend(instanceReference).ToArray(), CallAsExtension: true);

        public MethodBodyStatement ToStatement()
            => new InvokeStaticMethodStatement(MethodType, MethodName, Arguments, TypeArguments, CallAsExtension, CallAsAsync);
    }
}
