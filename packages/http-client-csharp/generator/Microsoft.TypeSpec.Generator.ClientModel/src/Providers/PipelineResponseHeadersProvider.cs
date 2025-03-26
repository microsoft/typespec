// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal record PipelineResponseHeadersProvider : HttpResponseHeadersApi
    {
        public PipelineResponseHeadersProvider(ValueExpression pipelineResponseHeaders) : base(typeof(PipelineResponseHeaders), pipelineResponseHeaders)
        {
        }

        private static HttpResponseHeadersApi? _instance;
        internal static HttpResponseHeadersApi Instance => _instance ??= new PipelineResponseHeadersProvider(Empty);

        public override ScopedApi<bool> TryGetHeader(string name, out ScopedApi<string>? value)
        {
            var result = Original.Invoke(nameof(PipelineResponseHeaders.TryGetValue), Snippet.Literal(name),
                    new DeclarationExpression(typeof(string), "value", out var valueVariable, isOut: true)).As<bool>();
            value = valueVariable.As<string>();
            return result;
        }

        public override HttpResponseHeadersApi FromExpression(ValueExpression original)
            => new PipelineResponseHeadersProvider(original);

        public override HttpResponseHeadersApi ToExpression()
            => this;

        public override CSharpType HttpResponseHeadersType => typeof(PipelineResponseHeaders);
    }
}
