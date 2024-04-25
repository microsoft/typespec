// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public abstract partial class ExtensibleSnippets
    {
        public abstract class XmlWriterSnippets
        {
            public abstract MethodBodyStatement WriteValue(XmlWriterExpression xmlWriter, ValueExpression value, string format);
            public abstract MethodBodyStatement WriteObjectValue(XmlWriterExpression xmlWriter, ValueExpression value, string? nameHint);
        }
    }
}
