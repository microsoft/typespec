// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class CharSnippets
    {
        public static StringSnippet InvokeToString(this ScopedApi<char> charExpression, ValueExpression cultureInfo) => new(charExpression.Invoke(nameof(char.ToString), cultureInfo));
    }
}
