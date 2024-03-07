// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record KeyValuePairExpression(CSharpType KeyType, CSharpType ValueType, ValueExpression Untyped) : TypedValueExpression(GetType(KeyType, ValueType), Untyped)
    {
        public TypedValueExpression Key => new TypedMemberExpression(Untyped, nameof(KeyValuePair<string, string>.Key), KeyType);
        public TypedValueExpression Value => new TypedMemberExpression(Untyped, nameof(KeyValuePair<string, string>.Value), ValueType);

        public static CSharpType GetType(CSharpType keyType, CSharpType valueType) => new(typeof(KeyValuePair<,>), keyType, valueType);
    }
}
