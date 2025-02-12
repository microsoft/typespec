// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public interface IClientPipelineApi : IExpressionApi<ClientPipelineApi>
    {
        CSharpType ClientPipelineType { get; }
        CSharpType ClientPipelineOptionsType { get; }
        CSharpType PipelinePolicyType { get; }

        CSharpType? KeyCredentialType { get; }
        CSharpType? TokenCredentialType { get; }
    }
}
