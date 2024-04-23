// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record ObjectTypeExpression(TypeProvider TypeProvider, ValueExpression Untyped) : TypedValueExpression(TypeProvider.Type, Untyped)
    {
        public static MemberExpression FromResponseDelegate(TypeProvider typeProvider)
            => new(new TypeReference(typeProvider.Type), CodeModelPlugin.Instance.Configuration.ApiTypes.FromResponseName);

        public static MemberExpression DeserializeDelegate(TypeProvider typeProvider)
            => new(new TypeReference(typeProvider.Type), $"Deserialize{typeProvider.Name}");

        public static ObjectTypeExpression Deserialize(TypeProvider typeProvider, ValueExpression element, ValueExpression? options = null)
        {
            var arguments = options == null ? new[] { element } : new[] { element, options };
            return new(typeProvider, new InvokeStaticMethodExpression(typeProvider.Type, $"Deserialize{typeProvider.Name}", arguments));
        }
    }
}
