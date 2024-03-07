// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Common.Output.Expressions.Statements
{
    internal record IfElsePreprocessorDirective(string Condition, MethodBodyStatement If, MethodBodyStatement? Else) : MethodBodyStatement;
}
