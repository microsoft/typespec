// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record KeyValuePairSnippet(CSharpType KeyType, CSharpType ValueType, ValueExpression Expression) : TypedSnippet(GetType(KeyType, ValueType), Expression)
    {
        public ValueExpression Key => new MemberExpression(Expression, nameof(KeyValuePair<string, string>.Key));
        public ValueExpression Value => new MemberExpression(Expression, nameof(KeyValuePair<string, string>.Value));

        public static CSharpType GetType(CSharpType keyType, CSharpType valueType) => new(typeof(KeyValuePair<,>), false, keyType, valueType);
    }
}
