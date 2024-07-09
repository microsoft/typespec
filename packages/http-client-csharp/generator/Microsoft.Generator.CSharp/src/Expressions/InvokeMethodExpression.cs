// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Expressions
{
<<<<<<<< HEAD:packages/http-client-csharp/generator/Microsoft.Generator.CSharp/src/Expressions/InvokeInstanceMethodByNameExpression.cs
    public sealed record InvokeInstanceMethodByNameExpression(ValueExpression? InstanceReference, string MethodName, IReadOnlyList<ValueExpression> Arguments, IReadOnlyList<CSharpType>? TypeArguments, bool CallAsAsync, bool AddConfigureAwaitFalse = true) : ValueExpression
    {
        public InvokeInstanceMethodByNameExpression(ValueExpression? instanceReference, string methodName, IReadOnlyList<ValueExpression> arguments) : this(instanceReference, methodName, arguments, null, false) { }
========
    public sealed record InvokeMethodExpression(
        ValueExpression? InstanceReference,
        string MethodName,
        IReadOnlyList<ValueExpression> Arguments,
        IReadOnlyList<CSharpType>? TypeArguments,
        bool CallAsAsync,
        bool AddConfigureAwaitFalse = true,
        CSharpType? ExtensionType = null) : ValueExpression
    {
        public InvokeMethodExpression(ValueExpression? instanceReference, string methodName, IReadOnlyList<ValueExpression> arguments) : this(instanceReference, methodName, arguments, null, false) { }
>>>>>>>> 82234663e8f5d061e64170bf1dac1384f7dd7cdf:packages/http-client-csharp/generator/Microsoft.Generator.CSharp/src/Expressions/InvokeMethodExpression.cs

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

            writer.AppendRaw(MethodName);
            writer.WriteTypeArguments(TypeArguments);
            writer.WriteArguments(Arguments);
            writer.AppendRawIf(".ConfigureAwait(false)", CallAsAsync && AddConfigureAwaitFalse);
        }

        private MethodBodyStatement? _terminated;
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);
    }
}
