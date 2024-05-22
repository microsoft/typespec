// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public abstract partial class ExtensibleSnippets
    {
        public abstract class JsonElementSnippets
        {
            public abstract ValueExpression GetBytesFromBase64(JsonElementExpression element, string? format);
            public abstract ValueExpression GetChar(JsonElementExpression element);
            public abstract ValueExpression GetDateTimeOffset(JsonElementExpression element, string? format);
            public abstract ValueExpression GetObject(JsonElementExpression element);
            public abstract ValueExpression GetTimeSpan(JsonElementExpression element, string? format);

            public abstract MethodBodyStatement ThrowNonNullablePropertyIsNull(JsonPropertyExpression property);
        }
    }
}
