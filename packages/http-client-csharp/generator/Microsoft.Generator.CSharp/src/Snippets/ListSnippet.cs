// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record ListSnippet(CSharpType ItemType, ValueExpression Untyped) : TypedSnippet(new CSharpType(typeof(List<>), ItemType), Untyped)
    {
        public MethodBodyStatement Add(ValueExpression item) => new InvokeInstanceMethodStatement(Untyped, nameof(List<object>.Add), item);

        public ValueExpression ToArray() => Untyped.Invoke(nameof(List<object>.ToArray));
    }
}
