// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record AssignValueIfNullStatement(ValueExpression To, ValueExpression From) : MethodBodyStatement
    {
        internal override void Write(CodeWriter writer)
        {
            To.Write(writer);
            writer.AppendRaw(" ??= ");
            From.Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
