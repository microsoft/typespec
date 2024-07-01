// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record PipelineMessageSnippet(ValueExpression Expression) : TypedSnippet<PipelineMessage>(Expression)
    {
        public PipelineRequestSnippet Request => new(Property(nameof(PipelineMessage.Request)));

        public PipelineResponseSnippet Response => new(Property(nameof(PipelineMessage.Response)));

        public ScopedApi<bool> BufferResponse => new(Property(nameof(PipelineMessage.BufferResponse)));

        public PipelineResponseSnippet ExtractResponse() => new(Invoke(nameof(PipelineMessage.ExtractResponse), []));
    }
}
