// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class CharSnippets
    {
        public static ScopedApi<string> InvokeToString(this ScopedApi<char> charExpression, ValueExpression cultureInfo) => charExpression.Invoke(nameof(char.ToString), cultureInfo).As<string>();
    }
}
