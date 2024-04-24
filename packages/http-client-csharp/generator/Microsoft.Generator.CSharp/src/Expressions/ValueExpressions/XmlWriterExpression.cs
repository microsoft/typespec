// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Xml;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record XmlWriterExpression(ValueExpression Untyped) : TypedValueExpression<XmlWriter>(Untyped), ITypedValueExpressionFactory<XmlWriterExpression>
    {
        public MethodBodyStatement WriteStartAttribute(string localName) => new InvokeInstanceMethodStatement(Untyped, nameof(XmlWriter.WriteStartAttribute), Literal(localName));
        public MethodBodyStatement WriteEndAttribute() => new InvokeInstanceMethodStatement(Untyped, nameof(XmlWriter.WriteEndAttribute));

        public MethodBodyStatement WriteStartElement(string localName) => WriteStartElement(Literal(localName));
        public MethodBodyStatement WriteStartElement(ValueExpression localName) => new InvokeInstanceMethodStatement(Untyped, nameof(XmlWriter.WriteStartElement), localName);
        public MethodBodyStatement WriteEndElement() => new InvokeInstanceMethodStatement(Untyped, nameof(XmlWriter.WriteEndElement));

        public MethodBodyStatement WriteValue(ValueExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(XmlWriter.WriteValue), value);
        public MethodBodyStatement WriteValue(ValueExpression value, string format) => Extensible.XmlWriter.WriteValue(this, value, format);

        public MethodBodyStatement WriteValue(ValueExpression value, Type frameworkType, SerializationFormat format)
        {
            bool writeFormat = frameworkType == typeof(byte[]) ||
                               frameworkType == typeof(DateTimeOffset) ||
                               frameworkType == typeof(DateTime) ||
                               frameworkType == typeof(TimeSpan);
            return writeFormat && format.ToFormatSpecifier() is { } formatSpecifier
                ? WriteValue(value, formatSpecifier)
                : WriteValue(value);
        }

        public MethodBodyStatement WriteObjectValue(ValueExpression value, string? nameHint) => Extensible.XmlWriter.WriteObjectValue(this, value, nameHint);

        static XmlWriterExpression ITypedValueExpressionFactory<XmlWriterExpression>.Create(ValueExpression untyped)
            => new(untyped);
    }
}
