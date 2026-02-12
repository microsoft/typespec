// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Statements;
using System;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
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

        public override ValueExpression ClientRequestId()
            => Original.Property(nameof(PipelineRequest.ClientRequestId));

        public override HttpRequestApi FromExpression(ValueExpression original)
            => new PipelineRequestProvider(original);

        public override MethodBodyStatement SetHeaders(IReadOnlyList<ValueExpression> arguments)
            => Original.Property(nameof(PipelineRequest.Headers)).Invoke(nameof(PipelineRequestHeaders.Set), arguments).Terminate();

        public override HttpRequestApi ToExpression() => this;
    }
}
