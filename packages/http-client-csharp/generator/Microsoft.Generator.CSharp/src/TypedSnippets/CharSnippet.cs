// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record CharSnippet(ValueExpression Untyped) : TypedSnippet<char>(Untyped)
    {
        public StringSnippet InvokeToString(ValueExpression cultureInfo) => new(Untyped.Invoke(nameof(char.ToString), cultureInfo));
    }
}
