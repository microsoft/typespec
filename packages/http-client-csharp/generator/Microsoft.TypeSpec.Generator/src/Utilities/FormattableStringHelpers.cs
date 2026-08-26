// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator
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

            // tracks whether the previously processed part ended with a lone '\r' whose matching '\n' (if any)
            // has not been observed yet, so a CRLF split across an interpolation boundary is still treated as
            // a single line terminator instead of two.
            bool pendingCR = false;
            var hasEmptyLastLine = BreakLinesCore(input, formatBuilder, args, result, ref pendingCR);

            // if formatBuilder is not empty at end, add it to result
            // or when the last char is line break, we should also construct one and add it into the result
            if (formatBuilder.Length > 0 || hasEmptyLastLine)
            {
                FormattableString formattableString = FormattableStringFactory.Create(formatBuilder.ToString(), args.ToArray());
                result.Add(formattableString);
            }
            return result;
        }

        private static bool BreakLinesCore(FormattableString input, StringBuilder formatBuilder, List<object?> args, List<FormattableString> result, ref bool pendingCR)
        {
            // stackalloc cannot be used in a loop, we must allocate it here. The buffer is sized from the pre-normalization
            // format length because normalization must not expand the input. A format containing only line feeds produces
            // the maximum of n+1 segments because empty entries are retained.
            Span<Range> splitIndices = stackalloc Range[input.Format.Length + 1];
            ReadOnlySpan<char> formatSpan = input.Format.AsSpan();
            bool hasEmptyLastLine = false;
            foreach ((ReadOnlySpan<char> span, bool isLiteral, int index) in StringExtensions.GetFormattableStringFormatParts(formatSpan))
            {
                // if isLiteral - put in formatBuilder
                if (isLiteral)
                {
                    bool hadPendingCR = pendingCR;
                    var literalSpan = span;
                    if (hadPendingCR && literalSpan.Length > 0 && literalSpan[0] == '\n')
                    {
                        // this '\n' completes a CRLF pair whose '\r' ended the previous part; it was already
                        // accounted for as a line break, so it must not also be counted here.
                        literalSpan = literalSpan[1..];
                    }
                    pendingCR = literalSpan.Length > 0 && literalSpan[^1] == '\r';
                    if (hadPendingCR && literalSpan.Length == 0 && span.Length > 0)
                    {
                        // the entire part was the other half of a cross-boundary CRLF pair; nothing new to emit.
                        continue;
                    }
                    var normalizedSpan = literalSpan;
                    if (RequiresNormalization(literalSpan))
                    {
                        normalizedSpan = NormalizeLineTerminators(literalSpan).AsSpan();
                    }
                    Debug.Assert(normalizedSpan.Length <= input.Format.Length);
                    var numSplits = normalizedSpan.Split(splitIndices, '\n');
                    for (int i = 0; i < numSplits; i++)
                    {
                        var part = normalizedSpan[splitIndices[i]];
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
                    hasEmptyLastLine = normalizedSpan.Length > 0 && normalizedSpan[^1] == '\n';
                }
                // if not Literal, is Args - recurse through Args and check if args has breaklines
                else
                {
                    var arg = input.GetArgument(index);
                    // Only plain (unformatted) string arguments are split on line terminators, because those are
                    // written to the output as raw text. Formatted arguments (e.g. ":L") are rendered through a
                    // custom formatter (e.g. SyntaxFactory.Literal) that safely escapes any embedded terminators
                    // into a single C# literal, so splitting them would change the value the documentation represents
                    // without preventing any raw terminator from reaching the output.
                    var indexOfFormatSpecifier = span.IndexOf(':');
                    switch (arg)
                    {
                        case string str when indexOfFormatSpecifier < 0:
                            {
                                if (str.Length == 0)
                                {
                                    // an empty argument emits nothing, so it must not affect the pending CRLF state
                                    // nor the trailing empty line state of the surrounding parts.
                                    break;
                                }
                                bool hadPendingCR = pendingCR;
                                var strSpan = str.AsSpan();
                                if (hadPendingCR && strSpan.Length > 0 && strSpan[0] == '\n')
                                {
                                    // this '\n' completes a CRLF pair whose '\r' ended the previous part.
                                    strSpan = strSpan[1..];
                                }
                                pendingCR = strSpan.Length > 0 && strSpan[^1] == '\r';
                                if (hadPendingCR && strSpan.Length == 0)
                                {
                                    // the entire argument was the other half of a cross-boundary CRLF pair.
                                    break;
                                }
                                BreakLinesCoreForString(strSpan, formatBuilder, args, result);
                                hasEmptyLastLine = false;
                                break;
                            }
                        case FormattableString fs when indexOfFormatSpecifier < 0:
                            hasEmptyLastLine = BreakLinesCore(fs, formatBuilder, args, result, ref pendingCR);
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
                            hasEmptyLastLine = false;
                            break;
                    }
                }
            }

            return hasEmptyLastLine;

            static void BreakLinesCoreForString(
                ReadOnlySpan<char> span,
                StringBuilder formatBuilder,
                List<object?> args,
                List<FormattableString> result)
            {
                if (RequiresNormalization(span))
                {
                    span = NormalizeLineTerminators(span).AsSpan();
                }
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
                    formatBuilder.Append('{')
                        .Append(args.Count);
                    formatBuilder.Append('}');
                    args.Add(span[start..end].ToString());
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

        private static bool IsLineTerminator(char value)
            => value is '\r' or '\n' or '\u0085' or '\u2028' or '\u2029';

        private static bool RequiresNormalization(ReadOnlySpan<char> value)
        {
            foreach (var character in value)
            {
                if (character is '\r' or '\u0085' or '\u2028' or '\u2029')
                {
                    return true;
                }
            }
            return false;
        }

        private static string NormalizeLineTerminators(ReadOnlySpan<char> value)
        {
            int normalizedLength = value.Length;
            for (int i = 0; i < value.Length; i++)
            {
                if (value[i] == '\r' && i + 1 < value.Length && value[i + 1] == '\n')
                {
                    normalizedLength--;
                    i++;
                }
            }

            return string.Create(
                normalizedLength,
                value,
                static (destination, source) =>
                {
                    int destinationIndex = 0;
                    for (int sourceIndex = 0; sourceIndex < source.Length; sourceIndex++)
                    {
                        var character = source[sourceIndex];
                        if (character == '\r' && sourceIndex + 1 < source.Length && source[sourceIndex + 1] == '\n')
                        {
                            sourceIndex++;
                        }
                        destination[destinationIndex++] = IsLineTerminator(character) ? '\n' : character;
                    }
                });
        }
    }
}
