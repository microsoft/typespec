// Copyright(c) Microsoft Corporation.All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    internal record TypeReference(CSharpType Type) : ValueExpression;
}
