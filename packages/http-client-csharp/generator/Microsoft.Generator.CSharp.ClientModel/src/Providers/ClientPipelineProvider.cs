// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal record ClientPipelineProvider : ClientPipelineApi
    {
        private static ClientPipelineApi? _instance;
        internal static ClientPipelineApi Instance => _instance ??= new ClientPipelineProvider(Empty);

        public ClientPipelineProvider(ValueExpression original) : base(typeof(ClientPipeline), original)
        {
        }

        public override CSharpType ClientPipelineType => typeof(ClientPipeline);

        public override CSharpType ClientPipelineOptionsType => typeof(ClientPipelineOptions);

        public override CSharpType PipelinePolicyType => typeof(PipelinePolicy);

        public override ValueExpression Create(ValueExpression options, ValueExpression perRetryPolicies)
            => Static<ClientPipeline>().Invoke(nameof(ClientPipeline.Create), [options, New.Array(ClientModelPlugin.Instance.TypeFactory.ClientPipelineApi.PipelinePolicyType), perRetryPolicies, New.Array(ClientModelPlugin.Instance.TypeFactory.ClientPipelineApi.PipelinePolicyType)]).As<ClientPipeline>();

        public override ValueExpression CreateMessage(ParameterProvider requestOptions, ValueExpression responseClassifier)
            => new PipelineMessageProvider(Original.Invoke(nameof(ClientPipeline.CreateMessage)));

        public override ClientPipelineApi FromExpression(ValueExpression expression)
            => new ClientPipelineProvider(expression);

        public override ValueExpression PerRetryPolicy(params ValueExpression[] arguments)
            => Static<ApiKeyAuthenticationPolicy>().Invoke(nameof(ApiKeyAuthenticationPolicy.CreateHeaderApiKeyPolicy), arguments).As<ApiKeyAuthenticationPolicy>();

        public override InvokeMethodExpression Send(HttpMessageApi message, HttpRequestOptionsApi options)
            => Original.Invoke(nameof(ClientPipeline.Send), [message, options]);

        public override InvokeMethodExpression SendAsync(HttpMessageApi message, HttpRequestOptionsApi options)
            => Original.Invoke(nameof(ClientPipeline.SendAsync), [message, options], true);

        public override ClientPipelineApi ToExpression() => this;
    }
}
