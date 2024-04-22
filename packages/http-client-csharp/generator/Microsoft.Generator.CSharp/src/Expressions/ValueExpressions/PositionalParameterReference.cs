// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record PositionalParameterReference(string ParameterName, ValueExpression ParameterValue) : ValueExpression
    {
        internal PositionalParameterReference(Parameter parameter) : this(parameter.Name, parameter) { }

        public override void Write(CodeWriter writer)
        {
            writer.Append($"{ParameterName}: ");
            ParameterValue.Write(writer);
        }
    }
}
