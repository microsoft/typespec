// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record InvokeInstanceMethodSignatureExpression(ValueExpression? InstanceReference, MethodSignature MethodSignature, IReadOnlyList<ValueExpression> Arguments, IReadOnlyList<CSharpType>? TypeArguments, bool CallAsAsync, bool AddConfigureAwaitFalse = true) : ValueExpression
    {
        public InvokeInstanceMethodSignatureExpression(ValueExpression? instanceReference, MethodSignature methodSignature, IReadOnlyList<ValueExpression> arguments) : this(instanceReference, methodSignature, arguments, null, false) { }

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("await ", CallAsAsync);
            if (InstanceReference != null)
            {
                InstanceReference.Write(writer);
                writer.AppendRaw(".");
            }

            writer.AppendRaw(MethodSignature.Name);
            writer.WriteTypeArguments(TypeArguments);
            writer.WriteArguments(Arguments);
            writer.AppendRawIf(".ConfigureAwait(false)", CallAsAsync && AddConfigureAwaitFalse);
        }

        private MethodBodyStatement? _terminated;
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);
    }
}
