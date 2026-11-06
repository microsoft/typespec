// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal sealed record DeclaredParameterContract(int Ordinal, string Name, IParameterSymbol? Symbol,
        ParameterProvider? Provider, ITypeSymbol? SymbolType, DeclaredTypeSnapshot? ProviderType,
        RefKind RefKind, bool IsOptional, bool IsParams, ImmutableArray<DeclaredAttributeOrigin> Attributes,
        ImmutableArray<int> CallerExpressionTargets, bool HasCallerLineNumber,
        ImmutableArray<int> HandlerForwarding, bool? IsInterpolatedStringHandler,
        bool? HasExplicitDefaultValue, object? ExplicitDefaultValue, ValueExpression? ProviderDefaultValue);
}
