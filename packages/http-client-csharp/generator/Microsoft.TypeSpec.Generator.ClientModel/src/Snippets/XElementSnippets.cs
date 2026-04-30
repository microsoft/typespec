// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    /// <summary>
    /// Provides extension methods for generating code that works with <see cref="XElement"/> and <see cref="XAttribute"/>.
    /// </summary>
    internal static class XElementSnippets
    {
        public static ScopedApi<string> Name(this ScopedApi<XElement> element)
            => element.Property(nameof(XElement.Name)).As<string>();
        public static ScopedApi<string> GetLocalName(this ScopedApi<XElement> element)
            => Name(element).Property(nameof(XName.LocalName)).As<string>();

        public static ScopedApi<IEnumerable<XElement>> Elements(this ScopedApi<XElement> element)
            => element.Invoke(nameof(XElement.Elements)).As<IEnumerable<XElement>>();

        public static ScopedApi<IEnumerable<XElement>> Elements(this ScopedApi<XElement> element, ValueExpression name)
            => element.Invoke(nameof(XElement.Elements), name).As<IEnumerable<XElement>>();

        public static ScopedApi<XElement> Element(this ScopedApi<XElement> element, ValueExpression name)
            => element.Invoke(nameof(XElement.Element), name).As<XElement>();

        public static ScopedApi<string> Value(this ScopedApi<XElement> element)
            => element.Property(nameof(XElement.Value)).As<string>();

        public static ScopedApi<IEnumerable<XAttribute>> Attributes(this ScopedApi<XElement> element)
            => element.Invoke(nameof(XElement.Attributes)).As<IEnumerable<XAttribute>>();

        public static ScopedApi<XName> Name(this ScopedApi<XAttribute> attribute)
            => attribute.Property(nameof(XAttribute.Name)).As<XName>();

        public static ScopedApi<string> GetLocalName(this ScopedApi<XAttribute> attribute)
            => Name(attribute).Property(nameof(XName.LocalName)).As<string>();

        public static ScopedApi<XElement> Load(params ValueExpression[] args)
            => Static<XElement>().Invoke(nameof(XElement.Load), args).As<XElement>();

        public static ScopedApi<DateTimeOffset> GetDateTimeOffset(this ScopedApi<XElement> element, string? format)
            => ModelSerializationExtensionsSnippets.GetDateTimeOffset(element, format).As<DateTimeOffset>();

        public static ScopedApi<TimeSpan> GetTimeSpan(this ScopedApi<XElement> element, string? format)
            => ModelSerializationExtensionsSnippets.GetTimeSpan(element, format).As<TimeSpan>();

        public static ScopedApi<byte[]> GetBytesFromBase64(this ScopedApi<XElement> element, string? format)
            => ModelSerializationExtensionsSnippets.GetBytesFromBase64(element, format).As<byte[]>();

        public static ScopedApi<XNamespace> Namespace(this ScopedApi<XName> name)
            => name.Property(nameof(XName.Namespace)).As<XNamespace>();
    }
}
