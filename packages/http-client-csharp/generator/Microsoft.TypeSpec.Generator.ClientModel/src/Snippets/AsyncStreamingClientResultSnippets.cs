// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
#pragma warning disable SCME0005 // Type is for evaluation purposes only and is subject to change or removal in future updates.
    internal static class AsyncStreamingClientResultSnippets
    {
        public static CSharpType Of(CSharpType itemType)
            => new(typeof(AsyncStreamingClientResult<>), itemType);

        public static ValueExpression CreateSse(
            ValueExpression response,
            IReadOnlyList<ValueExpression> arguments,
            CSharpType? payloadType = null)
            => Static(typeof(AsyncStreamingClientResult)).Invoke(
                "CreateSse",
                [response, .. arguments],
                payloadType is null ? [] : [payloadType]);

        public static ValueExpression CreateJsonLines(
            ValueExpression response,
            IReadOnlyList<ValueExpression> arguments,
            CSharpType? itemType = null)
            => Static(typeof(AsyncStreamingClientResult)).Invoke(
                "CreateJsonLines",
                [response, .. arguments],
                itemType is null ? [] : [itemType]);
    }
#pragma warning restore SCME0005
}
