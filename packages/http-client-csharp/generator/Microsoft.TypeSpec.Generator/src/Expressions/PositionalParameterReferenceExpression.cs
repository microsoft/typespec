// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record PositionalParameterReferenceExpression(string ParameterName, ValueExpression ParameterValue) : ValueExpression
    {
        private readonly ParameterProvider? _parameter;

        internal PositionalParameterReferenceExpression(ParameterProvider parameter) : this(parameter, parameter) { }

        internal PositionalParameterReferenceExpression(ParameterProvider parameter, ValueExpression value) : this(parameter.Name, value)
        {
            _parameter = parameter;
        }

        internal override void Write(CodeWriter writer)
        {
            writer.Append($"{_parameter?.Name ?? ParameterName:I}: ");
            ParameterValue.Write(writer);
        }
    }
}
