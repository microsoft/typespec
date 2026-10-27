// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class AsyncStreamingResultSnippets
    {
        public static CSharpType Of(CSharpType itemType)
            => new(typeof(AsyncStreamingResult<>), itemType);

        public static ValueExpression CreateSse(
            ValueExpression response,
            IReadOnlyList<ValueExpression> arguments,
            CSharpType? payloadType = null)
            => Static(typeof(AsyncStreamingResult)).Invoke(
                "CreateSse",
                [response, .. arguments],
                payloadType is null ? [] : [payloadType]);

        public static ValueExpression CreateJsonLines(
            ValueExpression response,
            IReadOnlyList<ValueExpression> arguments,
            CSharpType? itemType = null)
            => Static(typeof(AsyncStreamingResult)).Invoke(
                "CreateJsonLines",
                [response, .. arguments],
                itemType is null ? [] : [itemType]);
    }
}
