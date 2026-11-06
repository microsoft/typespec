// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    public sealed record ConstructorInitializer(bool IsBase, IReadOnlyList<ValueExpression> Arguments)
    {
        public bool Equals(ConstructorInitializer? other) => other is not null && IsBase == other.IsBase &&
            System.Collections.Generic.EqualityComparer<IReadOnlyList<ValueExpression>>.Default.Equals(Arguments, other.Arguments);

        public override int GetHashCode() => System.HashCode.Combine(IsBase, Arguments);

        internal ConstructorSignature? TargetConstructorIntent { get; init; }
        internal ConstructorProvider? TargetConstructorProviderIntent { get; init; }
        internal IMethodSymbol? OriginalTargetSymbol { get; init; }
        internal Compilation? OriginalCompilation { get; init; }
        // This is the original loaded source, not a reconstruction from the lossy legacy argument projection.
        internal SyntaxReference? OriginalSource { get; init; }
        private DeclaredArgumentMap? _declaredArguments;
        internal DeclaredArgumentMap? CachedDeclaredArguments => ReferenceEquals(_declaredArguments?.Producer, this) ? _declaredArguments : null;

        internal DeclaredArgumentMap CaptureDeclaredArguments(Compilation compilation)
        {
            var contract = TargetConstructorProviderIntent is { } provider ? DeclaredCallableContract.FromProvider(provider, compilation)
                : TargetConstructorIntent is { } signature ? DeclaredCallableContract.FromSignature(signature, compilation)
                : OriginalTargetSymbol is { } symbol && ReferenceEquals(compilation, OriginalCompilation)
                    ? DeclaredCallableContract.FromSymbol(symbol, compilation)
                    : DeclaredCallableContract.Unavailable("No retained initializer target declaration intent.");
            _declaredArguments = DeclaredArgumentMap.ForInitializer(this, contract);
            return _declaredArguments;
        }

        public ConstructorInitializer(bool isBase, ConstructorProvider target, ValueExpression[] arguments) : this(isBase, target, (IReadOnlyList<ValueExpression>)arguments) { }
        public ConstructorInitializer(bool isBase, ConstructorSignature target, ValueExpression[] arguments) : this(isBase, target, (IReadOnlyList<ValueExpression>)arguments) { }

        public ConstructorInitializer(bool isBase, ConstructorProvider target, IReadOnlyList<ValueExpression> arguments) : this(isBase, arguments)
        {
            TargetConstructorProviderIntent = target;
        }

        public ConstructorInitializer(bool isBase, ConstructorSignature target, IReadOnlyList<ValueExpression> arguments) : this(isBase, arguments)
        {
            TargetConstructorIntent = target;
        }

        public ConstructorInitializer(bool isBase, IEnumerable<ParameterProvider> arguments) : this(isBase, [.. arguments.Select(p => p.AsVariable())]) { }
    }
}
