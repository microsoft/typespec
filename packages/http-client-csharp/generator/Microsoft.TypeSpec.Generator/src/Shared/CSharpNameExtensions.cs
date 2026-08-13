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

        private static readonly Dictionary<string, string> _dateTimeNounRenamingRules = new(StringComparer.Ordinal)
        {
            ["Creation"] = "Created",
            ["creation"] = "created",
            ["Deletion"] = "Deleted",
            ["deletion"] = "deleted",
            ["Expiration"] = "Expire",
            ["expiration"] = "expire",
            ["Modification"] = "Modified",
            ["modification"] = "modified"
        };

        public static string NormalizeCSharpAcronyms(this string name)
        {
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

        public static string NormalizeDateTimeSuffix(this string name, InputType inputType)
        {
            if (!IsDateTimeInputType(inputType) ||
                name.StartsWith("From", StringComparison.Ordinal) ||
                name.StartsWith("from", StringComparison.Ordinal) ||
                name.StartsWith("To", StringComparison.Ordinal) ||
                name.StartsWith("to", StringComparison.Ordinal) ||
                name.EndsWith("PointInTime", StringComparison.Ordinal) ||
                name.Equals("pointInTime", StringComparison.Ordinal))
            {
                return name;
            }

            var suffixLength = GetDateTimeSuffixLength(name);
            if (suffixLength == 0)
            {
                return name;
            }

            var prefix = name[..^suffixLength];
            if (_dateTimeNounRenamingRules.TryGetValue(prefix, out var replacement))
            {
                prefix = replacement;
            }

            var onSuffix = prefix.Length == 0 && char.IsLower(name[0]) ? "on" : "On";
            return prefix + onSuffix;
        }

        private static int GetDateTimeSuffixLength(string name)
        {
            if (name.EndsWith("Timestamp", StringComparison.Ordinal) ||
                name.EndsWith("TimeStamp", StringComparison.Ordinal))
            {
                return 9;
            }

            if (name.Equals("timestamp", StringComparison.Ordinal) ||
                name.Equals("timeStamp", StringComparison.Ordinal))
            {
                return 9;
            }

            if (name.Length > 8 && name.EndsWith("DateTime", StringComparison.Ordinal))
            {
                return 8;
            }

            if ((name.Length > 4 && name.EndsWith("Time", StringComparison.Ordinal)) ||
                name.EndsWith("Date", StringComparison.Ordinal))
            {
                return 4;
            }

            if (name.Equals("date", StringComparison.Ordinal))
            {
                return 4;
            }

            if (name.Length > 2 && name.EndsWith("At", StringComparison.Ordinal))
            {
                return 2;
            }

            return 0;
        }

        private static bool IsDateTimeInputType(InputType inputType) => inputType switch
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
