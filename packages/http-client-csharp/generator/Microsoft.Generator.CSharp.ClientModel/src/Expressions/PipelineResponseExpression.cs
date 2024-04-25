// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal sealed record PipelineResponseExpression(ValueExpression Untyped) : TypedValueExpression<PipelineResponse>(Untyped)
    {
        public BinaryDataExpression Content => new(Property(nameof(PipelineResponse.Content)));

        public StreamExpression ContentStream => new(Property(nameof(PipelineResponse.ContentStream)));
    }
}
