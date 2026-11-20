// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests
{
    /// <summary>
    /// A System.ClientModel pipeline whose client options don't carry model proxies, matching pipelines such as
    /// Azure.Core's that generate the pre-proxy client conversions.
    /// </summary>
    internal record ClientPipelineWithoutModelProxies : ClientPipelineProvider
    {
        private static ClientPipelineApi? _instance;
        internal static new ClientPipelineApi Instance => _instance ??= new ClientPipelineWithoutModelProxies(Empty);

        public ClientPipelineWithoutModelProxies(ValueExpression original) : base(original)
        {
        }

        public override ValueExpression? GetModelProxies(ValueExpression clientOptions) => null;

        public override ClientPipelineApi FromExpression(ValueExpression expression)
            => new ClientPipelineWithoutModelProxies(expression);

        public override ClientPipelineApi ToExpression() => this;
    }
}
