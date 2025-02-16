// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;
using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.Primitives;
using System.Collections.Generic;
using System.Linq;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal record PipelineMessageClassifierProvider : StatusCodeClassifierApi
    {
        private static StatusCodeClassifierApi? _instance;
        internal static StatusCodeClassifierApi Instance => _instance ??= new PipelineMessageClassifierProvider(Empty);

        public PipelineMessageClassifierProvider(ValueExpression original) : base(typeof(PipelineMessageClassifier), original)
        {
        }

        public override CSharpType ResponseClassifierType => typeof(PipelineMessageClassifier);

        public override ValueExpression Create(int code)
            => Create([code]);

        public override ValueExpression Create(IEnumerable<int> codes)
            => Static<PipelineMessageClassifier>().Invoke(nameof(PipelineMessageClassifier.Create), [New.Array(typeof(ushort), true, true, [.. codes.Select(Literal)])]);

        public override StatusCodeClassifierApi FromExpression(ValueExpression original)
            => new PipelineMessageClassifierProvider(original);

        public override StatusCodeClassifierApi ToExpression() => this;
    }
}
