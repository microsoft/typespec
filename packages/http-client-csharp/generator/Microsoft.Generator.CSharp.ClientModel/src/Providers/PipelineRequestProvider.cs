// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;
using Microsoft.Generator.CSharp.Statements;
using System;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal record PipelineRequestProvider : HttpRequestApi
    {
        public PipelineRequestProvider(ValueExpression original) : base(typeof(PipelineRequest), original)
        {
        }

        private static HttpRequestApi? _instance;
        internal static HttpRequestApi Instance => _instance ??= new PipelineRequestProvider(Empty);

        public override Type UriBuilderType => typeof(ClientUriBuilderDefinition);

        public override ValueExpression Content()
            => Original.Property(nameof(PipelineRequest.Content));

        public override HttpRequestApi FromExpression(ValueExpression original)
            => new PipelineRequestProvider(original);

        public override MethodBodyStatement SetHeaders(IReadOnlyList<ValueExpression> arguments)
            => Original.Property(nameof(PipelineRequest.Headers)).Invoke(nameof(PipelineRequestHeaders.Set), arguments).Terminate();

        public override MethodBodyStatement SetMethod(string httpMethod)
            => Original.Property(nameof(PipelineRequest.Method)).Assign(Literal(httpMethod)).Terminate();

        public override MethodBodyStatement SetUri(ValueExpression value)
            => Original.Property("Uri").Assign(value.As<ClientUriBuilderDefinition>().ToUri()).Terminate();

        public override HttpRequestApi ToExpression() => this;
    }
}
