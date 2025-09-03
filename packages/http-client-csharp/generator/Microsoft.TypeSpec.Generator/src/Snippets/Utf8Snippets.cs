// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text;
using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class Utf8Snippets
    {
        public static ScopedApi<byte[]> GetBytes(this ScopedApi<string> s)
            => Static<Encoding>().Property("UTF8").Invoke(nameof(Encoding.UTF8.GetBytes), [s]).As<byte[]>();

        public static ScopedApi<int> GetBytes(ValueExpression chars, ValueExpression bytes)
            => Static<Encoding>().Property("UTF8").Invoke(nameof(Encoding.UTF8.GetBytes), [chars, bytes]).As<int>();

        public static ScopedApi<string> GetString(ValueExpression bytes)
            => Static<Encoding>().Property("UTF8").Invoke(nameof(Encoding.UTF8.GetString), [bytes]).As<string>();
    }
}
