// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public abstract record ClientPipelineApi : ScopedApi, IClientPipelineApi
    {
        public abstract CSharpType ClientPipelineType { get; }
        public abstract CSharpType ClientPipelineOptionsType { get; }
        public abstract CSharpType PipelinePolicyType { get; }

        protected ClientPipelineApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract HttpMessageApi CreateMessage();

        public abstract ValueExpression CreateMessage(HttpRequestOptionsApi requestOptions, ValueExpression responseClassifier);

        public abstract InvokeMethodExpression Send(HttpMessageApi message);

        public abstract InvokeMethodExpression SendAsync(HttpMessageApi message);

        public abstract ValueExpression Create(ValueExpression options, ValueExpression perRetryPolicies);

        public abstract ValueExpression PerRetryPolicy(params ValueExpression[] arguments);
        public abstract ClientPipelineApi FromExpression(ValueExpression expression);
        public abstract ClientPipelineApi ToExpression();
    }
}
