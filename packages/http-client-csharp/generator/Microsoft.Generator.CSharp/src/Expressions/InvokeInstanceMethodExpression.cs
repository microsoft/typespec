// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record InvokeInstanceMethodExpression(
        ValueExpression? InstanceReference,
        string MethodName,
        IReadOnlyList<ValueExpression> Arguments,
        IReadOnlyList<CSharpType>? TypeArguments,
        bool CallAsAsync,
        bool AddConfigureAwaitFalse = true,
        CSharpType? ExtensionType = null) : ValueExpression
    {
        public InvokeInstanceMethodExpression(ValueExpression? instanceReference, string methodName, IReadOnlyList<ValueExpression> arguments) : this(instanceReference, methodName, arguments, null, false) { }

        internal override void Write(CodeWriter writer)
        {
            if (ExtensionType is not null)
                writer.UseNamespace(ExtensionType.Namespace);

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

        private MethodBodyStatement? _terminated;
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);
    }
}
