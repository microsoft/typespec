// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class YieldReturnStatement : MethodBodyStatement
    {
        public ValueExpression Value { get; }

        public YieldReturnStatement(ValueExpression value)
        {
            Value = value;
        }

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw($"yield return ");
            Value.Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
