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

            var hasEmptyLastLine = BreakLinesCore(input, formatBuilder, args, result);

            // if formatBuilder is not empty at end, add it to result
            // or when the last char is line break, we should also construct one and add it into the result
            if (formatBuilder.Length > 0 || hasEmptyLastLine)
            {
                FormattableString formattableString = FormattableStringFactory.Create(formatBuilder.ToString(), args.ToArray());
                result.Add(formattableString);
            }
            return result;
        }

        private static bool BreakLinesCore(FormattableString input, StringBuilder formatBuilder, List<object?> args, List<FormattableString> result)
        {
            // stackalloc cannot be used in a loop, we must allocate it here.
            // for a format string with length n, the worst case that produces the most segments is when all its content is the char to split.
            // For instance, when the format string is all \n, it will produce n+1 segments (because we did not omit empty entries).
            Span<Range> splitIndices = stackalloc Range[input.Format.Length + 1];
            ReadOnlySpan<char> formatSpan = input.Format.AsSpan();
            foreach ((ReadOnlySpan<char> span, bool isLiteral, int index) in StringExtensions.GetFormattableStringFormatParts(formatSpan))
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
                    // we only break lines in the arguments if the argument is a string or FormattableString and it does not have a format specifier (indicating by : in span)
                    // we do nothing if the argument has a format specifier because we do not really know in which form to break them
                    // considering the chance of having these cases would be very rare, we are leaving the part of "arguments with formatter specifier" empty
                    var indexOfFormatSpecifier = span.IndexOf(':');
                    switch (arg)
                    {
                        case string str when indexOfFormatSpecifier < 0:
                            BreakLinesCoreForString(str.AsSpan(), formatBuilder, args, result);
                            break;
                        case FormattableString fs when indexOfFormatSpecifier < 0:
                            BreakLinesCore(fs, formatBuilder, args, result);
                            break;
                        default:
                            // if not a string or FormattableString, add to args because we cannot parse it
                            // add to FormatBuilder to maintain equal count between args and formatBuilder
                            formatBuilder.Append('{');
                            formatBuilder.Append(args.Count);
                            if (indexOfFormatSpecifier >= 0)
                            {
                                formatBuilder.Append(span[indexOfFormatSpecifier..]);
                            }
                            formatBuilder.Append('}');
                            args.Add(arg);
                            break;
                    }
                }
            }

            return formatSpan[^1] == '\n';

            static void BreakLinesCoreForString(ReadOnlySpan<char> span, StringBuilder formatBuilder, List<object?> args, List<FormattableString> result)
            {
                int start = 0, end = 0;
                bool isLast = false;
                // go into the loop when there are characters left
                while (end < span.Length)
                {
                    // we should not check both `\r\n` and `\n` because `\r\n` contains `\n`, if we use `IndexOf` to check both of them, there must be duplicate searches and we cannot have O(n) time complexity.
                    var indexOfLF = span[start..].IndexOf('\n');
                    // check if the line already ends.
                    if (indexOfLF < 0)
                    {
                        end = span.Length;
                        isLast = true;
                    }
                    else
                    {
                        end = start + indexOfLF;
                    }
                    // omit \r if there is one before the \n to include the case that line breaks are using \r\n
                    int partEnd = end;
                    if (end > 0 && span[end - 1] == '\r')
                    {
                        partEnd--;
                    }

                    formatBuilder.Append('{')
                        .Append(args.Count)
                        .Append('}');
                    args.Add(span[start..partEnd].ToString());
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
        }
    }
}
