// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Security.AccessControl;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Diagnostics.CodeAnalysis;

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

        public static FormattableString GetTypesFormattable(this IReadOnlyCollection<Parameter> parameters)
            => GetTypesFormattable(parameters, parameters.Count);

        public static FormattableString GetTypesFormattable(this IEnumerable<Parameter> parameters, int count)
            => Join(parameters, count, static p => p.Type, ",", null, null);

        public static string ReplaceLast(this string text, string oldValue, string newValue)
        {
            var position = text.LastIndexOf(oldValue, StringComparison.Ordinal);
            return position < 0 ? text : text.Substring(0, position) + newValue + text.Substring(position + oldValue.Length);
        }

        public static FormattableString GetReferenceFormattable(this Reference reference)
        {
            var parts = reference.Name.Split(".").ToArray<object>();
            return Join(parts, parts.Length, static s => s, ".", null, 'I');
        }

        public static FormattableString GetReferenceOrConstantFormattable(this ReferenceOrConstant value)
            => value.IsConstant ? value.Constant.GetConstantFormattable() : value.Reference.GetReferenceFormattable();

        /// <summary>
        /// This method parses the <see cref="Constant"/> into a <see cref="FormattableString"/>.
        /// </summary>
        /// <param name="constant">The <see cref="Constant"/> to parse.</param>
        /// <param name="writeAsString">Flag used to determine if the constant should be written as a string.</param>
        /// <returns>The <see cref="FormattableString"/> representing the <see cref="Constant"/>.</returns>
        internal static FormattableString GetConstantFormattable(this Constant constant, bool writeAsString = false)
        {
            if (constant.Value == null)
            {
                // Cast helps the overload resolution
                return $"({constant.Type}){null:L}";
            }

            if (constant.IsNewInstanceSentinel)
            {
                return $"new {constant.Type}()";
            }

            if (constant.Value is Constant.Expression expression)
            {
                return expression.ExpressionValue;
            }
            // TO-DO: Implement once enum types are implemented : https://github.com/Azure/autorest.csharp/issues/4198
            //if (constant is { Type: { IsFrameworkType: false }, Value: EnumTypeValue enumTypeValue })
            //{
            //    return $"{constant.Type}.{enumTypeValue.Declaration.Name}";
            //}


            if (constant.Type is { IsFrameworkType: false, Implementation: EnumType enumType })
            {
                if (enumType.IsStringValueType)
                    return $"new {constant.Type}({constant.Value:L})";
                else
                    return $"new {constant.Type}(({enumType.ValueType}){constant.Value})";
            }

            Type frameworkType = constant.Type.FrameworkType;
            if (frameworkType == typeof(DateTimeOffset))
            {
                var d = (DateTimeOffset)constant.Value;
                d = d.ToUniversalTime();
                return $"new {typeof(DateTimeOffset)}({d.Year:L}, {d.Month:L}, {d.Day:L} ,{d.Hour:L}, {d.Minute:L}, {d.Second:L}, {d.Millisecond:L}, {typeof(TimeSpan)}.{nameof(TimeSpan.Zero)})";
            }

            if (frameworkType == typeof(byte[]))
            {
                var bytes = (byte[])constant.Value;
                var joinedBytes = string.Join(", ", bytes);
                return $"new byte[] {{{joinedBytes}}}";
            }

            if (frameworkType == typeof(ResourceType))
            {
                return $"{((ResourceType)constant.Value).ToString():L}";
            }

            if (frameworkType == typeof(bool) && writeAsString)
            {
                return $"\"{constant.Value!.ToString()!.ToLower()}\"";
            }

            return $"{constant.Value:L}";
        }
    }
}
