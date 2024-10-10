// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Primitives
{
    public abstract class HttpPipelineApi
    {
        public abstract CSharpType PipelineType { get; }
        public abstract CSharpType PipelinePolicyType { get; }
        public abstract CredentialApi CredentialApi { get; }
        public abstract ScopedApi<HttpPipelineApi> Create(params ValueExpression[] arguments);
    }

#pragma warning disable SA1402 // File may only contain a single type
    public abstract class CredentialApi
#pragma warning restore SA1402 // File may only contain a single type
    {
        public abstract CSharpType KeyCredentialType { get; }
        public abstract CSharpType TokenCredentialType { get; }
        public abstract ScopedApi<CredentialApi> CreateKeyCredentialPolicy(params ValueExpression[] arguments);
    }
}
