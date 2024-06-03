// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record PipelineResponseSnippet(ValueExpression Untyped) : TypedSnippet<PipelineResponse>(Untyped)
    {
        public BinaryDataSnippet Content => new(Property(nameof(PipelineResponse.Content)));

        public StreamSnippet ContentStream => new(Property(nameof(PipelineResponse.ContentStream)));
    }
}
