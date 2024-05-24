// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record SwitchCaseWhenExpression(ValueExpression Case, BoolSnippet Condition) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            Case.Write(writer);
            writer.AppendRaw(" when ");
            Condition.Untyped.Write(writer);
        }
    }
}
