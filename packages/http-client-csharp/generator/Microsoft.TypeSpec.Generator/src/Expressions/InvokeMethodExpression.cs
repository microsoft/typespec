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
            _instanceReference = instanceReference;
            _methodName = methodName;
            _methodSignature = methodSignature;
            _arguments = arguments;
            _typeArguments = typeArguments;
            _callAsAsync = callAsAsync;
            _addConfigureAwaitFalse = addConfigureAwaitFalse;
            _extensionType = extensionType;
        }

        public CSharpType? ExtensionType
        {
            get => _extensionType;
            init => _extensionType = value;
        }
        private CSharpType? _extensionType;

        public bool AddConfigureAwaitFalse
        {
            get => _addConfigureAwaitFalse;
            init => _addConfigureAwaitFalse = value;
        }
        private bool _addConfigureAwaitFalse;

        public bool CallAsAsync
        {
            get => _callAsAsync;
            init => _callAsAsync = value;
        }
        private bool _callAsAsync;

        public IReadOnlyList<CSharpType>? TypeArguments
        {
            get => _typeArguments;
            init => _typeArguments = value;
        }
        private IReadOnlyList<CSharpType>? _typeArguments;

        public IReadOnlyList<ValueExpression> Arguments
        {
            get => _arguments;
            init => _arguments = value;
        }
        private IReadOnlyList<ValueExpression> _arguments;

        public MethodSignatureBase? MethodSignature
        {
            get => _methodSignature;
            init => _methodSignature = value;
        }
        private MethodSignatureBase? _methodSignature;

        public string? MethodName
        {
            get => _methodName;
            init => _methodName = value;
        }
        private string? _methodName;

        public ValueExpression? InstanceReference
        {
            get => _instanceReference;
            init => _instanceReference = value;
        }
        private ValueExpression? _instanceReference;

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

        public void Update(
            ValueExpression? instanceReference = null,
            string? methodName = null,
            MethodSignatureBase? methodSignature = null,
            IReadOnlyList<ValueExpression>? arguments = null,
            IReadOnlyList<CSharpType>? typeArguments = null,
            bool? callAsAsync = null,
            bool? addConfigureAwaitFalse = null,
            CSharpType? extensionType = null)
        {
            if (instanceReference != null)
            {
                _instanceReference = instanceReference;
            }
            if (methodName != null)
            {
                _methodName = methodName;
            }
            if (methodSignature != null)
            {
                _methodSignature = methodSignature;
            }
            if (arguments != null)
            {
                _arguments = arguments;
            }
            if (typeArguments != null)
            {
                _typeArguments = typeArguments;
            }
            if (callAsAsync != null)
            {
                _callAsAsync = callAsAsync.Value;
            }
            if (addConfigureAwaitFalse != null)
            {
                _addConfigureAwaitFalse = addConfigureAwaitFalse.Value;
            }
            if (extensionType != null)
            {
                _extensionType = extensionType;
            }
        }
    }
}
