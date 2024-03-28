// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;

namespace AutoRest.CSharp.Input.Source
{
    internal record ClientSourceInput(INamedTypeSymbol? ParentClientType);
}
