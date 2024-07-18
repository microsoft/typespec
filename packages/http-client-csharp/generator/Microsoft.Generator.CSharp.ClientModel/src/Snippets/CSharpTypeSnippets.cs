// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class CSharpTypeSnippets
    {
        public static ValueExpression ToEnum(this CSharpType type, ValueExpression valueExpression)
        {
            if (type.IsStruct)
            {
                return New.Instance(type, valueExpression);
            }
            else
            {
                return valueExpression.Invoke($"To{type.Name}");
            }
        }

        public static ValueExpression Deserialize(this CSharpType type, ValueExpression element, ValueExpression? options = null)
        {
            var arguments = options == null ? new[] { element } : new[] { element, options };
            return Static(type).Invoke($"Deserialize{type.Name}", arguments);
        }
    }
}
