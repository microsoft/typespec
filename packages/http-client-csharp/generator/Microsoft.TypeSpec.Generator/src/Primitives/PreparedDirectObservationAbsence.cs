// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Immutable;
using Microsoft.CodeAnalysis;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal sealed class PreparedDirectObservationAbsence
    {
        internal SourceOccurrenceId Occurrence { get; }
        internal ImmutableArray<IMethodSymbol> Candidates { get; }
        internal IMethodSymbol? ApplicabilityWitness { get; }
        internal ImmutableArray<PreparedGeneratedMethodDeclaration> GeneratedCandidates { get; } = [];
        internal PreparedGeneratedMethodDeclaration? GeneratedApplicabilityWitness { get; }
        private readonly Func<bool> _current;
        internal bool IsCurrent => _current();
        internal PreparedDirectObservationAbsence(SourceOccurrenceId occurrence, ImmutableArray<IMethodSymbol> candidates, IMethodSymbol witness, Func<bool> current)
        { Occurrence = occurrence; Candidates = candidates; ApplicabilityWitness = witness; _current = current; }
        internal PreparedDirectObservationAbsence(SourceOccurrenceId occurrence, ImmutableArray<PreparedGeneratedMethodDeclaration> candidates,
            PreparedGeneratedMethodDeclaration witness, Func<bool> current)
        { Occurrence = occurrence; Candidates = []; GeneratedCandidates = candidates; GeneratedApplicabilityWitness = witness; _current = current; }
    }
}
