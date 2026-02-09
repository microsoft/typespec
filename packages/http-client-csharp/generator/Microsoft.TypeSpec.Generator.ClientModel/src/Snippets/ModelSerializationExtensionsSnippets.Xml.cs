// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Xml;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static partial class ModelSerializationExtensionsSnippets
    {
        public static MethodBodyStatement WriteStringValue(ScopedApi<XmlWriter> writer, ValueExpression value, string? format)
            => writer.Invoke(WriteStringValueMethodName, [value, Literal(format)]).Terminate();

        public static MethodBodyStatement WriteBase64StringValue(ScopedApi<XmlWriter> writer, ValueExpression value, string? format)
            => writer.Invoke(WriteBase64StringValueMethodName, [value, Literal(format)]).Terminate();

        public static MethodBodyStatement WriteObjectValue(ScopedApi<XmlWriter> writer, ScopedApi value, ValueExpression? options = null)
        {
            var parameters = options is null
                ? [value]
                : new ValueExpression[] { value, options };
            return writer.Invoke(WriteObjectValueMethodName, parameters, [value.Type], false).Terminate();
        }

        public static InvokeMethodExpression GetDateTimeOffset(ScopedApi<XElement> element, string? format)
            => element.Invoke(GetDateTimeOffsetMethodName, Literal(format));

        public static InvokeMethodExpression GetTimeSpan(ScopedApi<XElement> element, string? format)
            => element.Invoke(GetTimeSpanMethodName, Literal(format));

        public static InvokeMethodExpression GetBytesFromBase64(ScopedApi<XElement> element, string? format)
            => element.Invoke(GetBytesFromBase64MethodName, Literal(format));
    }
}
