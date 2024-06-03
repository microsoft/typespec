// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Security.AccessControl;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Diagnostics.CodeAnalysis;
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
    }
}
