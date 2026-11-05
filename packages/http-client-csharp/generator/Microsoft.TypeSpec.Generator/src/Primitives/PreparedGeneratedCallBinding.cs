// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>Tagged native types at one explicit generated call, NOT a declaration contract or method symbol.</summary>
    internal sealed class PreparedGeneratedCallBinding
    {
        internal SourceOccurrenceId Occurrence { get; }
        internal PreparedGeneratedMethodDeclaration Declaration { get; }
        internal ImmutableArray<ITypeSymbol> GenericArguments { get; }
        internal ImmutableArray<ITypeSymbol> FormalTypes { get; }
        internal ITypeSymbol ReturnType { get; }
        private readonly PreparedGeneratedMethodGroup _group;
        private readonly PreparedGeneratedGenericSignature _signature;
        private readonly InvokeMethodExpression _call;
        private readonly IReadOnlyList<CSharpType> _typeArguments;
        private readonly ImmutableArray<CSharpType> _writtenArguments;
        private readonly ImmutableArray<DeclaredTypeSnapshot> _typeSnapshots;
        private readonly Func<bool> _current;
        private int _stale;

        private PreparedGeneratedCallBinding(SourceOccurrenceId occurrence, InvokeMethodExpression call,
            PreparedGeneratedMethodGroup.Candidate candidate, PreparedGeneratedMethodGroup group,
            ImmutableArray<CSharpType> writtenArguments, ImmutableArray<DeclaredTypeSnapshot> snapshots,
            ImmutableArray<ITypeSymbol> genericArguments, ImmutableArray<ITypeSymbol> formals, ITypeSymbol returns, Func<bool> current)
        {
            Occurrence = occurrence; Declaration = candidate.Declaration; _signature = candidate.GenericSignature!; _group = group;
            _call = call; _typeArguments = call.TypeArguments!; _writtenArguments = writtenArguments; _typeSnapshots = snapshots;
            GenericArguments = genericArguments; FormalTypes = formals; ReturnType = returns; _current = current;
        }

        // genericArguments must be the result of the existing
        // TryResolveExplicitTypeArguments on this occurrence's actual syntax.
        internal static PreparedGeneratedCallBinding? TryCapture(SourceOccurrenceId occurrence, InvokeMethodExpression call,
            PreparedGeneratedMethodGroup.Candidate candidate, PreparedGeneratedMethodGroup group,
            ImmutableArray<CSharpType> writtenArguments, ImmutableArray<ITypeSymbol> genericArguments, Func<bool> current)
        {
            if (candidate.GenericSignature is not { } signature || call.TypeArguments is null || writtenArguments.IsDefault ||
                writtenArguments.Length != 1 || genericArguments.IsDefault || genericArguments.Length != writtenArguments.Length ||
                !group.Candidates.Any(c => ReferenceEquals(c, candidate)) || !candidate.Declaration.IsCurrent ||
                candidate.Declaration.Contract.DeclarationSymbol is not null || candidate.Declaration.Contract.Arity != 1 ||
                !ContractCollections.SameReferences(call.TypeArguments, writtenArguments) ||
                !signature.TryBind(genericArguments, out var formals, out var returns) || returns is null) { return null; }
            var snapshots = ImmutableArray.CreateBuilder<DeclaredTypeSnapshot>();
            foreach (var type in writtenArguments)
            {
                if (!DeclaredTypeSnapshot.TryCapture(type, out var snapshot)) { return null; }
                snapshots.Add(snapshot!);
            }
            var binding = new PreparedGeneratedCallBinding(occurrence, call, candidate, group, writtenArguments, snapshots.ToImmutable(),
                genericArguments, formals, returns, current);
            return binding.IsCurrent ? binding : null;
        }

        internal bool IsCurrent
        {
            get
            {
                if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                // No cycle: the group/declaration know only definition snapshots,
                // never this call binding or its occurrence/currentness callback.
                if (_current() && _group.IsCurrent && Declaration.IsCurrent && _signature.IsCurrent &&
                    ReferenceEquals(_call.TypeArguments, _typeArguments) && ContractCollections.SameReferences(_typeArguments, _writtenArguments) &&
                    _typeSnapshots.All(t => t.IsCurrent())) { return true; }
                System.Threading.Interlocked.Exchange(ref _stale, 1);
                return false;
            }
        }
    }
}
