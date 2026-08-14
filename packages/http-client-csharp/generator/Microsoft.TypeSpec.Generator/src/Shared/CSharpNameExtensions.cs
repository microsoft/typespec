// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics.CodeAnalysis;
using System.Text;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    internal static class CSharpNameExtensions
    {
        private static readonly (string Source, string Replacement)[] _acronymRenamingRules =
        [
            ("iPv4", "IPv4"),
            ("iPv6", "IPv6"),
            ("Ipv4", "IPv4"),
            ("Ipv6", "IPv6"),
            ("IpV4", "IPv4"),
            ("IpV6", "IPv6"),
            ("Ip", "IP"),
            ("Db", "DB"),
            ("Os", "OS")
        ];

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

        [return: NotNullIfNotNull(nameof(name))]
        public static string? NormalizeCSharpUrlSuffix(this string? name)
            => !string.IsNullOrEmpty(name) && name.EndsWith("Url", StringComparison.Ordinal)
                ? $"{name.Substring(0, name.Length - 3)}Uri"
                : name;
    }
}
