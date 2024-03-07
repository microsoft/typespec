// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions.Statements
{
    internal record AssignValueStatement(ValueExpression To, ValueExpression From) : DeclarationStatement;
}
