// Copyright(c) Microsoft Corporation.All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    internal record PositionalParameterReference(string ParameterName, ValueExpression ParameterValue) : ValueExpression
    {
        public PositionalParameterReference(Parameter parameter) : this(parameter.Name, parameter) { }
    }
}
