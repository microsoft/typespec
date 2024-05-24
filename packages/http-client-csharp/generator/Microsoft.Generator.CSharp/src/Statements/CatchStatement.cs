// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record CatchStatement(ValueExpression? Exception, MethodBodyStatement Body)
    {
        internal void Write(CodeWriter writer)
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
