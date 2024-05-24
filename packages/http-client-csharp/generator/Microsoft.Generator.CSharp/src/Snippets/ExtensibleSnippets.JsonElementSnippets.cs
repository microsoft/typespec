// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public abstract partial class ExtensibleSnippets
    {
        public abstract class JsonElementSnippets
        {
            public abstract ValueExpression GetBytesFromBase64(JsonElementSnippet element, string? format);
            public abstract ValueExpression GetChar(JsonElementSnippet element);
            public abstract ValueExpression GetDateTimeOffset(JsonElementSnippet element, string? format);
            public abstract ValueExpression GetObject(JsonElementSnippet element);
            public abstract ValueExpression GetTimeSpan(JsonElementSnippet element, string? format);

            public abstract MethodBodyStatement ThrowNonNullablePropertyIsNull(JsonPropertySnippet property);
        }
    }
}
