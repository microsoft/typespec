// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record SwitchCaseWhenExpression(ValueExpression Case, BoolExpression Condition) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            Case.Write(writer);
            writer.AppendRaw(" when ");
            Condition.Write(writer);
        }
    }
}
