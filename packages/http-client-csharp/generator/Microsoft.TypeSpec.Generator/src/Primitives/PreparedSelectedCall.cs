// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal sealed class PreparedSelectedCall
    {
        internal SourceOccurrenceId Occurrence { get; }
        internal DeclaredCallableContract Contract { get; }
        internal DeclaredArgumentMap Arguments { get; }
        internal PreparedGeneratedMethodDeclaration? GeneratedDeclaration { get; }
        // Native formal types proved from the actual generated signature/group,
        // not an asserted variable or a retained invocation signature.
        internal ImmutableArray<ITypeSymbol> ProvenGeneratedFormalTypes { get; init; }
        internal bool HasProvenNonHandlerGeneratedFormals => GeneratedDeclaration is not null &&
            !ProvenGeneratedFormalTypes.IsDefault && ProvenGeneratedFormalTypes.Length == Contract.Parameters.Length &&
            ProvenGeneratedFormalTypes.All(t => t.SpecialType is SpecialType.System_String or SpecialType.System_Object or
                SpecialType.System_Int32 or SpecialType.System_Boolean or SpecialType.System_Char) &&
            Contract.Parameters.All(p => p.IsInterpolatedStringHandler != true && p.HandlerForwarding.IsEmpty);
        internal PreparedGeneratedCallBinding? GeneratedBinding { get; }
        private readonly Func<bool> _current;
        internal bool IsCurrent => _current() && Arguments.IsCurrent() && (GeneratedBinding?.IsCurrent ?? true);
        internal PreparedSelectedCall(SourceOccurrenceId occurrence, DeclaredCallableContract contract, DeclaredArgumentMap arguments, Func<bool> current,
            PreparedGeneratedMethodDeclaration? generatedDeclaration = null, PreparedGeneratedCallBinding? generatedBinding = null)
        { Occurrence = occurrence; Contract = contract; Arguments = arguments; _current = current; GeneratedDeclaration = generatedDeclaration; GeneratedBinding = generatedBinding; }    }
}
