// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal sealed record DeclaredAttributeOrigin(AttributeData? SymbolAttribute, IParameterSymbol? Parameter,
        AttributeStatement? ProviderAttribute);
}
