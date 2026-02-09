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
    /// Provides extension methods for generating code that works with <see cref="XmlWriter"/>.
    /// </summary>
    internal static class XmlWriterSnippets
    {
        public static MethodBodyStatement WriteStartElement(this ScopedApi<XmlWriter> writer, string localName)
            => writer.Invoke(nameof(XmlWriter.WriteStartElement), Literal(localName)).Terminate();

        public static MethodBodyStatement WriteStartElement(this ScopedApi<XmlWriter> writer, ValueExpression localName)
            => writer.Invoke(nameof(XmlWriter.WriteStartElement), localName).Terminate();

        public static MethodBodyStatement WriteStartElement(this ScopedApi<XmlWriter> writer, string prefix, string localName, string ns)
            => writer.WriteStartElement(prefix, Literal(localName), ns);

        public static MethodBodyStatement WriteStartElement(this ScopedApi<XmlWriter> writer, string prefix, ValueExpression localName, string ns)
            => writer.Invoke(nameof(XmlWriter.WriteStartElement), [Literal(prefix), localName, Literal(ns)]).Terminate();

        public static MethodBodyStatement WriteEndElement(this ScopedApi<XmlWriter> writer)
            => writer.Invoke(nameof(XmlWriter.WriteEndElement)).Terminate();

        public static MethodBodyStatement WriteStartAttribute(this ScopedApi<XmlWriter> writer, string localName)
            => writer.Invoke(nameof(XmlWriter.WriteStartAttribute), Literal(localName)).Terminate();

        public static MethodBodyStatement WriteEndAttribute(this ScopedApi<XmlWriter> writer)
            => writer.Invoke(nameof(XmlWriter.WriteEndAttribute)).Terminate();

        public static MethodBodyStatement WriteValue(this ScopedApi<XmlWriter> writer, ValueExpression value)
            => writer.Invoke(nameof(XmlWriter.WriteValue), value).Terminate();

        public static MethodBodyStatement WriteAttributeString(this ScopedApi<XmlWriter> writer, string prefix, string localName, string ns, ValueExpression value)
            => writer.Invoke(nameof(XmlWriter.WriteAttributeString), [Literal(prefix), Literal(localName), Literal(ns), value]).Terminate();

        public static MethodBodyStatement WriteStringValue(this ScopedApi<XmlWriter> writer, ValueExpression value, string format)
            => ModelSerializationExtensionsSnippets.WriteStringValue(writer, value, format);

        public static MethodBodyStatement WriteBase64StringValue(this ScopedApi<XmlWriter> writer, ValueExpression value, string? format)
            => ModelSerializationExtensionsSnippets.WriteBase64StringValue(writer, value, format);

        public static MethodBodyStatement WriteNode(this ScopedApi<XmlWriter> writer, ValueExpression reader, ValueExpression defattr)
            => writer.Invoke(nameof(XmlWriter.WriteNode), [reader, defattr]).Terminate();

        public static MethodBodyStatement WriteObjectValue(this ScopedApi<XmlWriter> writer, ScopedApi value, ValueExpression options)
            => ModelSerializationExtensionsSnippets.WriteObjectValue(writer, value, options);

        public static InvokeMethodExpression Create(ValueExpression output, ValueExpression settings)
            => Static<XmlWriter>().Invoke(nameof(XmlWriter.Create), [output, settings]);
    }
}
