// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record InvokeMethodExpression(
        ValueExpression? InstanceReference,
        string? MethodName,
        MethodSignatureBase? MethodSignature,
        IReadOnlyList<ValueExpression> Arguments,
        IReadOnlyList<CSharpType>? TypeArguments,
        bool CallAsAsync,
        bool AddConfigureAwaitFalse = true,
        CSharpType? ExtensionType = null) : ValueExpression
    {
        public InvokeMethodExpression(ValueExpression? instanceReference, string methodName, IReadOnlyList<ValueExpression> arguments) : this(instanceReference, methodName, null, arguments, null, false) { }

        internal override void Write(CodeWriter writer)
        {
            if (ExtensionType is not null)
                writer.UseNamespace(ExtensionType.Namespace);

            writer.AppendRawIf("await ", CallAsAsync);
            if (InstanceReference != null && !ReferenceEquals(InstanceReference, Static()))
            {
                InstanceReference.Write(writer);
                writer.AppendRaw(".");
            }

            writer.AppendRaw(MethodSignature?.Name ?? MethodName ?? throw new InvalidOperationException("Method name is not set"));
            writer.WriteTypeArguments(TypeArguments);
            writer.WriteArguments(Arguments);
            writer.AppendRawIf(".ConfigureAwait(false)", CallAsAsync && AddConfigureAwaitFalse);
        }

        private MethodBodyStatement? _terminated;
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);
    }
}
