// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Xml;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    /// <summary>
    /// Provides extension methods for generating code that works with <see cref="XmlReader"/>.
    /// </summary>
    internal static class XmlReaderSnippets
    {
        public static InvokeMethodExpression Create(ValueExpression input, ValueExpression settings)
            => Static<XmlReader>().Invoke(nameof(XmlReader.Create), [input, settings]);

        public static MethodBodyStatement MoveToContent(this ScopedApi<XmlReader> reader)
            => reader.Invoke(nameof(XmlReader.MoveToContent)).Terminate();

        public static MethodBodyStatement ReadStartElement(this ScopedApi<XmlReader> reader)
            => reader.Invoke(nameof(XmlReader.ReadStartElement)).Terminate();

        public static ScopedApi<XmlNodeType> NodeType(this ScopedApi<XmlReader> reader)
            => reader.Property(nameof(XmlReader.NodeType)).As<XmlNodeType>();
    }
}
