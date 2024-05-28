// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record KeyValuePairSnippet(CSharpType KeyType, CSharpType ValueType, ValueExpression Untyped) : TypedSnippet(GetType(KeyType, ValueType), Untyped)
    {
        public ValueExpression Key => new MemberExpression(Untyped, nameof(KeyValuePair<string, string>.Key));
        public ValueExpression Value => new MemberExpression(Untyped, nameof(KeyValuePair<string, string>.Value));

        public static CSharpType GetType(CSharpType keyType, CSharpType valueType) => new(typeof(KeyValuePair<,>), false, keyType, valueType);
    }
}
