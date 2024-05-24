// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal sealed record PipelineMessageExpression(ValueExpression Untyped) : TypedSnippet<PipelineMessage>(Untyped)
    {
        public PipelineRequestExpression Request => new(Property(nameof(PipelineMessage.Request)));

        public PipelineResponseExpression Response => new(Property(nameof(PipelineMessage.Response)));

        public BoolSnippet BufferResponse => new(Property(nameof(PipelineMessage.BufferResponse)));
    }
}
