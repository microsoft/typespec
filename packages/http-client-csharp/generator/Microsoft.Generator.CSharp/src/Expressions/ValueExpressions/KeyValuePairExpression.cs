// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record KeyValuePairExpression(CSharpType KeyType, CSharpType ValueType, ValueExpression Untyped) : TypedValueExpression(GetType(KeyType, ValueType), Untyped)
    {
        public TypedValueExpression Key => new TypedMemberExpression(Untyped, nameof(KeyValuePair<string, string>.Key), KeyType);
        public TypedValueExpression Value => new TypedMemberExpression(Untyped, nameof(KeyValuePair<string, string>.Value), ValueType);

        public static CSharpType GetType(CSharpType keyType, CSharpType valueType) => new(typeof(KeyValuePair<,>), false, keyType, valueType);
    }
}
