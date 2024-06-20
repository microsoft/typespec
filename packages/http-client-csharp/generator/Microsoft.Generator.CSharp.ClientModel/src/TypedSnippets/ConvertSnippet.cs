// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record ConvertSnippet(ValueExpression Untyped) : TypedSnippet(typeof(Convert), Untyped)
    {
        public static InvokeStaticMethodExpression InvokeToDouble(ValueExpression arg)
            => new InvokeStaticMethodExpression(typeof(Convert), nameof(Convert.ToDouble), arg);

        public static InvokeStaticMethodExpression InvokeToInt32(ValueExpression arg)
            => new InvokeStaticMethodExpression(typeof(Convert), nameof(Convert.ToInt32), arg);
    }
}
