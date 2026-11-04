// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal sealed class PreparedSelectedCall
    {
        internal SourceOccurrenceId Occurrence { get; }
        internal DeclaredCallableContract Contract { get; }
        internal DeclaredArgumentMap Arguments { get; }
        internal PreparedGeneratedMethodDeclaration? GeneratedDeclaration { get; }
        private readonly Func<bool> _current;
        internal bool IsCurrent => _current() && Arguments.IsCurrent();
        internal PreparedSelectedCall(SourceOccurrenceId occurrence, DeclaredCallableContract contract, DeclaredArgumentMap arguments, Func<bool> current,
            PreparedGeneratedMethodDeclaration? generatedDeclaration = null)
        { Occurrence = occurrence; Contract = contract; Arguments = arguments; _current = current; GeneratedDeclaration = generatedDeclaration; }
    }
}
