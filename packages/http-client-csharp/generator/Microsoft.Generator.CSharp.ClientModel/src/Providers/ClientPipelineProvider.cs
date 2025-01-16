// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
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

        public override CSharpType KeyCredentialType => typeof(ApiKeyCredential);

        public override CSharpType? TokenCredentialType => null; // Scm library does not support token credentials yet.

        public override ValueExpression Create(ValueExpression options, ValueExpression perRetryPolicies)
            => Static<ClientPipeline>().Invoke(nameof(ClientPipeline.Create), [options, New.Array(ClientModelPlugin.Instance.TypeFactory.ClientPipelineApi.PipelinePolicyType), perRetryPolicies, New.Array(ClientModelPlugin.Instance.TypeFactory.ClientPipelineApi.PipelinePolicyType)]).As<ClientPipeline>();

        public override ValueExpression CreateMessage(HttpRequestOptionsApi requestOptions, ValueExpression responseClassifier)
            => new PipelineMessageProvider(Original.Invoke(nameof(ClientPipeline.CreateMessage)));

        public override ClientPipelineApi FromExpression(ValueExpression expression)
            => new ClientPipelineProvider(expression);

        public override ValueExpression KeyAuthorizationPolicy(ValueExpression credential, ValueExpression headerName, ValueExpression? keyPrefix = null)
        {
            ValueExpression[] arguments = keyPrefix == null ? [credential, headerName] : [credential, headerName, keyPrefix];
            return Static<ApiKeyAuthenticationPolicy>().Invoke(nameof(ApiKeyAuthenticationPolicy.CreateHeaderApiKeyPolicy), arguments).As<ApiKeyAuthenticationPolicy>();
        }

        public override ValueExpression TokenAuthorizationPolicy(ValueExpression credential, ValueExpression scopes)
        {
            // Scm library does not support token credentials yet. The throw here is intentional.
            // For a plugin that supports token credentials, they could override this implementation as well as the above TokenCredentialType property.
            throw new NotImplementedException();
        }

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
