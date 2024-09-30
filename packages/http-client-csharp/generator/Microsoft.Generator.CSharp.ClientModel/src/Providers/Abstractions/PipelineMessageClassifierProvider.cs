// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Snippets.Snippet;
using System.ClientModel.Primitives;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal record PipelineMessageClassifierProvider : StatusCodeClassifierApi
    {
        public PipelineMessageClassifierProvider(ValueExpression original) : base(typeof(PipelineMessageClassifier), original)
        {
        }

        public override ValueExpression Create(int code)
            => Static<PipelineMessageClassifier>().Invoke(nameof(PipelineMessageClassifier.Create), [New.Array(typeof(ushort), true, true, [Literal(code)])]);
    }
}
