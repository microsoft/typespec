// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions.Statements
{
    internal record IfElseStatement(IfStatement If, MethodBodyStatement? Else) : MethodBodyStatement
    {
        public IfElseStatement(BoolExpression condition, MethodBodyStatement ifStatement, MethodBodyStatement? elseStatement, bool inline = false, bool addBraces = true)
            : this(new IfStatement(condition, inline, addBraces) { ifStatement }, elseStatement) {}
    }
}
