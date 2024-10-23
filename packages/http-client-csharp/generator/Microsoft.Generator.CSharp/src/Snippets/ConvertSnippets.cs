// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class ConvertSnippets
    {
        public static InvokeMethodExpression InvokeToDouble(ValueExpression arg)
            => Static(typeof(Convert)).Invoke(nameof(Convert.ToDouble), arg);

        public static InvokeMethodExpression InvokeToInt32(ValueExpression arg)
            => Static(typeof(Convert)).Invoke(nameof(Convert.ToInt32), arg);
    }
}
