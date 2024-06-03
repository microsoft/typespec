// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record InvokeInstanceMethodStatement(ValueExpression? InstanceReference, string MethodName, IReadOnlyList<ValueExpression> Arguments, bool CallAsAsync) : MethodBodyStatement
    {
        public InvokeInstanceMethodStatement(ValueExpression? instance, string methodName) : this(instance, methodName, Array.Empty<ValueExpression>(), false) { }
        public InvokeInstanceMethodStatement(ValueExpression? instance, string methodName, ValueExpression arg) : this(instance, methodName, new[] { arg }, false) { }
        public InvokeInstanceMethodStatement(ValueExpression? instance, string methodName, ValueExpression arg1, ValueExpression arg2) : this(instance, methodName, new[] { arg1, arg2 }, false) { }
        public InvokeInstanceMethodStatement(ValueExpression? instance, string methodName, IReadOnlyList<ValueExpression> arguments) : this(instance, methodName, arguments, false) { }

        internal override void Write(CodeWriter writer)
        {
            new InvokeInstanceMethodExpression(InstanceReference, MethodName, Arguments, null, CallAsAsync).Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
