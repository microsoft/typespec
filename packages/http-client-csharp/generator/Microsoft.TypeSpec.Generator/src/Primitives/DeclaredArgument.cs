// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal sealed record DeclaredArgument(DeclaredParameterContract Formal, DeclaredArgumentPresence Presence,
        int? EvaluationIndex, ValueExpression? SuppliedExpression, ValueExpression? Value, RefKind Modifier);
}
