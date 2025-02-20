// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record InvokeMethodExpression : ValueExpression
    {
        private InvokeMethodExpression(
            ValueExpression? instanceReference,
            string? methodName,
            MethodSignatureBase? methodSignature,
            IReadOnlyList<ValueExpression> arguments,
            IReadOnlyList<CSharpType>? typeArguments,
            bool callAsAsync,
            bool addConfigureAwaitFalse = true,
            CSharpType? extensionType = null)
        {
            InstanceReference = instanceReference;
            MethodName = methodName;
            MethodSignature = methodSignature;
            Arguments = arguments;
            TypeArguments = typeArguments;
            CallAsAsync = callAsAsync;
            AddConfigureAwaitFalse = addConfigureAwaitFalse;
            ExtensionType = extensionType;
        }

        public CSharpType? ExtensionType { get; init; }

        public bool AddConfigureAwaitFalse { get; init; }

        public bool CallAsAsync { get; init; }

        public IReadOnlyList<CSharpType>? TypeArguments { get; init; }

        public IReadOnlyList<ValueExpression> Arguments { get; init; }

        public MethodSignatureBase? MethodSignature { get; init; }

        public string? MethodName { get; init; }

        public ValueExpression? InstanceReference { get; init; }

        public InvokeMethodExpression(ValueExpression? instanceReference, string methodName, IReadOnlyList<ValueExpression> arguments) : this(instanceReference, methodName, null, arguments, null, false) { }

        public InvokeMethodExpression(ValueExpression? instanceReference, MethodSignatureBase methodSignature, IReadOnlyList<ValueExpression> arguments) : this(instanceReference, null, methodSignature, arguments, null, false) { }

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
