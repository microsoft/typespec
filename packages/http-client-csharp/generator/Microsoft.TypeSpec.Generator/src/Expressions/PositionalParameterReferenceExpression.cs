// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record PositionalParameterReferenceExpression(string ParameterName, ValueExpression ParameterValue) : ValueExpression
    {
        internal PositionalParameterReferenceExpression(ParameterProvider parameter) : this(parameter.Name, parameter) { }

        internal override void Write(CodeWriter writer)
        {
            writer.Append($"{ParameterName}: ");
            ParameterValue.Write(writer);
        }
    }
}
