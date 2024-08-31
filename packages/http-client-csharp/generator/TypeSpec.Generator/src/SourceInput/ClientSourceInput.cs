// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;

namespace TypeSpec.Generator.SourceInput
{
    internal record ClientSourceInput(INamedTypeSymbol? ParentClientType);
}
