// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record CatchExpression(ValueExpression? Exception, MethodBodyStatement Body) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw("catch");
            if (Exception != null)
            {
                writer.AppendRaw(" (");
                Exception.Write(writer);
                writer.AppendRaw(")");
            }
            writer.WriteRawLine("{");
            Body.Write(writer);
            writer.WriteRawLine("}");
        }
    }
}
