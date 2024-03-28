// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using AutoRest.CSharp.Generation.Writers;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    internal record TypedFuncExpression(IReadOnlyList<CodeWriterDeclaration?> Parameters, TypedValueExpression Inner) : TypedValueExpression(Inner.Type, new FuncExpression(Parameters, Inner));
}
