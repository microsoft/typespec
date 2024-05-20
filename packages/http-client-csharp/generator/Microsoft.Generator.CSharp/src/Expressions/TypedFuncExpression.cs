﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record TypedFuncExpression(IReadOnlyList<CodeWriterDeclaration?> Parameters, TypedValueExpression Inner) : TypedValueExpression(Inner.Type, new FuncExpression(Parameters, Inner));
}
