// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public abstract record ClientPipelineApi : ScopedApi, IClientPipelineApi
    {
        public abstract CSharpType ClientPipelineType { get; }
        public abstract CSharpType ClientPipelineOptionsType { get; }
        public abstract CSharpType PipelinePolicyType { get; }
        public abstract CSharpType? KeyCredentialType { get; }
        public abstract CSharpType? TokenCredentialType { get; }

        protected ClientPipelineApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract MethodBodyStatement[] SendMessage(HttpMessageApi message, HttpRequestOptionsApi options);
        public abstract MethodBodyStatement[] SendMessageAsync(HttpMessageApi message, HttpRequestOptionsApi options);

        public abstract MethodBodyStatement[] CreateMessage(
            HttpRequestOptionsApi requestOptions,
            ValueExpression uri,
            ValueExpression method,
            ValueExpression responseClassifier,
            out HttpMessageApi message,
            out HttpRequestApi request);

        public abstract ValueExpression Create(ValueExpression options, ValueExpression perRetryPolicies);

        public abstract ValueExpression KeyAuthorizationPolicy(ValueExpression credential, ValueExpression headerName, ValueExpression? keyPrefix = null);
        public abstract ValueExpression TokenAuthorizationPolicy(ValueExpression credential, ValueExpression scopes);
        public abstract ClientPipelineApi FromExpression(ValueExpression expression);
        public abstract ClientPipelineApi ToExpression();
    }
}
