// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>One canonical written method type parameter, never a CLR method identity.</summary>
    internal sealed class PreparedGeneratedGenericSignature
    {
        internal CSharpType Parameter { get; }
        internal string EmittedName { get; }
        private readonly MethodProvider _method;
        private readonly MethodSignature _signature;
        private readonly long _methodRevision;
        private readonly long _signatureRevision;
        private readonly IReadOnlyList<CSharpType> _arguments;
        private readonly ImmutableArray<CSharpType> _argumentSnapshot;
        private readonly ImmutableArray<DeclaredTypeSnapshot> _types;
        private readonly ImmutableArray<ITypeSymbol?> _formalSlots;
        private readonly ITypeSymbol? _returnSlot;
        private readonly ValueExpression _body;
        private readonly StructuredSourceShape _bodyShape;
        private readonly StructuredSourceShape _signatureShape;
        private int _stale;

        private PreparedGeneratedGenericSignature(MethodProvider method, ImmutableArray<CSharpType> arguments,
            ImmutableArray<DeclaredTypeSnapshot> types, ImmutableArray<ITypeSymbol?> formalSlots, ITypeSymbol? returnSlot, ValueExpression body)
        {
            _method = method; _signature = method.Signature; _methodRevision = method.DeclarationRevision;
            _signatureRevision = _signature.DeclarationRevision; _arguments = _signature.GenericArguments!; _argumentSnapshot = arguments;
            Parameter = arguments[0]; EmittedName = Parameter.FrameworkType.Name; _types = types;
            _formalSlots = formalSlots; _returnSlot = returnSlot; _body = body;
            _bodyShape = StructuredSourceShape.Capture(body, true); _signatureShape = StructuredSourceShape.Capture(_signature, true);
        }

        internal static PreparedGeneratedGenericSignature? TryCapture(MethodProvider method, CSharpCompilation compilation)
        {
            var signature = method.Signature;
            // Public/static variable bodies, or a private/instance canonical
            // typeof(T) body: arity one, unconstrained, expression-only. Private
            // access is a separate occurrence proof. The group audits the full
            // owner/header, all declarations and the actual written body grammar.
            // Body shape is captured for currentness, never used to infer T.
            if (signature.OriginalSymbol is not null ||
                signature.Modifiers != (MethodSignatureModifiers.Public | MethodSignatureModifiers.Static) &&
                    signature.Modifiers != MethodSignatureModifiers.Private ||
                signature.GenericParameterConstraints is not null || signature.GenericArguments is not { } list ||
                !ContractCollections.TryCopy(list, out var arguments) || arguments.Length != 1 ||
                !IsPureParameterSpelling(arguments[0]) || !ContractCollections.TryCopy(signature.Parameters, out var parameters) ||
                signature.ReturnType is null || method.BodyStatements is not null ||
                method.BodyExpression is not { } body) { return null; }
            var parameter = arguments[0];
            var emittedName = parameter.FrameworkType.Name;
            if (parameters.Any(p => p is null || p.Name == emittedName) || signature.Name == emittedName ||
                method.EnclosingType.CachedType?.Name == emittedName) { return null; }
            var types = ImmutableArray.CreateBuilder<DeclaredTypeSnapshot>();
            if (!DeclaredTypeSnapshot.TryCapture(parameter, out var parameterSnapshot)) { return null; }
            types.Add(parameterSnapshot!);
            var formals = ImmutableArray.CreateBuilder<ITypeSymbol?>();
            foreach (var formal in parameters)
            {
                var scalar = PreparedGeneratedMethodGroup.ScalarType(formal.Type, compilation);
                if (scalar is null && !ReferenceEquals(formal.Type, parameter) ||
                    !DeclaredTypeSnapshot.TryCapture(formal.Type, out var snapshot)) { return null; }
                formals.Add(scalar); types.Add(snapshot!);
            }
            var returns = PreparedGeneratedMethodGroup.ScalarType(signature.ReturnType, compilation);
            if (returns is null && !ReferenceEquals(signature.ReturnType, parameter) ||
                !DeclaredTypeSnapshot.TryCapture(signature.ReturnType, out var returnSnapshot)) { return null; }
            types.Add(returnSnapshot!);
            if (!HasSupportedBody(body, parameter, parameters.Length, returns) ||
                signature.Modifiers == MethodSignatureModifiers.Private && body.GetType() != typeof(TypeOfExpression)) { return null; }
            return new(method, arguments, types.ToImmutable(), formals.ToImmutable(), returns, body);
        }

        // Definition-body evidence only: typeof(T) must use the exact canonical
        // object in the actual written GenericArguments list, not a similarly
        // named CLR parameter or an inferred semantic owner. The declared object
        // return is a scalar slot; this body never supplies a type argument.
        // This does not grant private access or certify a containing call scope.
        private static bool HasSupportedBody(ValueExpression body, CSharpType parameter, int parameterCount, ITypeSymbol? returns) =>
            body.GetType() == typeof(VariableExpression) ||
            body.GetType() == typeof(TypeOfExpression) && body is TypeOfExpression typeOf &&
                ReferenceEquals(typeOf.Type, parameter) && parameterCount == 0 &&
                returns?.SpecialType == SpecialType.System_Object;

        internal bool HasTypeOfParameterBody => _body.GetType() == typeof(TypeOfExpression) &&
            HasSupportedBody(_body, Parameter, _formalSlots.Length, _returnSlot);

        // RuntimeType is ONLY an audited formatting descriptor. In particular
        // its CLR declaring Template<T> and CLR constraints are not generated
        // method ownership or constraint evidence. Ownership is reference identity
        // in this method's actual written GenericArguments list.
        internal static bool IsPureParameterSpelling(CSharpType type) => type is not null && type.GetType() == typeof(CSharpType) &&
            type.IsFrameworkType && type.FrameworkType.GetType() == typeof(object).GetType() &&
            type.FrameworkType.IsGenericParameter && !type.IsNullable && !type.IsValueType &&
            !type.IsLiteral && !type.HasUnionMetadata && type.DeclaringType is null &&
            ContractCollections.TryCopy(type.Arguments, out var arguments) && arguments.IsEmpty &&
            type.Name == type.FrameworkType.Name && type.Namespace == (type.FrameworkType.Namespace ?? string.Empty) &&
            Identifier(type.FrameworkType.Name);

        private static bool Identifier(string name) => name.Length > 0 && (name[0] == '_' || char.IsAsciiLetter(name[0])) &&
            name.All(c => c == '_' || char.IsAsciiLetterOrDigit(c)) && SyntaxFacts.IsValidIdentifier(name) && SyntaxFacts.GetKeywordKind(name) == SyntaxKind.None;

        internal bool Owns(CSharpType type) => ReferenceEquals(type, Parameter);

        internal bool TryBind(ImmutableArray<ITypeSymbol> arguments, out ImmutableArray<ITypeSymbol> formals, out ITypeSymbol? returns)
        {
            formals = default; returns = null;
            if (arguments.IsDefault || arguments.Length != 1 || !IsCurrent) { return false; }
            // Null slots mean the ENTIRE canonical T, not a nested occurrence.
            // Arguments already came from the existing explicit metadata resolver.
            formals = _formalSlots.Select(t => t ?? arguments[0]).ToImmutableArray();
            returns = _returnSlot ?? arguments[0];
            return true;
        }

        internal bool IsCurrent
        {
            get
            {
                if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                if (_method.DeclarationRevision == _methodRevision && ReferenceEquals(_method.Signature, _signature) &&
                    _signature.DeclarationRevision == _signatureRevision && _signature.GenericParameterConstraints is null &&
                    ReferenceEquals(_signature.GenericArguments, _arguments) && ContractCollections.SameReferences(_arguments, _argumentSnapshot) &&
                    _types.All(t => t.IsCurrent()) && IsPureParameterSpelling(Parameter) && Parameter.FrameworkType.Name == EmittedName &&
                    _method.BodyStatements is null && ReferenceEquals(_method.BodyExpression, _body) &&
                    HasSupportedBody(_body, Parameter, _formalSlots.Length, _returnSlot) &&
                    _bodyShape.Matches(StructuredSourceShape.Capture(_body, true)) &&
                    _signatureShape.Matches(StructuredSourceShape.Capture(_signature, true))) { return true; }
                System.Threading.Interlocked.Exchange(ref _stale, 1);
                return false;
            }
        }
    }
}
