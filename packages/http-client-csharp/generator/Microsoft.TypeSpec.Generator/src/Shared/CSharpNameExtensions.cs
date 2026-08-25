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

        public static string NormalizeCSharpAcronyms(this string name, bool normalizeDateTimeSuffix = false)
        {
            name = normalizeDateTimeSuffix ? name.NormalizeDateTimeSuffix() : name;
            StringBuilder? normalizedName = null;
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

            normalizedName.Append(name, segmentStart, name.Length - segmentStart);
            return normalizedName.ToString();
        }

        public static string NormalizeDateTimeSuffix(this string name)
        {
            var suffixLength = DateTimeNameRules.GetSuffixLength(name);
            if (suffixLength == 0 ||
                suffixLength == name.Length ||
                DateTimeNameRules.HasExcludedComponent(name, suffixLength))
            {
                return name;
            }

            var prefix = DateTimeNameRules.ToVerbForm(name[..^suffixLength]);
            var onSuffix = prefix.Length == 0 && char.IsLower(name[0])
                ? DateTimeNameRules.LowercaseOnSuffix
                : DateTimeNameRules.OnSuffix;
            return prefix + onSuffix;
        }

        private static class DateTimeNameRules
        {
            private const string AtSuffix = "At";
            private const string DateSuffix = "Date";
            private const string DateTimeSuffix = "DateTime";
            private const string FirstName = "First";
            private const string FromName = "From";
            private const string LastName = "Last";
            internal const string LowercaseOnSuffix = "on";
            internal const string OnSuffix = "On";
            private const string PointInTimeName = "PointInTime";
            private const string StatusTimeStampName = "StatusTimeStamp";
            private const string StatusTimestampName = "StatusTimestamp";
            private const string TimeStampSuffix = "TimeStamp";
            private const string TimeSuffix = "Time";
            private const string TimestampSuffix = "Timestamp";
            private const string ToName = "To";

            // Complete prefixes that read better as verbs when combined with the "On" suffix.
            private static readonly Dictionary<string, string> _nounToVerbMap = new(StringComparer.OrdinalIgnoreCase)
            {
                ["Creation"] = "Created",
                ["Deletion"] = "Deleted",
                ["End"] = "Ends",
                ["Expiration"] = "Expires",
                ["Modification"] = "Modified",
                ["Start"] = "Starts"
            };

            internal static string ToVerbForm(string prefix)
            {
                if (_nounToVerbMap.TryGetValue(prefix, out var verb))
                {
                    return char.IsLower(prefix[0])
                        ? char.ToLowerInvariant(verb[0]) + verb[1..]
                        : verb;
                }

                foreach (var (noun, compoundVerb) in _nounToVerbMap)
                {
                    if (prefix.Length > noun.Length &&
                        prefix.EndsWith(noun, StringComparison.OrdinalIgnoreCase) &&
                        char.IsUpper(prefix[^noun.Length]))
                    {
                        return prefix[..^noun.Length] + compoundVerb;
                    }
                }

                return prefix;
            }

            internal static bool HasExcludedComponent(string name, int suffixLength)
            {
                // StatusTimestamp is a semantic compound. Keep the exclusion exact so names such as
                // LastSyncTimestamp continue to normalize.
                var prefix = name.AsSpan(0, name.Length - suffixLength);
                return prefix.Equals(FirstName, StringComparison.OrdinalIgnoreCase) ||
                    prefix.Equals(LastName, StringComparison.OrdinalIgnoreCase) ||
                    name.StartsWith(FromName, StringComparison.OrdinalIgnoreCase) ||
                    name.StartsWith(ToName, StringComparison.OrdinalIgnoreCase) ||
                    name.EndsWith(PointInTimeName, StringComparison.OrdinalIgnoreCase) ||
                    name.Equals(StatusTimestampName, StringComparison.OrdinalIgnoreCase) ||
                    name.Equals(StatusTimeStampName, StringComparison.OrdinalIgnoreCase);
            }

            internal static int GetSuffixLength(string name)
            {
                if (name.EndsWith(TimestampSuffix, StringComparison.Ordinal) ||
                    name.EndsWith(TimeStampSuffix, StringComparison.Ordinal) ||
                    name.Equals(TimestampSuffix, StringComparison.OrdinalIgnoreCase))
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

                if (name.Equals(DateSuffix, StringComparison.OrdinalIgnoreCase) ||
                    name.EndsWith(DateSuffix, StringComparison.Ordinal))
                {
                    return DateSuffix.Length;
                }

                if (name.Length > OnSuffix.Length && name.EndsWith(OnSuffix, StringComparison.Ordinal))
                {
                    return OnSuffix.Length;
                }

                return name.Length > AtSuffix.Length && name.EndsWith(AtSuffix, StringComparison.Ordinal)
                    ? AtSuffix.Length
                    : 0;
            }
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
