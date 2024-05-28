// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record PositionalParameterReferenceExpression(string ParameterName, ValueExpression ParameterValue) : ValueExpression
    {
        internal PositionalParameterReferenceExpression(Parameter parameter) : this(parameter.Name, parameter) { }

        internal override void Write(CodeWriter writer)
        {
            writer.Append($"{ParameterName}: ");
            ParameterValue.Write(writer);
        }
    }
}
