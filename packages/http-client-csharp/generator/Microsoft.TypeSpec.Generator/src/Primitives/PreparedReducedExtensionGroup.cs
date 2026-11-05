// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Immutable;
using Microsoft.CodeAnalysis;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal sealed record PreparedReducedExtensionGroup(ImmutableArray<IMethodSymbol> Candidates,
        ImmutableHashSet<string> VisibleNamespaces, Func<bool> Current);
}
