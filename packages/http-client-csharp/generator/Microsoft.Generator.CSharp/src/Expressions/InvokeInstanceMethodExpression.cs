// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record InvokeInstanceMethodExpression(ValueExpression? InstanceReference, string MethodName, IReadOnlyList<ValueExpression> Arguments, IReadOnlyList<CSharpType>? TypeArguments, bool CallAsAsync, bool AddConfigureAwaitFalse = true) : ValueExpression
    {
        public InvokeInstanceMethodExpression(ValueExpression? instanceReference, string methodName, IReadOnlyList<ValueExpression> arguments) : this(instanceReference, methodName, arguments, null, false) { }

        public InvokeInstanceMethodExpression(ValueExpression? instanceReference, MethodSignature signature, IReadOnlyList<ValueExpression> arguments, bool addConfigureAwaitFalse = true) : this(instanceReference, signature.Name, arguments, signature.GenericArguments, signature.Modifiers.HasFlag(MethodSignatureModifiers.Async), addConfigureAwaitFalse) { }

        public InvokeInstanceMethodExpression(ValueExpression? instanceReference, MethodSignature signature, bool addConfigureAwaitFalse = true) : this(instanceReference, signature, signature.Parameters.Select(p => (ValueExpression)p).ToArray(), addConfigureAwaitFalse) { }

        internal MethodBodyStatement ToStatement()
            => new InvokeInstanceMethodStatement(InstanceReference, MethodName, Arguments, CallAsAsync);

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("await ", CallAsAsync);
            if (InstanceReference != null)
            {
                InstanceReference.Write(writer);
                writer.AppendRaw(".");
            }

            writer.AppendRaw(MethodName);
            writer.WriteTypeArguments(TypeArguments);
            writer.WriteArguments(Arguments);
            writer.AppendRawIf(".ConfigureAwait(false)", CallAsAsync && AddConfigureAwaitFalse);
        }
    }
}
