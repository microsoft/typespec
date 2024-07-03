// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    public static class TypeProviderSnippets
    {
        public static ValueExpression DeserializeDelegate(this TypeProvider typeProvider)
            => Static(typeProvider.Type).Property($"Deserialize{typeProvider.Name}");

        public static ValueExpression Deserialize(this TypeProvider typeProvider, ValueExpression element, ValueExpression? options = null)
        {
            var arguments = options == null ? new[] { element } : new[] { element, options };
            return Static(typeProvider.Type).Invoke($"Deserialize{typeProvider.Name}", arguments);
        }
    }
}
