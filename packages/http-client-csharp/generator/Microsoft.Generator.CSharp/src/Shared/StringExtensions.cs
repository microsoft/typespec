// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    internal static class StringExtensions
    {
        private static readonly Regex HumanizedCamelCaseRegex = new Regex(@"([A-Z])", RegexOptions.Compiled);

        [return: NotNullIfNotNull(nameof(name))]
        public static string ToVariableName(this string name) => StringHelpers.ToCleanName(name, isCamelCase: false);

        public static GetPathPartsEnumerator GetFormattableStringFormatParts(string? format) => new GetPathPartsEnumerator(format);

        public static GetPathPartsEnumerator GetFormattableStringFormatParts(ReadOnlySpan<char> format) => new GetPathPartsEnumerator(format);

        public ref struct GetPathPartsEnumerator
        {
            private ReadOnlySpan<char> _path;
            public Part Current { get; private set; }

            public GetPathPartsEnumerator(ReadOnlySpan<char> format)
            {
                _path = format;
                Current = default;
            }

            public readonly GetPathPartsEnumerator GetEnumerator() => this;

            public bool MoveNext()
            {
                var span = _path;
                if (span.Length == 0)
                {
                    return false;
                }

                var separatorIndex = span.IndexOfAny('{', '}');

                if (separatorIndex == -1)
                {
                    Current = new Part(span, true);
                    _path = ReadOnlySpan<char>.Empty;
                    return true;
                }

                var separator = span[separatorIndex];
                // Handle {{ and }} escape sequences
                if (separatorIndex + 1 < span.Length && span[separatorIndex + 1] == separator)
                {
                    Current = new Part(span.Slice(0, separatorIndex + 1), true);
                    _path = span.Slice(separatorIndex + 2);
                    return true;
                }

                var isLiteral = separator == '{';

                // Skip empty literals
                if (isLiteral && separatorIndex == 0 && span.Length > 1)
                {
                    separatorIndex = span.IndexOf('}');
                    if (separatorIndex == -1)
                    {
                        Current = new Part(span.Slice(1), true);
                        _path = ReadOnlySpan<char>.Empty;
                        return true;
                    }

                    Current = new Part(span.Slice(1, separatorIndex - 1), false);
                }
                else
                {
                    Current = new Part(span.Slice(0, separatorIndex), isLiteral);
                }

                _path = span.Slice(separatorIndex + 1);
                return true;
            }

            public readonly ref struct Part
            {
                public Part(ReadOnlySpan<char> span, bool isLiteral)
                {
                    Span = span;
                    IsLiteral = isLiteral;
                }

                public ReadOnlySpan<char> Span { get; }
                public bool IsLiteral { get; }

                public void Deconstruct(out ReadOnlySpan<char> span, out bool isLiteral)
                {
                    span = Span;
                    isLiteral = IsLiteral;
                }

                public void Deconstruct(out ReadOnlySpan<char> span, out bool isLiteral, out int argumentIndex)
                {
                    span = Span;
                    isLiteral = IsLiteral;

                    if (IsLiteral)
                    {
                        argumentIndex = -1;
                    }
                    else
                    {
                        var formatSeparatorIndex = span.IndexOf(':');
                        var indexSpan = formatSeparatorIndex == -1 ? span : span.Slice(0, formatSeparatorIndex);
                        argumentIndex = int.Parse(indexSpan);
                    }
                }
            }
        }

        /// <summary>
        /// Determines if the given name is a C# keyword.
        /// </summary>
        /// <param name="name">The string name of the keyword.</param>
        /// <returns><c>true</c> if the string is a csharp keyword.</returns>
        public static bool IsCSharpKeyword(string? name)
        {
            if (name == null)
            {
                return false;
            }

            SyntaxKind kind = SyntaxFacts.GetKeywordKind(name);
            if (kind == SyntaxKind.None)
            {
                kind = SyntaxFacts.GetContextualKeywordKind(name);
            }

            return SyntaxFacts.IsKeywordKind(kind);
        }

        public static string ToApiVersionMemberName(this string version)
        {
            var sb = new StringBuilder("V");
            int startIndex = version.StartsWith("v", StringComparison.InvariantCultureIgnoreCase) ? 1 : 0;

            for (int i = startIndex; i < version.Length; i++)
            {
                char c = version[i];
                if (c == '-' || c == '.')
                {
                    sb.Append('_');
                }
                else
                {
                    sb.Append(c);
                }
            }

            return CultureInfo.InvariantCulture.TextInfo.ToTitleCase(sb.ToString());
        }
    }
}
