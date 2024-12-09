// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
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

        public abstract MethodBodyStatement[] ProcessMessage(HttpMessageApi message, HttpRequestOptionsApi options);
        public abstract MethodBodyStatement[] ProcessMessageAsync(HttpMessageApi message, HttpRequestOptionsApi options);

        public abstract ValueExpression CreateMessage(HttpRequestOptionsApi requestOptions, ValueExpression responseClassifier);

        public abstract ValueExpression Create(ValueExpression options, ValueExpression perRetryPolicies);

        public abstract ValueExpression KeyAuthorizationPolicy(ValueExpression credential, ValueExpression headerName, ValueExpression? keyPrefix = null);
        public abstract ValueExpression TokenAuthorizationPolicy(ValueExpression credential, ValueExpression scopes);
        public abstract ClientPipelineApi FromExpression(ValueExpression expression);
        public abstract ClientPipelineApi ToExpression();
    }
}
