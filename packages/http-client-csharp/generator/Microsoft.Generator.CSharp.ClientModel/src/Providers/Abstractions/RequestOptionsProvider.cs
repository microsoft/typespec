// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal record RequestOptionsProvider : HttpRequestOptionsApi
    {
        public RequestOptionsProvider(ValueExpression original) : base(typeof(RequestOptions), original)
        {
        }

        public override ValueExpression ErrorOptions()
            => Original.NullConditional().Property(nameof(RequestOptions.ErrorOptions));

        public override ValueExpression NoThrow()
            => FrameworkEnumValue(ClientErrorBehaviors.NoThrow);
    }
}
