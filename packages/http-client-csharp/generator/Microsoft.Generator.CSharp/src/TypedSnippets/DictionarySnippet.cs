// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record DictionarySnippet(CSharpType KeyType, CSharpType ValueType, ValueExpression Expression) : TypedSnippet(new CSharpType(typeof(Dictionary<,>), false, KeyType, ValueType), Expression)
    {
        public MethodBodyStatement Add(ValueExpression key, ValueExpression value)
            => Expression.Invoke(nameof(Dictionary<object, object>.Add), [key, value]).Terminate();

        public MethodBodyStatement Add(KeyValuePairSnippet pair)
            => Expression.Invoke(nameof(Dictionary<object, object>.Add), pair).Terminate();

        public ValueExpression this[ValueExpression key] => new IndexerExpression(Expression, key);
    }
}
