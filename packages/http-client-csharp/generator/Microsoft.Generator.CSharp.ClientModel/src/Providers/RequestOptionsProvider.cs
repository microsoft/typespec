// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal record RequestOptionsProvider : HttpRequestOptionsApi
    {
        public RequestOptionsProvider(ValueExpression original) : base(typeof(RequestOptions), original)
        {
        }

        private static HttpRequestOptionsApi? _instance;
        internal static HttpRequestOptionsApi Instance => _instance ??= new RequestOptionsProvider(Empty);

        public override CSharpType HttpRequestOptionsType => typeof(RequestOptions);

        public override string ParameterName => "options";

        public override ValueExpression ErrorOptions()
            => Original.NullConditional().Property(nameof(RequestOptions.ErrorOptions));

        public override HttpRequestOptionsApi FromExpression(ValueExpression original)
            => new RequestOptionsProvider(original);

        public override ValueExpression NoThrow()
            => FrameworkEnumValue(ClientErrorBehaviors.NoThrow);

        public override HttpRequestOptionsApi ToExpression() => this;
    }
}
