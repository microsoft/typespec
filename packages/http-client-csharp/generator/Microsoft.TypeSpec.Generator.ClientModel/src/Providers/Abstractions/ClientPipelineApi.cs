// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
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
            ScopedApi<string> method,
            ValueExpression responseClassifier,
            out HttpMessageApi message,
            out HttpRequestApi request);

        public abstract ValueExpression Create(ValueExpression options, ValueExpression perRetryPolicies);

        public abstract ValueExpression KeyAuthorizationPolicy(ValueExpression credential, ValueExpression headerName, ValueExpression? keyPrefix = null);
        public abstract ValueExpression TokenAuthorizationPolicy(ValueExpression credential, ValueExpression scopes);
        public virtual ValueExpression? UserAgentPolicy(CSharpType clientType) => null;

        /// <summary>
        /// Gets whether the client options of this pipeline carry model proxies. When <c>true</c>, generated clients store
        /// the options returned by <see cref="GetModelReaderWriterOptions(ValueExpression)"/> and pass them to every model
        /// they read and write in their operations. Pipelines whose client options don't carry model proxies keep the
        /// default (<c>false</c>), and their clients use the shared wire options.
        /// </summary>
        public virtual bool SupportsModelProxies => false;

        /// <summary>
        /// Gets the <c>ModelReaderWriterOptions</c> a generated client uses to read and write models in its operations,
        /// built from its client options. Only called when <see cref="SupportsModelProxies"/> is <c>true</c>.
        /// </summary>
        /// <param name="clientOptions">The client options expression.</param>
        public virtual ValueExpression GetModelReaderWriterOptions(ValueExpression clientOptions) => ModelSerializationExtensionsSnippets.Wire;
        public abstract ClientPipelineApi FromExpression(ValueExpression expression);
        public abstract ClientPipelineApi ToExpression();
    }
}
