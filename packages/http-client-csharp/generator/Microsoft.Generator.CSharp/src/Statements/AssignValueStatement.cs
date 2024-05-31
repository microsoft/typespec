// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record AssignValueStatement(ValueExpression To, ValueExpression From) : MethodBodyStatement
    {
        internal override void Write(CodeWriter writer)
        {
            To.Write(writer);
            writer.AppendRaw(" = ");
            From.Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
