// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class JsonSerializerOptionsSnippets
    {
        public static MethodBodyStatement AddConverter(this ScopedApi<JsonSerializerOptions> options, ValueExpression converter)
            => options.Property(nameof(JsonSerializerOptions.Converters)).Invoke(nameof(IList<object>.Add), converter).Terminate();
    }
}
