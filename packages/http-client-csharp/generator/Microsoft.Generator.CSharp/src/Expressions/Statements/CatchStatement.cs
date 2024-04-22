// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record CatchStatement(ValueExpression? Exception, MethodBodyStatement Body)
    {
        public void Write(CodeWriter writer)
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
