// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.IO;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal record PipelineResponseProvider : HttpResponseApi
    {
        public PipelineResponseProvider(ValueExpression pipelineResponse) : base(typeof(PipelineResponse), pipelineResponse)
        {
        }

        private static HttpResponseApi? _instance;
        internal static HttpResponseApi Instance => _instance ??= new PipelineResponseProvider(Empty);

        public override ScopedApi<Stream> ContentStream()
            => Original.Property(nameof(PipelineResponse.ContentStream)).As<Stream>();

        public override ScopedApi<BinaryData> Content()
            => Original.Property(nameof(PipelineResponse.Content)).As<BinaryData>();

        public override ScopedApi<bool> IsError()
            => Original.Property(nameof(PipelineResponse.IsError)).As<bool>();

        public override ScopedApi<bool> TryGetHeader(string name, out ScopedApi<string>? value)
        {
            var result = Original.Property(nameof(PipelineResponse.Headers))
                .Invoke(nameof(PipelineResponseHeaders.TryGetValue), Snippet.Literal(name),
                    new DeclarationExpression(typeof(string), "value", out var valueVariable, isOut: true)).As<bool>();
            value = valueVariable.As<string>();
            return result;
        }

        public override HttpResponseApi FromExpression(ValueExpression original)
            => new PipelineResponseProvider(original);

        public override HttpResponseApi ToExpression()
            => this;

        public override CSharpType HttpResponseType => typeof(PipelineResponse);
    }
}
