// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class JsonSerializerOptionsSnippets
    {
        public static MethodBodyStatement AddConverter(this ScopedApi<JsonSerializerOptions> options, ValueExpression converter)
            => options.Property(nameof(JsonSerializerOptions.Converters)).Invoke(nameof(IList<object>.Add), converter).Terminate();
    }
}
