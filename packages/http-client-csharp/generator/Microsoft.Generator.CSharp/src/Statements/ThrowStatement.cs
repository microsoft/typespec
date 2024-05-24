// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record ThrowStatement(ValueExpression ThrowExpression) : MethodBodyStatement
    {
        internal override void Write(CodeWriter writer)
        {
            ThrowExpression.Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
