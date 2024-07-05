// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Snippets
{
    public record TypeProviderSnippet(TypeProvider TypeProvider, ValueExpression Expression) : TypedSnippet(TypeProvider.Type, Expression)
    {
        public static MemberExpression DeserializeDelegate(TypeProvider typeProvider)
            => new(new TypeReferenceExpression(typeProvider.Type), $"Deserialize{typeProvider.Name}");

        public static TypeProviderSnippet Deserialize(TypeProvider typeProvider, ValueExpression element, ValueExpression? options = null)
        {
            var arguments = options == null ? new[] { element } : new[] { element, options };
            return new(typeProvider, new InvokeStaticMethodExpression(typeProvider.Type, $"Deserialize{typeProvider.Name}", arguments));
        }
    }
}
