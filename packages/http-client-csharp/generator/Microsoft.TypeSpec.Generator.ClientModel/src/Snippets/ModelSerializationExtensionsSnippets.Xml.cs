// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static partial class ModelSerializationExtensionsSnippets
    {
        public static InvokeMethodExpression GetDateTimeOffset(ScopedApi<XElement> element, string? format)
            => element.Invoke(GetDateTimeOffsetMethodName, Literal(format));

        public static InvokeMethodExpression GetTimeSpan(ScopedApi<XElement> element, string? format)
            => element.Invoke(GetTimeSpanMethodName, Literal(format));

        public static InvokeMethodExpression GetBytesFromBase64(ScopedApi<XElement> element, string? format)
            => element.Invoke(GetBytesFromBase64MethodName, Literal(format));
    }
}
