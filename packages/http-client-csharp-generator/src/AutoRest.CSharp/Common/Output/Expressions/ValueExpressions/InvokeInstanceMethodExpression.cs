// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    // [TODO]: AddConfigureAwaitFalse is needed only in docs. Consider removing.
    internal record InvokeInstanceMethodExpression(ValueExpression? InstanceReference, string MethodName, IReadOnlyList<ValueExpression> Arguments, IReadOnlyList<CSharpType>? TypeArguments, bool CallAsAsync, bool AddConfigureAwaitFalse = true) : ValueExpression
    {
        public InvokeInstanceMethodExpression(ValueExpression? instanceReference, MethodSignature signature, IReadOnlyList<ValueExpression> arguments, bool addConfigureAwaitFalse = true) : this(instanceReference, signature.Name, arguments, signature.GenericArguments, signature.Modifiers.HasFlag(MethodSignatureModifiers.Async), addConfigureAwaitFalse) { }

        public InvokeInstanceMethodExpression(ValueExpression? instanceReference, MethodSignature signature, bool addConfigureAwaitFalse = true) : this(instanceReference, signature, signature.Parameters.Select(p => (ValueExpression)p).ToArray(), addConfigureAwaitFalse) { }

        public MethodBodyStatement ToStatement()
            => new InvokeInstanceMethodStatement(InstanceReference, MethodName, Arguments, CallAsAsync);
    }
}
