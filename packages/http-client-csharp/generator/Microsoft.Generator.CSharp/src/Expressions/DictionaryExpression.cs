﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DictionaryExpression(CSharpType KeyType, CSharpType ValueType, ValueExpression Untyped) : TypedValueExpression(new CSharpType(typeof(Dictionary<,>), false, KeyType, ValueType), Untyped)
    {
        public MethodBodyStatement Add(ValueExpression key, ValueExpression value)
            => new InvokeInstanceMethodStatement(Untyped, nameof(Dictionary<object, object>.Add), key, value);

        public MethodBodyStatement Add(KeyValuePairExpression pair)
            => new InvokeInstanceMethodStatement(Untyped, nameof(Dictionary<object, object>.Add), pair);
    }
}
