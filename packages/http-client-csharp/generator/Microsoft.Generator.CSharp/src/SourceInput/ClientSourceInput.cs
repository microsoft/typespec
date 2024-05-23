// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;

namespace Microsoft.Generator.CSharp
{
    internal record ClientSourceInput(INamedTypeSymbol? ParentClientType);
}
