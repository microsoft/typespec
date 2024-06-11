// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Expressions
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
