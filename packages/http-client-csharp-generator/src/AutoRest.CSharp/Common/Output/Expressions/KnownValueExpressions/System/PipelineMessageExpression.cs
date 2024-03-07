// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.System
{
    internal sealed record PipelineMessageExpression(ValueExpression Untyped) : TypedValueExpression<PipelineMessage>(Untyped)
    {
        public PipelineRequestExpression Request => new(Property(nameof(PipelineMessage.Request)));
    }
}
