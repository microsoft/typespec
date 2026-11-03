// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record InvokeMethodExpression : ValueExpression
    {
        public bool Equals(InvokeMethodExpression? other) => other is not null && base.Equals(other) &&
            System.Collections.Generic.EqualityComparer<CSharpType?>.Default.Equals(ExtensionType, other.ExtensionType) &&
            AddConfigureAwaitFalse == other.AddConfigureAwaitFalse && CallAsAsync == other.CallAsAsync &&
            System.Collections.Generic.EqualityComparer<IReadOnlyList<CSharpType>?>.Default.Equals(TypeArguments, other.TypeArguments) &&
            System.Collections.Generic.EqualityComparer<IReadOnlyList<ValueExpression>>.Default.Equals(Arguments, other.Arguments) &&
            System.Collections.Generic.EqualityComparer<MethodSignatureBase?>.Default.Equals(MethodSignature, other.MethodSignature) &&
            MethodName == other.MethodName && System.Collections.Generic.EqualityComparer<ValueExpression?>.Default.Equals(InstanceReference, other.InstanceReference) &&
            System.Collections.Generic.EqualityComparer<MethodBodyStatement?>.Default.Equals(_terminated, other._terminated);

        public override int GetHashCode()
        {
            var hash = new System.HashCode();
            hash.Add(base.GetHashCode());
            hash.Add(ExtensionType);
            hash.Add(AddConfigureAwaitFalse);
            hash.Add(CallAsAsync);
            hash.Add(TypeArguments);
            hash.Add(Arguments);
            hash.Add(MethodSignature);
            hash.Add(MethodName);
            hash.Add(InstanceReference);
            hash.Add(_terminated);
            return hash.ToHashCode();
        }

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

        private long _declarationRevision;
        internal long DeclarationRevision => System.Threading.Volatile.Read(ref _declarationRevision);
        private void TouchDeclaration() => System.Threading.Interlocked.Increment(ref _declarationRevision);
        internal MethodProvider? MethodProviderIntent { get; private init; }
        internal ParameterProvider? DelegateParameterIntent { get; init; }
        internal DeclaredCallableContract? DeclaredContractIntent { get; private init; }
        internal bool IsReducedExtensionIntent { get; private init; }
        private DeclaredArgumentMap? _declaredArguments;
        internal DeclaredArgumentMap? CachedDeclaredArguments => ReferenceEquals(_declaredArguments?.Producer, this) ? _declaredArguments : null;

        internal static InvokeMethodExpression FromDeclaredContract(ValueExpression? receiver, DeclaredCallableContract contract, ValueExpression[] arguments) =>
            FromDeclaredContract(receiver, contract, (IReadOnlyList<ValueExpression>)arguments);

        internal static InvokeMethodExpression FromDeclaredContract(ValueExpression? receiver, DeclaredCallableContract contract, IReadOnlyList<ValueExpression> arguments) =>
            new(receiver, contract.Name, arguments) { DeclaredContractIntent = contract, IsReducedExtensionIntent = contract.IsReduced };

        internal static InvokeMethodExpression FromReducedDeclaration(ValueExpression receiver, MethodProvider extension, ValueExpression[] arguments) =>
            FromReducedDeclaration(receiver, extension, (IReadOnlyList<ValueExpression>)arguments);

        internal static InvokeMethodExpression FromReducedDeclaration(ValueExpression receiver, MethodProvider extension, IReadOnlyList<ValueExpression> arguments) =>
            new(receiver, extension, arguments) { IsReducedExtensionIntent = true, ExtensionType = extension.EnclosingType.CachedType };

        internal DeclaredArgumentMap CaptureDeclaredArguments(Compilation compilation)
        {
            var contract = DeclaredContractIntent ?? (MethodProviderIntent is { } method
                ? DeclaredCallableContract.FromProvider(method, compilation)
                : MethodSignature is { } signature ? DeclaredCallableContract.FromSignature(signature, compilation)
                : DelegateParameterIntent is { OriginalSymbol.Type: INamedTypeSymbol { DelegateInvokeMethod: { } invoke }, OriginalCompilation: { } original } parameter &&
                    ReferenceEquals(original, compilation) && parameter.DeclarationRevision == parameter.OriginalDeclarationRevision && parameter.OriginalTypeSnapshot?.IsCurrent() == true && MethodName == parameter.Name
                    ? DeclaredCallableContract.FromSymbol(invoke, compilation)
                    : DeclaredCallableContract.Unavailable("No retained declared callable identity."));
            _declaredArguments = DeclaredArgumentMap.ForInvocation(this, contract, compilation);
            return _declaredArguments;
        }

        public CSharpType? ExtensionType
        {
            get => _extensionType;
            internal set { TouchDeclaration(); _extensionType = value; }
        }
        private CSharpType? _extensionType;

        public bool AddConfigureAwaitFalse
        {
            get => _addConfigureAwaitFalse;
            internal set { TouchDeclaration(); _addConfigureAwaitFalse = value; }
        }
        private bool _addConfigureAwaitFalse;

        public bool CallAsAsync
        {
            get => _callAsAsync;
            internal set { TouchDeclaration(); _callAsAsync = value; }
        }
        private bool _callAsAsync;

        public IReadOnlyList<CSharpType>? TypeArguments
        {
            get => _typeArguments;
            internal set { TouchDeclaration(); _typeArguments = value; }
        }
        private IReadOnlyList<CSharpType>? _typeArguments;

        public IReadOnlyList<ValueExpression> Arguments
        {
            get => _arguments;
            internal set { TouchDeclaration(); _arguments = value; }
        }
        private IReadOnlyList<ValueExpression> _arguments;

        public MethodSignatureBase? MethodSignature
        {
            get => _methodSignature;
            internal set { TouchDeclaration(); _methodSignature = value; }
        }
        private MethodSignatureBase? _methodSignature;

        public string? MethodName
        {
            get => _methodName;
            internal set { TouchDeclaration(); _methodName = value; }
        }
        private string? _methodName;

        public ValueExpression? InstanceReference
        {
            get => _instanceReference;
            internal set { TouchDeclaration(); _instanceReference = value; }
        }
        private ValueExpression? _instanceReference;

        public InvokeMethodExpression(ValueExpression? instanceReference, string methodName, ValueExpression[] arguments)
            : this(instanceReference, methodName, (IReadOnlyList<ValueExpression>)arguments) { }
        public InvokeMethodExpression(ValueExpression? instanceReference, MethodSignatureBase methodSignature, ValueExpression[] arguments)
            : this(instanceReference, methodSignature, (IReadOnlyList<ValueExpression>)arguments) { }

        public InvokeMethodExpression(ValueExpression? instanceReference, string methodName, IReadOnlyList<ValueExpression> arguments) : this(instanceReference, methodName, null, arguments, null, false) { }

        public InvokeMethodExpression(ValueExpression? instanceReference, MethodSignatureBase methodSignature, IReadOnlyList<ValueExpression> arguments) : this(instanceReference, null, methodSignature, arguments, null, false) { }

        public InvokeMethodExpression(ValueExpression? instanceReference, MethodProvider method, IReadOnlyList<ValueExpression> arguments)
            : this(instanceReference, method.Signature, arguments)
        {
            MethodProviderIntent = method;
        }

        internal override void WriteCore(CodeWriter writer)
        {
            if (ExtensionType is not null)
            {
                writer.UseNamespace(ExtensionType.Namespace);
            }

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

        internal override ValueExpression? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var updated = visitor.VisitInvokeMethodExpression(this, method);
            if (updated is not InvokeMethodExpression invokeMethod)
            {
                return updated?.Accept(visitor, method);
            }
            var newInstanceReference = invokeMethod.InstanceReference?.Accept(visitor, method);

            var arguments = new List<ValueExpression>(invokeMethod.Arguments.Count);
            foreach (var argument in invokeMethod.Arguments)
            {
                var updatedArgument = argument.Accept(visitor, method);
                if (updatedArgument != null)
                {
                    arguments.Add(updatedArgument);
                }
            }

            invokeMethod.InstanceReference = newInstanceReference;
            invokeMethod.Arguments = arguments;
            invokeMethod.MethodName = invokeMethod.MethodName;
            invokeMethod.MethodSignature = invokeMethod.MethodSignature;
            invokeMethod.TypeArguments = invokeMethod.TypeArguments;
            invokeMethod.CallAsAsync = invokeMethod.CallAsAsync;
            invokeMethod.AddConfigureAwaitFalse = invokeMethod.AddConfigureAwaitFalse;
            invokeMethod.ExtensionType = invokeMethod.ExtensionType;

            return invokeMethod;
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
            TouchDeclaration();
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
