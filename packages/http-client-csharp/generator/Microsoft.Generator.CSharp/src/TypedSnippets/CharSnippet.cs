// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record CharSnippet(ValueExpression Expression) : TypedSnippet<char>(Expression)
    {
        public StringSnippet InvokeToString(ValueExpression cultureInfo) => new(Expression.Invoke(nameof(char.ToString), cultureInfo));
    }
}
