// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    internal static class FormattableStringHelpers
    {
        private static FormattableString Join<T>(IEnumerable<T> source, int count, Func<T, object> converter, string separator, string? lastSeparator, char? format)
           => count switch
           {
               0 => Empty,
               1 => FormattableStringFactory.Create(format is not null ? $"{{0:{format}}}" : "{0}", converter(source.First())),
               _ => FormattableStringFactory.Create(CreateFormatWithSeparator(separator, lastSeparator, format, count), source.Select(converter).ToArray())
           };
        private static string CreateFormatWithSeparator(string separator, string? lastSeparator, char? format, int count)
        {
            const int offset = 48; // (int)'0' is 48
            if (count > 100)
            {
                var s = string.Join(separator, Enumerable.Range(0, count).Select(i => $"{{{i}}}"));
                return lastSeparator is null ? s : s.ReplaceLast(separator, lastSeparator);
            }

            Debug.Assert(count > 1);

            lastSeparator ??= separator;

            var placeholderLength = format.HasValue ? 5 : 3;
            var length = count < 10
                ? count * placeholderLength
                : (count - 10) * (placeholderLength + 1) + 10 * placeholderLength;

            length += separator.Length * (count - 2) + lastSeparator.Length;

            return string.Create(length, (separator, lastSeparator, format, count), static (span, state) =>
            {
                var (separator, lastSeparator, format, count) = state;
                for (int i = 0; i < count; i++)
                {
                    span[0] = '{';
                    if (i < 10)
                    {
                        span[1] = (char)(i + offset);
                        span = span[2..];
                    }
                    else
                    {
                        span[1] = (char)(i / 10 + offset);
                        span[2] = (char)(i % 10 + offset);
                        span = span[3..];
                    }
                    if (format is not null)
                    {
                        span[0] = ':';
                        span[1] = format.Value;
                        span = span[2..];
                    }
                    span[0] = '}';
                    span = span[1..];
                    if (i < count - 1)
                    {
                        var separatorToUse = i < count - 2 ? separator : lastSeparator;
                        separatorToUse.CopyTo(span);
                        span = span[separatorToUse.Length..];
                    }
                }
                Debug.Assert(span.IsEmpty);
            });
        }
        public static FormattableString Empty => $"";

        [return: NotNullIfNotNull(nameof(s))]
        public static FormattableString? FromString(string? s) =>
            s is null ? null : s.Length == 0 ? Empty : $"{s}";
        public static bool IsNullOrEmpty(this FormattableString? fs) =>
            fs is null || string.IsNullOrEmpty(fs.Format) && fs.ArgumentCount == 0;

        public static FormattableString Join(this ICollection<FormattableString> fss, string separator, string? lastSeparator = null)
            => fss.Count == 1 ? fss.First() : Join(fss, fss.Count, static fs => fs, separator, lastSeparator, null);

        public static FormattableString GetTypesFormattable(this IReadOnlyCollection<ParameterProvider> parameters)
            => GetTypesFormattable(parameters, parameters.Count);

        public static FormattableString GetTypesFormattable(this IEnumerable<ParameterProvider> parameters, int count)
            => Join(parameters, count, static p => p.Type, ",", null, null);

        public static string ReplaceLast(this string text, string oldValue, string newValue)
        {
            var position = text.LastIndexOf(oldValue, StringComparison.Ordinal);
            return position < 0 ? text : text.Substring(0, position) + newValue + text.Substring(position + oldValue.Length);
        }

        internal static IReadOnlyList<FormattableString> BreakLines(FormattableString input)
        {
            // handle empty input fs - we should not throw it away when it is empty
            if (input.Format.Length == 0)
            {
                return [input]; // return it as is
            }

            StringBuilder formatBuilder = new StringBuilder();
            var args = new List<object?>();
            List<FormattableString> result = new List<FormattableString>();

            BreakLinesCore(input, formatBuilder, args, result);

            // if formatBuilder is not empty at end, add it to result
            if (formatBuilder.Length > 0)
            {
                FormattableString formattableString = FormattableStringFactory.Create(formatBuilder.ToString(), args.ToArray());
                result.Add(formattableString);
            }
            return result;
        }

        private static void BreakLinesCore(FormattableString input, StringBuilder formatBuilder, List<object?> args, List<FormattableString> result)
        {
            Span<Range> splitIndices = stackalloc Range[input.Format.Length];
            foreach ((ReadOnlySpan<char> span, bool isLiteral, int index) in StringExtensions.GetFormattableStringFormatParts(input.Format))
            {
                // if isLiteral - put in formatBuilder
                if (isLiteral)
                {
                    var numSplits = span.SplitAny(splitIndices, ["\r\n", "\n"]);
                    for (int i = 0; i < numSplits; i++)
                    {
                        var part = span[splitIndices[i]];
                        // the literals could contain { and }, but they are unescaped. Since we are putting them back into the format, we need to escape them again.
                        var startsWithCurlyBrace = part.Length > 0 && (part[0] == '{' || part[0] == '}');
                        var start = startsWithCurlyBrace ? 1 : 0;
                        var endsWithCurlyBrace = part.Length > 0 && (part[^1] == '{' || part[^1] == '}');
                        var end = endsWithCurlyBrace ? part.Length - 1 : part.Length;
                        if (startsWithCurlyBrace)
                        {
                            formatBuilder.Append(part[0]).Append(part[0]);
                        }
                        if (start <= end) // ensure that we have follow up characters before we move on
                        {
                            formatBuilder.Append(part[start..end]);
                            if (endsWithCurlyBrace)
                            {
                                formatBuilder.Append(part[^1]).Append(part[^1]);
                            }
                        }
                        if (i < numSplits - 1)
                        {
                            FormattableString formattableString = FormattableStringFactory.Create(formatBuilder.ToString(), args.ToArray());
                            result.Add(formattableString);
                            formatBuilder.Clear();
                            args.Clear();
                        }
                    }
                }
                // if not Literal, is Args - recurse through Args and check if args has breaklines
                else
                {
                    var arg = input.GetArgument(index);
                    // when span has a format specifier, go into else case
                    // if span contains ':' we don't need to split arg and add it directly to FormatBuilder
                    // TODO: The following logic of the FormatSpecifier handling is temporary until we have a case where FormatSpecifier and \n both exist in an argument.
                    // TODO: https://github.com/microsoft/typespec/issues/5255
                    if (!span.Contains(':') && arg is string str)
                    {
                        ReadOnlySpan<char> strSpan = str.AsSpan();
                        int start = 0, end = 0;
                        bool isLast = false;
                        // go into the loop when there are characters left
                        while (end < strSpan.Length)
                        {
                            // we should not check both `\r\n` and `\n` because `\r\n` contains `\n`, if we use `IndexOf` to check both of them, there must be duplicate searches and we cannot have O(n) time complexity.
                            var indexOfLF = strSpan[start..].IndexOf('\n');
                            // check if the line already ends.
                            if (indexOfLF < 0)
                            {
                                end = strSpan.Length;
                                isLast = true;
                            }
                            else
                            {
                                end = start + indexOfLF;
                            }
                            // omit \r if there is one before the \n to include the case that line breaks are using \r\n
                            int partEnd = end;
                            if (end > 0 && strSpan[end - 1] == '\r')
                            {
                                partEnd--;
                            }

                            formatBuilder.Append('{')
                                .Append(args.Count)
                                .Append('}');
                            args.Add(strSpan[start..partEnd].ToString());
                            start = end + 1; // goes to the next char after the \n we found

                            if (!isLast)
                            {
                                FormattableString formattableString = FormattableStringFactory.Create(formatBuilder.ToString(), args.ToArray());
                                result.Add(formattableString);
                                formatBuilder.Clear();
                                args.Clear();
                            }
                        }
                    }
                    else if (!span.Contains(':') && arg is FormattableString fs)
                    {
                        BreakLinesCore(fs, formatBuilder, args, result);
                    }
                    else
                    {
                        // if not a string or FormattableString, add to args because we cannot parse it
                        // add to FormatBuilder to maintain equal count between args and formatBuilder
                        formatBuilder.Append('{');
                        formatBuilder.Append(args.Count);
                        var indexOfFormatSpecifier = span.IndexOf(':');
                        if (indexOfFormatSpecifier >= 0)
                        {
                            formatBuilder.Append(span[indexOfFormatSpecifier..]);
                        }
                        formatBuilder.Append('}');
                        args.Add(arg);
                    }
                }
            }
        }
    }
}
