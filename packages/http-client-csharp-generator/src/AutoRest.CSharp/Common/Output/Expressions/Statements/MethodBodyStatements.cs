// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace AutoRest.CSharp.Common.Output.Expressions.Statements
{
    internal record MethodBodyStatements(IReadOnlyList<MethodBodyStatement> Statements) : MethodBodyStatement;
}
