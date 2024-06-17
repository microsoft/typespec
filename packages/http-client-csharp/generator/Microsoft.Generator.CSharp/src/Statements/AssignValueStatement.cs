// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class AssignValueStatement : MethodBodyStatement
    {
        public ValueExpression To { get; }
        public ValueExpression From { get; }

        public AssignValueStatement(ValueExpression to, ValueExpression from)
        {
            To = to;
            From = from;
        }

        internal override void Write(CodeWriter writer)
        {
            To.Write(writer);
            writer.AppendRaw(" = ");
            From.Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
