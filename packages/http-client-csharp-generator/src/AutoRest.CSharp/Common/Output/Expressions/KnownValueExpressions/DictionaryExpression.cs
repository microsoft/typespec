// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record DictionaryExpression(CSharpType KeyType, CSharpType ValueType, ValueExpression Untyped) : TypedValueExpression(new CSharpType(typeof(Dictionary<,>), KeyType, ValueType), Untyped)
    {
        public MethodBodyStatement Add(ValueExpression key, ValueExpression value)
            => new InvokeInstanceMethodStatement(Untyped, nameof(Dictionary<object, object>.Add), key, value);
    }
}
