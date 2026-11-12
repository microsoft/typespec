// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class MathSnippets
    {
        public static InvokeMethodExpression InvokeRound(ValueExpression arg)
            => Static(typeof(Math)).Invoke(nameof(Math.Round), arg);
    }
}
