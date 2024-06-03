// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
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
