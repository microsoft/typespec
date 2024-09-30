// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal record PipelineMessageProvider : HttpMessageApi
    {
        public PipelineMessageProvider(ValueExpression original) : base(typeof(PipelineMessage), original)
        {
        }

        public override HttpRequestApi Request()
            => new PipelineRequestProvider(Original.Property(nameof(PipelineMessage.Request)));

        public override ValueExpression BufferResponse()
            => Original.Property(nameof(PipelineMessage.BufferResponse));

        public override HttpResponseApi Response()
            => new PipelineResponseProvider(Original.Property(nameof(PipelineMessage.Response)));

        public override ValueExpression ResponseClassifier()
            => Original.Property(nameof(PipelineMessage.ResponseClassifier));

        public override MethodBodyStatement Apply(ValueExpression options)
            => Original.Invoke(nameof(PipelineMessage.Apply), options).Terminate();

        public override MethodBodyStatement[] ExtractResponse()
            => [Return(Original.Invoke(nameof(PipelineMessage.ExtractResponse)))];
    }
}
