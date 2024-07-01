// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal static class FormattableStringHelpers
    {
        private static readonly Regex ContentTypeRegex = new Regex(@"(application|audio|font|example|image|message|model|multipart|text|video|x-(?:[0-9A-Za-z!#$%&'*+.^_`|~-]+))\/([0-9A-Za-z!#$%&'*.^_`|~-]+)\s*(?:\+([0-9A-Za-z!#$%&'*.^_`|~-]+))?\s*(?:;.\s*(\S*))?", RegexOptions.Compiled);

        public static BodyMediaType ToMediaType(string contentType)
        {
            var matches = ContentTypeRegex.Matches(contentType);
            if (matches.Count == 0)
            {
                throw new NotSupportedException($"Content type {contentType} is not supported.");
            }

            var type = matches[0].Groups[1].Value;
            var subType = matches[0].Groups[2].Value;
            var suffix = matches[0].Groups[3].Value;
            var parameter = matches[0].Groups[4].Value;

            var typeSubs = contentType.Split('/');
            if (typeSubs.Length != 2)
            {
                throw new NotSupportedException($"Content type {contentType} is not supported.");
            }

            if ((subType == "json" || suffix == "json") && (type == "application" || type == "text") && suffix == "" && parameter == "")
            {
                return BodyMediaType.Json;
            }

            if ((subType == "xml" || suffix == "xml") && (type == "application" || type == "text"))
            {
                return BodyMediaType.Xml;
            }

            if (type == "audio" || type == "image" || type == "video" || subType == "octet-stream" || parameter == "serialization=Avro")
            {
                return BodyMediaType.Binary;
            }

            if (type == "application" && subType == "formEncoded")
            {
                return BodyMediaType.Form;
            }

            if (type == "multipart" && subType == "form-data")
            {
                return BodyMediaType.Multipart;
            }

            if (type == "application")
            {
                return BodyMediaType.Binary;
            }

            if (type == "text")
            {
                return BodyMediaType.Text;
            }

            throw new NotSupportedException($"Content type {contentType} is not supported.");
        }

        public static FormattableString Empty => $"";

        [return: NotNullIfNotNull(nameof(s))]
        public static FormattableString? FromString(string? s) =>
            s is null ? null : s.Length == 0 ? Empty : $"{s}";
    }
}
