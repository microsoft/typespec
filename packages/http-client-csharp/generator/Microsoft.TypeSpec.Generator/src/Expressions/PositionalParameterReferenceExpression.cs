// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record PositionalParameterReferenceExpression(string ParameterName, ValueExpression ParameterValue) : ValueExpression
    {
        // Back-compat restores the callee's name after the caller's arguments have been built.
        private readonly ParameterProvider? _parameter;
        private readonly string _parameterName = ParameterName;

        public string ParameterName
        {
            get => _parameter?.Name ?? _parameterName;
            init => _parameterName = value;
        }

        internal PositionalParameterReferenceExpression(ParameterProvider parameter) : this(parameter, parameter) { }

        internal PositionalParameterReferenceExpression(ParameterProvider parameter, ValueExpression value) : this(parameter.Name, value)
        {
            _parameter = parameter;
        }

        internal override void Write(CodeWriter writer)
        {
            writer.Append($"{ParameterName:I}: ");
            ParameterValue.Write(writer);
        }
    }
}
