// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Primitives
{
    internal class ScmHttpPipelineApi : HttpPipelineApi
    {
        public override CSharpType PipelineType => typeof(ClientPipeline);

        public override CSharpType PipelinePolicyType => typeof(PipelinePolicy);

        public override CredentialApi CredentialApi { get; } = new ScmCredentialApi();

        public override ScopedApi<HttpPipelineApi> Create(params ValueExpression[] arguments)
        {
            return ClientPipelineSnippets.Create(arguments).As<HttpPipelineApi>();
        }
    }

#pragma warning disable SA1402 // File may only contain a single type
    internal class ScmCredentialApi : CredentialApi
#pragma warning restore SA1402 // File may only contain a single type
    {
        public override CSharpType KeyCredentialType => typeof(ApiKeyCredential);

        public override CSharpType TokenCredentialType => throw new NotImplementedException("TokenCredential is not supported here");

        public override ScopedApi<CredentialApi> CreateKeyCredentialPolicy(params ValueExpression[] arguments)
        {
            return Static<ApiKeyAuthenticationPolicy>().Invoke(
                   nameof(ApiKeyAuthenticationPolicy.CreateHeaderApiKeyPolicy), arguments).As<CredentialApi>();
        }
    }
}
