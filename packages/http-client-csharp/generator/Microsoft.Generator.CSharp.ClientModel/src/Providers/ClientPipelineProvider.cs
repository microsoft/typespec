// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;
using Microsoft.Generator.CSharp.Snippets;
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

        public override ValueExpression CreateMessage(HttpRequestOptionsApi requestOptions, ValueExpression responseClassifier)
            => new PipelineMessageProvider(Original.Invoke(nameof(ClientPipeline.CreateMessage)));

        public override ClientPipelineApi FromExpression(ValueExpression expression)
            => new ClientPipelineProvider(expression);

        public override ValueExpression AuthorizationPolicy(params ValueExpression[] arguments)
            => Static<ApiKeyAuthenticationPolicy>().Invoke(nameof(ApiKeyAuthenticationPolicy.CreateHeaderApiKeyPolicy), arguments).As<ApiKeyAuthenticationPolicy>();

        public override ClientPipelineApi ToExpression() => this;

        public override MethodBodyStatement[] ProcessMessage(HttpMessageApi message, HttpRequestOptionsApi options)
            =>
            [
                Original.Invoke(nameof(ClientPipeline.Send), [message]).Terminate(),
                MethodBodyStatement.EmptyLine,
                new IfStatement(message.Response().IsError().And(new BinaryOperatorExpression("&", options.NullConditional().Property("ErrorOptions"), options.NoThrow()).NotEqual(options.NoThrow())))
                {
                    Throw(New.Instance(ClientModelPlugin.Instance.TypeFactory.ClientResponseApi.ClientResponseExceptionType, message.Response()))
                },
                MethodBodyStatement.EmptyLine,
                Declare("response", ClientModelPlugin.Instance.TypeFactory.HttpResponseApi.HttpResponseType, new TernaryConditionalExpression(message.BufferResponse(), message.Response(), message.Invoke(nameof(PipelineMessage.ExtractResponse))), out var response),
                Return(response)
            ];

        public override MethodBodyStatement[] ProcessMessageAsync(HttpMessageApi message, HttpRequestOptionsApi options)
            =>
            [
                Original.Invoke(nameof(ClientPipeline.SendAsync), [message], true).Terminate(),
                MethodBodyStatement.EmptyLine,
                new IfStatement(message.Response().IsError().And(new BinaryOperatorExpression("&", options.NullConditional().Property("ErrorOptions"), options.NoThrow()).NotEqual(options.NoThrow())))
                {
                    Throw(ClientModelPlugin.Instance.TypeFactory.ClientResponseApi.ToExpression().CreateAsync(message.Response()))
                },
                MethodBodyStatement.EmptyLine,
                Declare("response", ClientModelPlugin.Instance.TypeFactory.HttpResponseApi.HttpResponseType, new TernaryConditionalExpression(message.BufferResponse(), message.Response(), message.Invoke(nameof(PipelineMessage.ExtractResponse))), out var response),
                Return(response)
            ];
    }
}
