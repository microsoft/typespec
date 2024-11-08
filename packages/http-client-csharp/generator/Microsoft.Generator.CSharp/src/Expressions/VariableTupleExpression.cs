// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public record VariableTupleExpression(bool IsRef = false, params VariableExpression[] Variables) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("ref ", IsRef);
            writer.AppendRaw("(");
            for (int i = 0; i < Variables.Length; i++)
            {
                var variable = Variables[i];
                writer.Append($"{variable.Type} {variable.Declaration}");
                if (i < Variables.Length - 1)
                {
                    writer.AppendRaw(", ");
                }
            }
            writer.AppendRaw(")");
        }
    }
}
