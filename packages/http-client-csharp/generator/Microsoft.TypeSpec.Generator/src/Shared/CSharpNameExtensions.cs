// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    internal static class CSharpNameExtensions
    {
        private const string DateSuffix = "Date";
        private const string DateTimeSuffix = "DateTime";
        private const string FromName = "From";
        private const string LowercaseOnSuffix = "on";
        private const string OnSuffix = "On";
        private const string PointInTimeName = "PointInTime";
        private const string TimeStampSuffix = "TimeStamp";
        private const string TimeSuffix = "Time";
        private const string TimestampSuffix = "Timestamp";
        private const string ToName = "To";
        private const string AtSuffix = "At";

        private static readonly (string Source, string Replacement)[] _acronymRenamingRules =
        [
            ("Ipv4", "IPv4"),
            ("Ipv6", "IPv6"),
            ("IpV4", "IPv4"),
            ("IpV6", "IPv6"),
            ("Ip", "IP"),
            ("Db", "DB"),
            ("Os", "OS")
        ];

        private static readonly HashSet<string> _dateTimeNameExclusions = new(StringComparer.OrdinalIgnoreCase)
        {
            FromName,
            ToName,
            PointInTimeName
        };

        public static string NormalizeCSharpAcronyms(this string name, bool normalizeDateTimeSuffix = false)
        {
            var suffixLength = normalizeDateTimeSuffix && !HasExcludedDateTimeNameComponent(name)
                ? GetDateTimeSuffixLength(name)
                : 0;
            StringBuilder? normalizedName = suffixLength > 0 ? new(name.Length - suffixLength + OnSuffix.Length) : null;
            int segmentStart = 0;
            for (int index = 0; index < name.Length - 1; index++)
            {
                foreach (var rule in _acronymRenamingRules)
                {
                    if (!name.AsSpan(index).StartsWith(rule.Source, StringComparison.Ordinal))
                    {
                        continue;
                    }

                    int boundaryIndex = index + rule.Source.Length;
                    if (boundaryIndex < name.Length && !char.IsUpper(name[boundaryIndex]))
                    {
                        continue;
                    }

                    normalizedName ??= new StringBuilder(name.Length);
                    normalizedName.Append(name, segmentStart, index - segmentStart);
                    normalizedName.Append(rule.Replacement);
                    segmentStart = boundaryIndex;
                    index = boundaryIndex - 1;
                    break;
                }
            }

            if (normalizedName is null)
            {
                return name;
            }

            normalizedName.Append(name, segmentStart, name.Length - suffixLength - segmentStart);
            if (suffixLength > 0)
            {
                normalizedName.Append(name.Length == suffixLength && char.IsLower(name[0]) ? LowercaseOnSuffix : OnSuffix);
            }
            return normalizedName.ToString();
        }

        public static string NormalizeDateTimeSuffix(this string name)
        {
            if (HasExcludedDateTimeNameComponent(name))
            {
                return name;
            }

            var suffixLength = GetDateTimeSuffixLength(name);
            if (suffixLength == 0)
            {
                return name;
            }

            var prefix = name[..^suffixLength];
            var onSuffix = prefix.Length == 0 && char.IsLower(name[0]) ? LowercaseOnSuffix : OnSuffix;
            return prefix + onSuffix;
        }

        private static bool HasExcludedDateTimeNameComponent(string name)
        {
            var lookup = _dateTimeNameExclusions.GetAlternateLookup<ReadOnlySpan<char>>();
            return (name.Length >= FromName.Length && lookup.Contains(name.AsSpan(0, FromName.Length))) ||
                (name.Length >= ToName.Length && lookup.Contains(name.AsSpan(0, ToName.Length))) ||
                (name.Length >= PointInTimeName.Length && lookup.Contains(name.AsSpan(^PointInTimeName.Length)));
        }

        private static int GetDateTimeSuffixLength(string name)
        {
            if (name.EndsWith(TimestampSuffix, StringComparison.Ordinal) ||
                name.EndsWith(TimeStampSuffix, StringComparison.Ordinal))
            {
                return TimestampSuffix.Length;
            }

            if (name.Equals(TimestampSuffix, StringComparison.OrdinalIgnoreCase))
            {
                return TimestampSuffix.Length;
            }

            if (name.Length > DateTimeSuffix.Length && name.EndsWith(DateTimeSuffix, StringComparison.Ordinal))
            {
                return DateTimeSuffix.Length;
            }

            if (name.Length > TimeSuffix.Length && name.EndsWith(TimeSuffix, StringComparison.Ordinal))
            {
                return TimeSuffix.Length;
            }

            if (name.Equals(DateSuffix, StringComparison.OrdinalIgnoreCase))
            {
                return DateSuffix.Length;
            }

            if (name.EndsWith(DateSuffix, StringComparison.Ordinal))
            {
                return DateSuffix.Length;
            }

            if (name.Length > AtSuffix.Length && name.EndsWith(AtSuffix, StringComparison.Ordinal))
            {
                return AtSuffix.Length;
            }

            return 0;
        }

        public static bool IsDateTimeInputType(this InputType inputType) => inputType switch
        {
            InputDateTimeType => true,
            InputPrimitiveType { Kind: InputPrimitiveTypeKind.PlainDate } => true,
            InputNullableType nullableType => IsDateTimeInputType(nullableType.Type),
            _ => false
        };
        [return: NotNullIfNotNull(nameof(name))]
        public static string? NormalizeCSharpUrlSuffix(this string? name)
            => !string.IsNullOrEmpty(name) && name.EndsWith("Url", StringComparison.Ordinal)
                ? $"{name.Substring(0, name.Length - 3)}Uri"
                : name;
    }
}
