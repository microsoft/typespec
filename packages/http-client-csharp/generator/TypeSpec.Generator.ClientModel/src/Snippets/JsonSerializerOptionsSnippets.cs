// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Text.Json;
using TypeSpec.Generator.Expressions;
using TypeSpec.Generator.Snippets;
using TypeSpec.Generator.Statements;

namespace TypeSpec.Generator.ClientModel.Snippets
{
    internal static class JsonSerializerOptionsSnippets
    {
        public static MethodBodyStatement AddConverter(this ScopedApi<JsonSerializerOptions> options, ValueExpression converter)
            => options.Property(nameof(JsonSerializerOptions.Converters)).Invoke(nameof(IList<object>.Add), converter).Terminate();
    }
}
