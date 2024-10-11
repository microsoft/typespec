// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public interface IClientPipelineApi
    {
        CSharpType ClientPipelineType { get; }
        CSharpType ClientPipelineOptionsType { get; }
        CSharpType PipelinePolicyType { get; }
        ClientPipelineApi FromExpression(ValueExpression expression);
        ClientPipelineApi ToExpression();
    }
}
