// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record PipelineMessageSnippet(ValueExpression Untyped) : TypedSnippet<PipelineMessage>(Untyped)
    {
        public PipelineRequestSnippet Request => new(Property(nameof(PipelineMessage.Request)));

        public PipelineResponseSnippet Response => new(Property(nameof(PipelineMessage.Response)));

        public BoolSnippet BufferResponse => new(Property(nameof(PipelineMessage.BufferResponse)));
    }
}
