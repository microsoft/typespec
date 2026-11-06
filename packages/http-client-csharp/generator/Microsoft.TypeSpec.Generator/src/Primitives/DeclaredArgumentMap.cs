// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal enum DeclaredArgumentPresence { Omitted, ExplicitValue, ExplicitNull, ExplicitDefault, ReducedReceiver }

    /// <summary>
    /// A shape/presence map RELATIVE TO A DECLARED CONTRACT. This is not applicability, selection,
    /// conversion, source-observation absence, or source-edit permission. Argument VALUES are opaque
    /// roots here: complete child/source/occurrence/freshness coverage belongs to preparation, not this map.
    /// External raw lists require no concurrent mutation; observed divergence is sticky, unobserved
    /// mutation-and-restoration of such lists is not claimed to be detectable.
    /// </summary>
    internal sealed class DeclaredArgumentMap
    {
        internal DeclaredCallableContract Contract { get; }
        internal ImmutableArray<DeclaredArgument> Parameters { get; private set; } = [];
        internal ImmutableArray<DeclaredArgument> EvaluationOrder { get; private set; } = [];
        internal ImmutableArray<int> ImplicitCallerExpressionInputs { get; private set; } = [];
        internal bool HasImplicitCallerLine { get; private set; }
        internal string? UnavailableReason { get; private set; }
        internal bool IsAvailable => UnavailableReason is null;
        internal object? Producer { get; private set; }
        private readonly IReadOnlyList<ValueExpression> _arguments;
        private ImmutableArray<ValueExpression> _snapshot;
        private ImmutableArray<ArgumentSnapshot> _edges;
        private InvokeMethodExpression? _invocation;
        private long _invocationRevision;
        private ValueExpression? _receiver;
        private ImmutableArray<CSharpType> _typeArguments;
        private ImmutableArray<DeclaredTypeSnapshot> _typeSnapshots;
        private long? _delegateRevision;
        private DeclaredTypeSnapshot? _constructedType;
        private int _stale;

        private DeclaredArgumentMap(DeclaredCallableContract contract, IReadOnlyList<ValueExpression> arguments)
        {
            Contract = contract;
            _arguments = arguments;
        }

        internal static DeclaredArgumentMap Create(DeclaredCallableContract contract, ValueExpression[] arguments, ValueExpression? reducedReceiver = null) =>
            Create(contract, (IReadOnlyList<ValueExpression>)arguments, reducedReceiver);

        internal static DeclaredArgumentMap Create(DeclaredCallableContract contract, IReadOnlyList<ValueExpression> arguments,
            ValueExpression? reducedReceiver = null)
        {
            var result = new DeclaredArgumentMap(contract, arguments);
            if (!contract.IsAvailable || !contract.IsCurrent())
            {
                result.UnavailableReason = contract.UnavailableReason ?? "Stale declaration metadata.";
                return result;
            }
            if (!ContractCollections.TryCopy(arguments, out result._snapshot))
            {
                result.UnavailableReason = "Unowned actual-argument list.";
                return result;
            }
            if (contract.Parameters.Any(p => p.IsParams))
            {
                result.UnavailableReason = "Params expansion versus explicit array form is not certified by this map.";
                return result;
            }
            var mapped = new DeclaredArgument?[contract.Parameters.Length];
            int next = 0;
            if (reducedReceiver is not null)
            {
                if (!contract.IsExtension || mapped.Length == 0 || contract.Parameters[0].RefKind != RefKind.None)
                {
                    result.UnavailableReason = "Unsupported reduced receiver declaration/form.";
                    return result;
                }
                mapped[0] = new(contract.Parameters[0], DeclaredArgumentPresence.ReducedReceiver, -1, reducedReceiver, reducedReceiver, RefKind.None);
                next = 1;
            }
            else if (contract.IsReduced)
            {
                result.UnavailableReason = "A reduced declaration requires its original receiver edge.";
                return result;
            }
            bool outOfPositionName = false;
            var evaluations = ImmutableArray.CreateBuilder<DeclaredArgument>();
            var edges = ImmutableArray.CreateBuilder<ArgumentSnapshot>();
            if (reducedReceiver is not null)
            {
                evaluations.Add(mapped[0]!);
                edges.Add(new(reducedReceiver));
            }
            for (int i = 0; i < result._snapshot.Length; i++)
            {
                var supplied = result._snapshot[i];
                if (supplied is null)
                {
                    result.UnavailableReason = "Missing actual expression object; explicit null requires an expression edge.";
                    return result;
                }
                var value = supplied;
                if (!TryUnwrap(supplied, out var topology))
                {
                    result.UnavailableReason = "Opaque or cyclic scoped argument topology.";
                    return result;
                }
                int ordinal = next;
                if (topology is PositionalParameterReferenceExpression named)
                {
                    ordinal = -1;
                    for (int j = 0; j < contract.Parameters.Length; j++)
                    {
                        if (contract.Parameters[j].Name == named.ParameterName) { ordinal = j; break; }
                    }
                    if (ordinal < 0 || named.ReferencedParameter is { } retained &&
                        !ReferenceEquals(contract.Parameters[ordinal].Provider, retained) &&
                        !(retained.OriginalSymbol is { } original && SymbolEqualityComparer.Default.Equals(original, contract.Parameters[ordinal].Symbol)))
                    {
                        result.UnavailableReason = "Unknown or wrong-owner named formal.";
                        return result;
                    }
                    outOfPositionName |= ordinal != next;
                    value = named.ParameterValue;
                    if (!TryUnwrap(value, out topology))
                    {
                        result.UnavailableReason = "Opaque or cyclic named argument topology.";
                        return result;
                    }
                }
                else if (outOfPositionName)
                {
                    result.UnavailableReason = "Positional argument follows an out-of-position named argument.";
                    return result;
                }
                if (ordinal < 0 || ordinal >= mapped.Length || mapped[ordinal] is not null)
                {
                    result.UnavailableReason = "Duplicate or excess actual argument.";
                    return result;
                }
                RefKind modifier = RefKind.None;
                if (topology is ArgumentExpression argument)
                {
                    if ((argument.IsRef ? 1 : 0) + (argument.IsOut ? 1 : 0) + (argument.IsIn ? 1 : 0) > 1)
                    {
                        result.UnavailableReason = "Invalid argument modifier wrapper.";
                        return result;
                    }
                    modifier = argument.IsRef ? RefKind.Ref : argument.IsOut ? RefKind.Out : argument.IsIn ? RefKind.In : RefKind.None;
                    value = argument.Expression;
                    if (!TryUnwrap(value, out topology))
                    {
                        result.UnavailableReason = "Opaque or cyclic modifier argument topology.";
                        return result;
                    }
                }
                if (topology is PositionalParameterReferenceExpression or ArgumentExpression ||
                    modifier != contract.Parameters[ordinal].RefKind && !(modifier == RefKind.None && contract.Parameters[ordinal].RefKind == RefKind.In))
                {
                    result.UnavailableReason = "Unsupported wrapper topology or mismatched ref modifier.";
                    return result;
                }
                var presence = topology switch
                {
                    KeywordExpression { Keyword: "null", Expression: null } or LiteralExpression { Literal: null } => DeclaredArgumentPresence.ExplicitNull,
                    KeywordExpression { Keyword: "default", Expression: null } => DeclaredArgumentPresence.ExplicitDefault,
                    _ => DeclaredArgumentPresence.ExplicitValue
                };
                var actual = new DeclaredArgument(contract.Parameters[ordinal], presence, i, supplied, value, modifier);
                mapped[ordinal] = actual;
                evaluations.Add(actual);
                edges.Add(new(supplied));
                while (next < mapped.Length && mapped[next] is not null) { next++; }
            }
            for (int i = 0; i < mapped.Length; i++)
            {
                if (mapped[i] is null)
                {
                    if (!contract.Parameters[i].IsOptional)
                    {
                        result.UnavailableReason = "Missing required actual argument.";
                        return result;
                    }
                    mapped[i] = new(contract.Parameters[i], DeclaredArgumentPresence.Omitted, null, null, null, RefKind.None);
                }
            }
            result.Parameters = mapped.Select(p => p!).ToImmutableArray();
            result.EvaluationOrder = evaluations.ToImmutable();
            result._edges = edges.ToImmutable();
            result.ImplicitCallerExpressionInputs = result.Parameters.Where(p => p.Presence == DeclaredArgumentPresence.Omitted)
                .SelectMany(p => p.Formal.CallerExpressionTargets).Where(i => i >= 0 && result.Parameters[i].Presence != DeclaredArgumentPresence.Omitted)
                .Distinct().ToImmutableArray();
            result.HasImplicitCallerLine = result.Parameters.Any(p => p.Presence == DeclaredArgumentPresence.Omitted && p.Formal.HasCallerLineNumber);
            return result;
        }

        internal static DeclaredArgumentMap ForInvocation(InvokeMethodExpression invocation, DeclaredCallableContract contract, Compilation compilation)
        {
            var result = Create(contract, invocation.Arguments, invocation.IsReducedExtensionIntent ? invocation.InstanceReference : null);
            result.Producer = invocation;
            result._invocation = invocation;
            result._invocationRevision = invocation.DeclarationRevision;
            result._receiver = invocation.InstanceReference;
            result._delegateRevision = invocation.DelegateParameterIntent?.DeclarationRevision;
            if (!result.IsAvailable) { return result; }
            var emittedName = invocation.MethodSignature?.Name ?? invocation.MethodName;
            var intendedName = invocation.DelegateParameterIntent?.Name ?? contract.Name;
            if (!ReferenceEquals(contract.Compilation, compilation) || emittedName != intendedName || contract.Kind == DeclaredCallableKind.Constructor ||
                invocation.IsReducedExtensionIntent && (!contract.IsExtension || invocation.InstanceReference is null) ||
                !invocation.IsReducedExtensionIntent && invocation.InstanceReference is not null &&
                    (contract.IsStatic && invocation.InstanceReference is not TypeReferenceExpression || !contract.IsStatic && invocation.InstanceReference is TypeReferenceExpression) ||
                invocation.MethodProviderIntent is { } method && !ReferenceEquals(method.Signature, invocation.MethodSignature))
            {
                result.UnavailableReason = "Mismatched call declaration/compilation intent.";
            }
            if (invocation.TypeArguments is { } arguments)
            {
                if (!ContractCollections.TryCopy(arguments, out result._typeArguments))
                {
                    result.UnavailableReason = "Unowned type-argument list.";
                }
                else
                {
                    var snapshots = ImmutableArray.CreateBuilder<DeclaredTypeSnapshot>();
                    foreach (var argument in result._typeArguments)
                    {
                        if (!DeclaredTypeSnapshot.TryCapture(argument, out var type)) { result.UnavailableReason = "Unsupported type-argument shape."; break; }
                        snapshots.Add(type!);
                    }
                    result._typeSnapshots = snapshots.ToImmutable();
                }
            }
            return result;
        }

        internal static DeclaredArgumentMap ForConstruction(NewInstanceExpression creation, DeclaredCallableContract contract)
        {
            var result = Create(contract, creation.Parameters);
            result.Producer = creation;
            if (!result.IsAvailable) { return result; }
            var signature = creation.ConstructorProviderIntent?.Signature ?? creation.ConstructorIntent;
            if (contract.Kind != DeclaredCallableKind.Constructor || signature is null || !ReferenceEquals(creation.Type, signature.Type) ||
                !DeclaredTypeSnapshot.TryCapture(signature.Type, out result._constructedType))
            {
                result.UnavailableReason = "Missing or mismatched explicit construction target intent.";
            }
            return result;
        }

        internal static DeclaredArgumentMap ForInitializer(ConstructorInitializer initializer, DeclaredCallableContract contract)
        {
            var result = Create(contract, initializer.Arguments);
            result.Producer = initializer;
            if (contract.Kind != DeclaredCallableKind.Constructor || initializer.OriginalSource is not null)
            {
                result.UnavailableReason = "Original source initializer arguments have a lossy legacy projection; correspondence is not certified.";
            }
            return result;
        }

        internal bool IsCurrent()
        {
            if (!IsAvailable || System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
            var current = Contract.IsCurrent() && ContractCollections.SameReferences(_arguments, _snapshot) &&
                _edges.All(e => e.IsCurrent()) && (_constructedType?.IsCurrent() ?? true) &&
                (_invocation is null || _invocation.DeclarationRevision == _invocationRevision &&
                    ReferenceEquals(_invocation.InstanceReference, _receiver) && _invocation.DelegateParameterIntent?.DeclarationRevision == _delegateRevision &&
                    (_invocation.TypeArguments is null && _typeArguments.IsDefault || !_typeArguments.IsDefault &&
                        ContractCollections.SameReferences(_invocation.TypeArguments, _typeArguments) && _typeSnapshots.All(t => t.IsCurrent())));
            if (!current) { System.Threading.Interlocked.Exchange(ref _stale, 1); }
            return current;
        }

        private static bool TryUnwrap(ValueExpression expression, out ValueExpression value)
        {
            var visited = new HashSet<ValueExpression>(ReferenceEqualityComparer.Instance);
            value = expression;
            while (value is ScopedApi wrapper)
            {
                if (!AttributeSnapshot.IsKnownWrapper(wrapper) || !visited.Add(value))
                {
                    return false;
                }
                value = wrapper.Original;
            }
            return true;
        }

        private sealed class ArgumentSnapshot
        {
            private readonly ImmutableArray<(ValueExpression Node, ValueExpression? Child, long Revision,
                string? Name, ParameterProvider? Formal, long? FormalRevision)> _nodes;

            internal ArgumentSnapshot(ValueExpression expression)
            {
                var nodes = ImmutableArray.CreateBuilder<(ValueExpression, ValueExpression?, long, string?, ParameterProvider?, long?)>();
                var visited = new HashSet<ValueExpression>(ReferenceEqualityComparer.Instance);
                while (visited.Add(expression))
                {
                    switch (expression)
                    {
                        case PositionalParameterReferenceExpression named:
                            nodes.Add((named, named.ParameterValue, 0, named.ParameterName, named.ReferencedParameter,
                                named.ReferencedParameter?.DeclarationRevision));
                            expression = named.ParameterValue;
                            continue;
                        case ArgumentExpression argument:
                            nodes.Add((argument, argument.Expression, argument.DeclarationRevision, null, null, null));
                            expression = argument.Expression;
                            continue;
                        case ScopedApi wrapper when AttributeSnapshot.IsKnownWrapper(wrapper):
                            nodes.Add((wrapper, wrapper.Original, wrapper.DeclarationRevision, null, null, null));
                            expression = wrapper.Original;
                            continue;
                        case KeywordExpression keyword:
                            nodes.Add((keyword, keyword.Expression, keyword.DeclarationRevision, keyword.Keyword, null, null));
                            break;
                    }
                    break;
                }
                _nodes = nodes.ToImmutable();
            }

            internal bool IsCurrent() => _nodes.All(node => node.Node switch
            {
                PositionalParameterReferenceExpression named => named.ParameterName == node.Name &&
                    ReferenceEquals(named.ParameterValue, node.Child) && ReferenceEquals(named.ReferencedParameter, node.Formal) &&
                    named.ReferencedParameter?.DeclarationRevision == node.FormalRevision,
                ArgumentExpression argument => argument.DeclarationRevision == node.Revision && ReferenceEquals(argument.Expression, node.Child),
                ScopedApi wrapper => wrapper.DeclarationRevision == node.Revision && ReferenceEquals(wrapper.Original, node.Child),
                KeywordExpression keyword => keyword.DeclarationRevision == node.Revision && keyword.Keyword == node.Name &&
                    ReferenceEquals(keyword.Expression, node.Child),
                _ => false
            });
        }
    }
}
