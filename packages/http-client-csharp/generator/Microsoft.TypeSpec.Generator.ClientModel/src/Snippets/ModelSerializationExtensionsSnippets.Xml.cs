// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
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

        public static MethodBodyStatement WriteObjectValue(ScopedApi<XmlWriter> writer, ScopedApi value, ValueExpression? options = null, ValueExpression? nameHint = null)
        {
            var parameters = new List<ValueExpression> { value };
            if (options is not null)
            {
                parameters.Add(options);
            }
            if (nameHint is not null)
            {
                if (options is null)
                {
                    parameters.Add(Null);
                }
                parameters.Add(nameHint);
            }
            return writer.Invoke(WriteObjectValueMethodName, [.. parameters], [value.Type], false).Terminate();
        }

        public static InvokeMethodExpression GetDateTimeOffset(ScopedApi<XElement> element, string? format)
            => element.Invoke(GetDateTimeOffsetMethodName, Literal(format));

        public static InvokeMethodExpression GetTimeSpan(ScopedApi<XElement> element, string? format)
            => element.Invoke(GetTimeSpanMethodName, Literal(format));

        public static InvokeMethodExpression GetBytesFromBase64(ScopedApi<XElement> element, string? format)
            => element.Invoke(GetBytesFromBase64MethodName, Literal(format));
    }
}
