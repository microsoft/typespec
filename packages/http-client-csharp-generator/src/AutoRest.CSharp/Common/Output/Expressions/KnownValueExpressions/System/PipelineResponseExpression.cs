// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.System
{
    internal sealed record PipelineResponseExpression(ValueExpression Untyped) : TypedValueExpression<PipelineResponse>(Untyped)
    {
        public BinaryDataExpression Content => new(Property(nameof(PipelineResponse.Content)));

        public StreamExpression ContentStream => new(Property(nameof(PipelineResponse.ContentStream)));
    }
}
