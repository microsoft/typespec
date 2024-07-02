// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record PipelineResponseSnippet(ValueExpression Expression) : TypedSnippet<PipelineResponse>(Expression)
    {
        public ScopedApi<BinaryData> Content => new(Property(nameof(PipelineResponse.Content)));

        public ScopedApi<Stream> ContentStream => new(Property(nameof(PipelineResponse.ContentStream)));

        public ScopedApi<bool> IsError => new(Property(nameof(PipelineResponse.IsError)));
    }
}
