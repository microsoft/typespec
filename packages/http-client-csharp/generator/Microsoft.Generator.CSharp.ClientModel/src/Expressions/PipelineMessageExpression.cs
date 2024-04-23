// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal sealed record PipelineMessageExpression(ValueExpression Untyped) : TypedValueExpression<PipelineMessage>(Untyped)
    {
        public PipelineRequestExpression Request => new(Property(nameof(PipelineMessage.Request)));
    }
}
